import React, { useState, useEffect } from 'react'
import { IoFilter } from "react-icons/io5";
import { BiSort } from "react-icons/bi";
import { MdCheckCircle, MdCancel, MdInfo } from "react-icons/md";
import { getCompletedMaintenanceRequests } from '../../api/services/maintenance.service';

function MaintenanceTable() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, COMPLETED, CANCELLED
  const [sortOrder, setSortOrder] = useState('DESC'); // DESC = newest first, ASC = oldest first
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getCompletedMaintenanceRequests();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching maintenance logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  // Filter and sort logs
  const filteredLogs = logs
    .filter(log => {
      const matchesSearch = 
        log.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.tenantName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        filterStatus === 'ALL' || log.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.completedDate || a.submittedDate);
      const dateB = new Date(b.completedDate || b.submittedDate);
      return sortOrder === 'DESC' ? dateB - dateA : dateA - dateB;
    });

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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return `฿${parseFloat(amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className='bg-white rounded-lg shadow overflow-hidden'>
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-semibold text-gray-800'>Maintenance Logs</h3>
          <span className='text-sm text-gray-500'>
            {filteredLogs.length} {filteredLogs.length === 1 ? 'record' : 'records'}
          </span>
        </div>
        
        <div className='flex lg:flex-row flex-col gap-4'>
          {/* Search Box */}
          <div className='lg:w-1/3 w-full'>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='px-3 py-2 w-full border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none'
              placeholder='Search by title, unit, description...'
            />
          </div>

          {/* Action Buttons */}
          <div className='flex gap-2 lg:ml-auto'>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className='flex items-center gap-2 border-2 py-2 px-4 rounded-lg hover:shadow-md cursor-pointer text-sm'
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
              className='flex items-center gap-2 border-2 py-2 px-4 rounded-lg hover:shadow-md cursor-pointer text-sm'
            >
              <BiSort />{sortOrder === 'DESC' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className='overflow-x-auto'>
        {loading ? (
          <div className='text-center py-12 text-gray-500'>
            Loading maintenance logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className='text-center py-12 text-gray-500'>
            {searchQuery || filterStatus !== 'ALL' 
              ? 'No logs found matching your filters' 
              : 'No maintenance logs yet'}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className='bg-gray-50'>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>

            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredLogs.map((log) => (
                <tr key={log.id} className='hover:bg-gray-50'>
                  <td className="px-6 py-4">
                    <div className='text-sm font-medium text-gray-900'>{log.title}</div>
                    <div className='text-xs text-gray-500 truncate max-w-xs'>
                      {log.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className='text-sm font-medium'>{log.roomNumber || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className='px-2 py-1 bg-gray-100 rounded text-xs'>
                      {log.category || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.completedDate || log.submittedDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetail(log)}
                      className='flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm'
                    >
                      <MdInfo /> Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' onClick={() => setShowDetailModal(false)}>
          <div className='bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto' onClick={(e) => e.stopPropagation()}>
            <div className='flex justify-between items-start mb-4'>
              <div>
                <h3 className='text-xl font-semibold text-gray-800'>{selectedLog.title}</h3>
                <p className='text-sm text-gray-500'>Request ID: #{selectedLog.id}</p>
              </div>
              {getStatusBadge(selectedLog.status)}
            </div>

            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium text-gray-700'>Description</label>
                <p className='mt-1 text-sm text-gray-600'>{selectedLog.description}</p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Unit</label>
                  <p className='mt-1 text-sm text-gray-600'>{selectedLog.roomNumber || '-'}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Category</label>
                  <p className='mt-1 text-sm text-gray-600'>{selectedLog.category || '-'}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Priority</label>
                  <p className='mt-1 text-sm text-gray-600'>{selectedLog.priority || '-'}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Urgency</label>
                  <p className='mt-1 text-sm text-gray-600'>{selectedLog.urgency || '-'}</p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Submitted Date</label>
                  <p className='mt-1 text-sm text-gray-600'>{formatDate(selectedLog.submittedDate)}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Completed Date</label>
                  <p className='mt-1 text-sm text-gray-600'>{formatDate(selectedLog.completedDate)}</p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Estimated Cost</label>
                  <p className='mt-1 text-sm text-gray-600'>{formatCurrency(selectedLog.estimatedCost)}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-700'>Actual Cost</label>
                  <p className='mt-1 text-sm text-gray-600'>{formatCurrency(selectedLog.actualCost)}</p>
                </div>
              </div>

              {selectedLog.completionNotes && (
                <div>
                  <label className='text-sm font-medium text-gray-700'>Completion Notes</label>
                  <p className='mt-1 text-sm text-gray-600'>{selectedLog.completionNotes}</p>
                </div>
              )}

              {selectedLog.attachmentUrls && (
                <div>
                  <label className='text-sm font-medium text-gray-700'>Attachments</label>
                  <p className='mt-1 text-sm text-gray-600'>{selectedLog.attachmentUrls}</p>
                </div>
              )}
            </div>

            <div className='mt-6 flex justify-end'>
              <button
                onClick={() => setShowDetailModal(false)}
                className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MaintenanceTable