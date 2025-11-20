import React, { useState, useEffect } from 'react'
import { IoFilter } from "react-icons/io5";
import { BiSort } from "react-icons/bi";
import { MdCheckCircle, MdCancel } from "react-icons/md";
import { getMaintenanceRequestsByUnitId } from '../../api/services/maintenance.service';

function MaintenanceLogTable({ unitId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, cancelled

  useEffect(() => {
    if (unitId) {
      fetchLogs();
    }
  }, [unitId, filterStatus]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Get all maintenance requests for this unit
      const data = await getMaintenanceRequestsByUnitId(unitId);
      
      // Filter only completed and cancelled
      const completedOrCancelled = data.filter(req => 
        req.status === 'COMPLETED' || req.status === 'CANCELLED'
      );
      
      setLogs(completedOrCancelled);
    } catch (error) {
      console.error('Error fetching maintenance logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    if (status === 'COMPLETED') {
      return (
        <span className='flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs'>
          <MdCheckCircle /> Completed
        </span>
      );
    }
    return (
      <span className='flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs'>
        <MdCancel /> Cancelled
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const colors = {
      'PLUMBING': 'bg-blue-100 text-blue-800',
      'ELECTRICAL': 'bg-yellow-100 text-yellow-800',
      'HVAC': 'bg-cyan-100 text-cyan-800',
      'APPLIANCE': 'bg-purple-100 text-purple-800',
      'STRUCTURAL': 'bg-red-100 text-red-800',
      'CLEANING': 'bg-green-100 text-green-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return `฿${parseFloat(amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
  };

  const filteredLogs = logs.filter(log => {
    if (filterStatus === 'all') return true;
    return log.status.toLowerCase() === filterStatus.toUpperCase();
  }).sort((a, b) => {
    const dateA = new Date(a.completedDate || a.updatedAt);
    const dateB = new Date(b.completedDate || b.updatedAt);
    return dateB - dateA; // Newest first
  });

  return (
    <div className='bg-white rounded-2xl shadow-md'>
        {/* Title */}
        <div className='px-6 py-4 border-b border-gray-200'>
            <div className='flex justify-between items-center'>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Maintenance History</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Completed and cancelled maintenance records for this unit
                </p>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='border-2 py-2 px-4 rounded-lg text-sm'
              >
                <option value="all">All Status</option>
                <option value="completed">Completed Only</option>
                <option value="cancelled">Cancelled Only</option>
              </select>
            </div>
        </div>
        

        <div className='overflow-x-auto'>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className='bg-gray-50'>
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>

                <tbody className='bg-white divide-y divide-gray-200'>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-gray-400">
                          Loading maintenance history...
                        </td>
                      </tr>
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-10 text-center text-gray-400">
                          {filterStatus === 'all' 
                            ? 'No maintenance records yet for this unit.'
                            : `No ${filterStatus} maintenance records.`
                          }
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className='hover:bg-gray-50'>
                            <td className="px-6 py-4">
                              <div className='text-sm font-medium text-gray-900'>{log.title}</div>
                              <div className='text-xs text-gray-500 truncate max-w-xs'>
                                {log.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded ${getCategoryBadge(log.category)}`}>
                                {log.category || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(log.submittedDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(log.completedDate || log.updatedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(log.actualCost || log.estimatedCost)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(log.status)}
                            </td>
                        </tr>
                      ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
  )
}

export default MaintenanceLogTable