import React, { useState, useEffect } from 'react';
import { FiClock, FiDollarSign, FiUser, FiCalendar, FiFilter, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import apiClient from '../../../api/client/apiClient';

function LogPage() {
  const [logs, setLogs] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [selectedActionType, setSelectedActionType] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchUnits();
    fetchLogs();
  }, []);

  const fetchUnits = async () => {
    try {
      const data = await apiClient.get('/units');
      setUnits(data);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all unit audit logs
      const data = await apiClient.get('/unit-audit-logs');
      
      // Sort by createdAt descending
      const sortedLogs = data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setLogs(sortedLogs);
    } catch (err) {
      setError(err.message || 'Failed to fetch logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (selectedUnit !== 'all') params.append('unitId', selectedUnit);
      if (selectedActionType !== 'all') params.append('actionType', selectedActionType);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      
      const queryString = params.toString();
      const endpoint = queryString 
        ? `/unit-audit-logs/search?${queryString}`
        : '/unit-audit-logs';
      
      console.log('Fetching logs from:', endpoint);
      const data = await apiClient.get(endpoint);
      console.log('Received logs:', data);
      
      const sortedLogs = data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setLogs(sortedLogs);
    } catch (err) {
      console.error('Filter error:', err);
      setError(err.message || 'Failed to filter logs');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedUnit('all');
    setSelectedActionType('all');
    setDateRange({ startDate: '', endDate: '' });
    fetchLogs();
  };

  const getActionBadgeColor = (actionType) => {
    const colors = {
      PRICE_CHANGED: 'bg-blue-100 text-blue-800',
      PRICE_CHANGE: 'bg-blue-100 text-blue-800',
      STATUS_CHANGED: 'bg-green-100 text-green-800',
      STATUS_CHANGE: 'bg-green-100 text-green-800',
      CREATED: 'bg-purple-100 text-purple-800',
      CREATE: 'bg-purple-100 text-purple-800',
      UPDATED: 'bg-yellow-100 text-yellow-800',
      UPDATE: 'bg-yellow-100 text-yellow-800',
      DELETED: 'bg-red-100 text-red-800',
      DELETE: 'bg-red-100 text-red-800',
      RESTORED: 'bg-indigo-100 text-indigo-800'
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  const getUnitName = (unitId, roomNumber) => {
    // If roomNumber is provided (from log), use it
    if (roomNumber) return roomNumber;
    
    // Otherwise try to find from units list
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.roomNumber : `Unit #${unitId || 'Unknown'}`;
  };

  const parsePriceChange = (log) => {
    try {
      if (log.actionType !== 'PRICE_CHANGE' && log.actionType !== 'PRICE_CHANGED') return null;
      
      const oldValue = log.oldValues ? JSON.parse(log.oldValues) : null;
      const newValue = log.newValues ? JSON.parse(log.newValues) : null;
      
      // Handle both snake_case (from DB trigger) and camelCase
      const oldPrice = oldValue?.rent_amount || oldValue?.rentAmount || oldValue?.rentPrice || 0;
      const newPrice = newValue?.rent_amount || newValue?.rentAmount || newValue?.rentPrice || 0;
      
      return {
        oldPrice: parseFloat(oldPrice) || 0,
        newPrice: parseFloat(newPrice) || 0,
        difference: (parseFloat(newPrice) || 0) - (parseFloat(oldPrice) || 0)
      };
    } catch (err) {
      console.error('Error parsing price change:', err, log);
      return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const getRoomNumberFromLog = (log) => {
    try {
      // First try to get from log.roomNumber field
      if (log.roomNumber) return log.roomNumber;
      
      // Then try to parse from oldValues or newValues
      const oldValues = log.oldValues ? JSON.parse(log.oldValues) : null;
      const newValues = log.newValues ? JSON.parse(log.newValues) : null;
      
      return oldValues?.room_number || newValues?.room_number || null;
    } catch (err) {
      console.error('Error parsing room number:', err);
      return null;
    }
  };

  const handleRestore = async (log) => {
    if (!window.confirm(`Are you sure you want to restore ${getRoomNumberFromLog(log) || 'this unit'}?`)) {
      return;
    }

    try {
      const oldValues = JSON.parse(log.oldValues);
      
      // Create new unit with old data
      await apiClient.post('/units', {
        roomNumber: oldValues.room_number,
        floor: oldValues.floor,
        type: oldValues.type,
        rentAmount: oldValues.rent_amount,
        status: 'AVAILABLE', // Set to available after restore
        sizeSqm: oldValues.size_sqm,
        description: oldValues.description
      });

      alert('Unit restored successfully!');
      fetchLogs();
    } catch (err) {
      console.error('Error restoring unit:', err);
      alert('Failed to restore unit: ' + (err.message || 'Unknown error'));
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Unit Change Logs</h1>
        <p className="text-gray-600 mt-2">ประวัติการเปลี่ยนแปลงข้อมูลห้องพัก รวมถึงการเปลี่ยนแปลงราคา</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Unit Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Units</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.roomNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Action Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Type
            </label>
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="CREATED">Create</option>
              <option value="UPDATED">Update</option>
              <option value="PRICE_CHANGED">Price Change</option>
              <option value="STATUS_CHANGED">Status Change</option>
              <option value="DELETED">Delete</option>
              <option value="RESTORED">Restore</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleFilterChange}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Logs List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <FiClock className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 text-lg">No logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {logs.map((log) => {
              const priceChange = parsePriceChange(log);
              
              return (
                <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionBadgeColor(log.actionType)}`}>
                          {log.actionType.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">
                          {getUnitName(log.unitId, getRoomNumberFromLog(log))}
                        </span>
                      </div>

                      {/* Price Change Details */}
                      {priceChange && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-gray-600 mb-1">ราคาเก่า</div>
                              <div className="text-xl font-bold text-gray-700">
                                {formatCurrency(priceChange.oldPrice)}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {priceChange.difference > 0 ? (
                                <FiTrendingUp className="text-green-500" size={24} />
                              ) : (
                                <FiTrendingDown className="text-red-500" size={24} />
                              )}
                            </div>
                            
                            <div>
                              <div className="text-sm text-gray-600 mb-1">ราคาใหม่</div>
                              <div className="text-xl font-bold text-blue-600">
                                {formatCurrency(priceChange.newPrice)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className={`text-sm font-semibold ${priceChange.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {priceChange.difference > 0 ? '+' : ''}{formatCurrency(priceChange.difference)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Changes Description */}
                      {log.description && (
                        <div className="text-sm text-gray-600 mb-3">
                          {log.description}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <FiUser size={14} />
                          <span>Changed by: <span className="font-medium">{log.performedByUsername || 'System'}</span></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiCalendar size={14} />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                        {log.ipAddress && (
                          <div className="flex items-center gap-1">
                            <span>IP: {log.ipAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Restore Button for DELETED logs */}
                    {log.actionType === 'DELETED' && (
                      <div className="ml-4">
                        <button
                          onClick={() => handleRestore(log)}
                          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2 text-sm font-medium"
                          title="Restore this unit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Restore
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {logs.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {logs.length} log {logs.length === 1 ? 'entry' : 'entries'}
        </div>
      )}
    </div>
  );
}

export default LogPage;
