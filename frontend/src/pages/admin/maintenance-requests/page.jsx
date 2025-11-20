import React, { useState, useEffect } from 'react';
import { HiOutlineInbox } from 'react-icons/hi2';
import { FiSearch, FiFilter, FiCheckCircle, FiClock, FiTool, FiX, FiEdit, FiUser, FiTrash2, FiEye, FiFile, FiCalendar } from 'react-icons/fi';
import StatCard from '../../../components/card/stat_card';
import MaintenanceCalendar from '../../../components/calendar/maintenance_calendar';
import { getAllMaintenanceRequests, updateRequestStatus, updateRequestPriority, deleteMaintenanceRequest, updateMaintenanceRequest, getRequestItems, getAllStocks, addSingleItemToRequest, removeItem, calculateItemsCost } from '../../../api/services/maintenance.service';
import { getBackendResourceUrl } from '../../../api/client/apiClient';

function MaintenanceRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSendReportModal, setShowSendReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    status: ''
  });
  const [requestItems, setRequestItems] = useState([]);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  
  // Send Report Form states
  const [reportForm, setReportForm] = useState({
    topic: '',
    completionDate: '',
    completionTime: '',
    status: 'COMPLETED',
    notes: '',
    items: [] // [{stockId, quantity, notes}]
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [requests, sortBy, filterStatus, filterPriority, searchQuery]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await getAllMaintenanceRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...requests];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(req => 
        req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.tenantName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(req => req.priority === filterPriority);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.submittedDate) - new Date(a.submittedDate);
      } else if (sortBy === 'oldest') {
        return new Date(a.submittedDate) - new Date(b.submittedDate);
      } else if (sortBy === 'priority') {
        const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
      return 0;
    });

    setFilteredRequests(filtered);
  };

  // Open Send Report Modal
  const handleOpenSendReport = async (request) => {
    setSelectedRequest(request);
    try {
      const [items, stocks] = await Promise.all([
        getRequestItems(request.id),
        getAllStocks()
      ]);
      setRequestItems(items);
      setAvailableStocks(stocks);
      
      const today = new Date();
      setReportForm({
        topic: request.title || '',
        completionDate: today.toISOString().split('T')[0],
        completionTime: today.toTimeString().slice(0, 5),
        status: 'COMPLETED',
        notes: '',
        items: items.map(item => ({
          stockId: item.stockId,
          itemName: item.itemName,
          quantity: item.quantityUsed,
          unit: item.unit,
          notes: item.notes || ''
        }))
      });
      
      setShowSendReportModal(true);
    } catch (error) {
      console.error('Error loading report data:', error);
      alert('Failed to load report data');
    }
  };

  const handleAddItemToReport = () => {
    if (!selectedStock || itemQuantity <= 0) {
      alert('Please select a stock item and enter valid quantity');
      return;
    }
    
    const stock = availableStocks.find(s => s.id === parseInt(selectedStock));
    if (!stock) return;
    
    const existingIndex = reportForm.items.findIndex(item => item.stockId === stock.id);
    if (existingIndex >= 0) {
      const updatedItems = [...reportForm.items];
      updatedItems[existingIndex].quantity += itemQuantity;
      setReportForm({ ...reportForm, items: updatedItems });
    } else {
      setReportForm({
        ...reportForm,
        items: [...reportForm.items, {
          stockId: stock.id,
          itemName: stock.itemName,
          quantity: itemQuantity,
          unit: stock.unit,
          notes: itemNotes
        }]
      });
    }
    
    setSelectedStock('');
    setItemQuantity(1);
    setItemNotes('');
  };

  const handleRemoveItemFromReport = (index) => {
    const updatedItems = reportForm.items.filter((_, i) => i !== index);
    setReportForm({ ...reportForm, items: updatedItems });
  };

  const handleSubmitSendReport = async () => {
    if (!selectedRequest) return;
    
    if (!reportForm.topic.trim()) {
      alert('Please enter a topic');
      return;
    }
    
    // Validate completion date/time only for COMPLETED status
    if (reportForm.status === 'COMPLETED') {
      if (!reportForm.completionDate || !reportForm.completionTime) {
        alert('Please enter completion date and time for completed status');
        return;
      }
    }

    try {
      setIsProcessing(true);
      
      // Build notes based on status
      let notes = reportForm.topic;
      if (reportForm.status === 'COMPLETED' && reportForm.completionDate && reportForm.completionTime) {
        notes += `\nCompleted: ${reportForm.completionDate} ${reportForm.completionTime}`;
      }
      if (reportForm.notes) {
        notes += `\n${reportForm.notes}`;
      }
      
      await updateRequestStatus(selectedRequest.id, { 
        status: reportForm.status,
        notes: notes
      });
      
      const existingItemStockIds = requestItems.map(item => item.stockId);
      const newItems = reportForm.items.filter(item => !existingItemStockIds.includes(item.stockId));
      
      for (const item of newItems) {
        await addSingleItemToRequest(
          selectedRequest.id,
          item.stockId,
          item.quantity,
          item.notes
        );
      }
      
      await fetchRequests();
      setShowSendReportModal(false);
      setSelectedRequest(null);
      alert('Report sent successfully!');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (request) => {
    setSelectedRequest(request);
    setEditFormData({
      title: request.title,
      description: request.description,
      category: request.category,
      priority: request.priority,
      status: request.status
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);
      await updateMaintenanceRequest(selectedRequest.id, editFormData);
      await fetchRequests();
      setShowEditModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error updating maintenance request:', error);
      alert('Failed to update request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (request) => {
    setSelectedRequest(request);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);
      await deleteMaintenanceRequest(selectedRequest.id);
      await fetchRequests();
      setShowDeleteModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error deleting maintenance request:', error);
      alert('Failed to delete request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      SUBMITTED: { color: 'bg-blue-100 text-blue-800', icon: FiClock, text: 'Submitted' },
      WAITING_FOR_REPAIR: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock, text: 'Waiting' },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle, text: 'Approved' },
      IN_PROGRESS: { color: 'bg-purple-100 text-purple-800', icon: FiTool, text: 'In Progress' },
      COMPLETED: { color: 'bg-gray-100 text-gray-800', icon: FiCheckCircle, text: 'Completed' },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: FiX, text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.SUBMITTED;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={14} />
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-orange-100 text-orange-700',
      URGENT: 'bg-red-100 text-red-700'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[priority] || colors.MEDIUM}`}>
        {priority}
      </span>
    );
  };

  const groupByStatus = () => {
    const groups = {
      pending: filteredRequests.filter(r => r.status === 'SUBMITTED' || r.status === 'WAITING_FOR_REPAIR'),
      approved: filteredRequests.filter(r => r.status === 'APPROVED' || r.status === 'IN_PROGRESS'),
      completed: filteredRequests.filter(r => r.status === 'COMPLETED'),
      cancelled: filteredRequests.filter(r => r.status === 'CANCELLED')
    };
    return groups;
  };

  const groups = groupByStatus();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='flex w-full items-center lg:mb-8 mb-6 justify-between'>
        <div>
          <h1 className='title'>Maintenance Requests Management</h1>
          <p className='text-gray-600 mt-1'>Manage and track all maintenance requests</p>
        </div>
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition'
        >
          <FiCalendar />
          {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
        </button>
      </div>

      {/* Calendar View */}
      {showCalendar && (
        <div className='mb-6'>
          <MaintenanceCalendar />
        </div>
      )}

      {/* Stats */}
      <div className='grid lg:grid-cols-4 grid-cols-2 lg:mb-6 mb-4 gap-4'>
        <StatCard icon={<FiClock />} title={"Pending"} value={groups.pending.length} color={"blue"} />
        <StatCard icon={<FiTool />} title={"In Progress"} value={groups.approved.length} color={"yellow"} />
        <StatCard icon={<FiCheckCircle />} title={"Completed"} value={groups.completed.length} color={"green"} />
        <StatCard icon={<FiX />} title={"Cancelled"} value={groups.cancelled.length} color={"red"} />
      </div>

      {/* Filters and Search */}
      <div className='bg-white p-4 rounded-lg shadow mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* Search */}
          <div className='relative'>
            <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className='border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value="all">All Status</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="WAITING_FOR_REPAIR">Waiting for Repair</option>
            <option value="APPROVED">Approved</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className='border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value="all">All Priority</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className='border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value="newest">Sort by: Newest</option>
            <option value="oldest">Sort by: Oldest</option>
            <option value="priority">Sort by: Priority</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            All Requests ({filteredRequests.length})
          </h2>
        </div>

        {filteredRequests.length === 0 ? (
          <div className='text-center py-12'>
            <HiOutlineInbox className='mx-auto text-6xl text-gray-300 mb-4' />
            <p className='text-gray-500 text-lg'>No maintenance requests found</p>
            <p className='text-gray-400 text-sm mt-2'>
              {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' 
                ? 'Try adjusting your filters' 
                : "You're all caught up! New requests will appear here."}
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className='bg-gray-50'>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className='hover:bg-gray-50'>
                    <td className="px-6 py-4">
                      <span className='font-medium text-gray-900'>{request.title}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.roomNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.tenantName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className='text-sm text-gray-600'>{request.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(request.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.submittedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => handleViewDetails(request)}
                          className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                          title='View Details'
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(request)}
                          className='p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors'
                          title='Edit'
                        >
                          <FiEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenSendReport(request)}
                          className='p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors'
                          title='Send Report'
                        >
                          <FiCheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(request)}
                          className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                          title='Delete'
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {showDetailModal && selectedRequest && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto'>
            {/* Modal Header */}
            <div className='sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10'>
              <div>
                <h3 className='text-xl font-bold text-gray-800'>View Request Details</h3>
                <p className='text-sm text-gray-600'>Request #{selectedRequest.id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className='text-gray-400 hover:text-gray-600 text-2xl font-bold'
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className='p-6'>
              {/* Basic Information */}
              <div className='mb-6'>
                <h4 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                  <FiTool className='text-blue-600' /> Basic Information
                </h4>
                <div className='grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg'>
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Title</p>
                    <p className='font-semibold text-gray-900'>{selectedRequest.title}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Status</p>
                    <div className='mt-1'>{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Room Number</p>
                    <p className='font-semibold text-gray-900'>{selectedRequest.roomNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Tenant Name</p>
                    <p className='font-semibold text-gray-900'>{selectedRequest.tenantName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Category</p>
                    <p className='font-semibold text-gray-900'>{selectedRequest.category}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-600 mb-1'>Priority</p>
                    <div className='mt-1'>{getPriorityBadge(selectedRequest.priority)}</div>
                  </div>
                  <div className='col-span-2'>
                    <p className='text-sm text-gray-600 mb-1'>Submitted Date</p>
                    <p className='font-semibold text-gray-900'>{formatDate(selectedRequest.submittedDate)}</p>
                  </div>
                  {selectedRequest.preferredTime && (
                    <div className='col-span-2'>
                      <p className='text-sm text-gray-600 mb-1'>Preferred Date & Time</p>
                      <p className='font-semibold text-blue-600'>{selectedRequest.preferredTime}</p>
                    </div>
                  )}
                  {selectedRequest.completedDate && (
                    <div className='col-span-2'>
                      <p className='text-sm text-gray-600 mb-1'>Completed Date</p>
                      <p className='font-semibold text-gray-900'>{formatDate(selectedRequest.completedDate)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className='mb-6'>
                <h4 className='text-lg font-semibold text-gray-800 mb-3'>Description</h4>
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <p className='text-gray-700 whitespace-pre-wrap'>{selectedRequest.description}</p>
                </div>
              </div>

              {/* Attachments/Images */}
              <div className='mb-6'>
                <h4 className='text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2'>
                  <FiEye className='text-purple-600' /> Attachments
                </h4>
                {selectedRequest.attachmentUrls ? (
                  <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                    {(() => {
                      // Handle both string (comma-separated) and array formats
                      const urls = typeof selectedRequest.attachmentUrls === 'string' 
                        ? selectedRequest.attachmentUrls.split(',').map(url => url.trim()).filter(url => url)
                        : selectedRequest.attachmentUrls;
                      
                      if (!urls || urls.length === 0) {
                        return (
                          <div className='col-span-4 text-center py-8 text-gray-500'>
                            No attachments available
                          </div>
                        );
                      }
                      
                      return urls.map((url, index) => {
                        const isPdf = url.toLowerCase().includes('.pdf');
                        return (
                          <div key={index} className='group relative border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-all'>
                            {isPdf ? (
                              <div 
                                className='w-full h-48 bg-red-50 flex flex-col items-center justify-center cursor-pointer hover:bg-red-100 transition-colors'
                                onClick={() => window.open(getBackendResourceUrl(url), '_blank')}
                              >
                                <FiFile size={48} className='text-red-600 mb-2' />
                                <span className='text-sm text-gray-700'>PDF Document</span>
                              </div>
                            ) : (
                              <img 
                                src={getBackendResourceUrl(url)}
                                alt={`Attachment ${index + 1}`}
                                className='w-full h-48 object-cover bg-gray-100 cursor-pointer hover:scale-105 transition-transform'
                                onClick={() => window.open(getBackendResourceUrl(url), '_blank')}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            )}
                            <div className='absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded pointer-events-none'>
                              {index + 1}/{urls.length}
                            </div>
                            <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center pointer-events-none'>
                              <FiEye className='text-white opacity-0 group-hover:opacity-100 transition-opacity' size={24} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className='text-center py-8 bg-gray-50 rounded-lg'>
                    <p className='text-gray-500'>No attachments uploaded</p>
                  </div>
                )}
                {selectedRequest.attachmentUrls && (
                  <p className='text-sm text-gray-500 mt-2'>Click on image to view in full size</p>
                )}
              </div>

              {/* Completion Notes (if completed) */}
              {selectedRequest.completionNotes && (
                <div className='mb-6'>
                  <h4 className='text-lg font-semibold text-gray-800 mb-3'>Completion Notes</h4>
                  <div className='bg-green-50 border border-green-200 p-4 rounded-lg'>
                    <p className='text-gray-700'>{selectedRequest.completionNotes}</p>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className='flex justify-end border-t pt-4'>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className='px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Report Modal */}
      {showSendReportModal && selectedRequest && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center'>
              <h3 className='text-xl font-bold text-gray-800'>Send Maintenance Report</h3>
              <button
                onClick={() => setShowSendReportModal(false)}
                className='text-gray-400 hover:text-gray-600 text-2xl font-bold'
              >
                ×
              </button>
            </div>

            <div className='p-6 space-y-6'>
              {/* Request Info Display */}
              {selectedRequest && (
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
                  <h4 className='font-semibold text-blue-900 mb-2'>Request Information</h4>
                  <div className='grid grid-cols-2 gap-3 text-sm'>
                    <div>
                      <span className='text-blue-700'>Room:</span> 
                      <span className='font-medium ml-2'>{selectedRequest.roomNumber}</span>
                    </div>
                    <div>
                      <span className='text-blue-700'>Tenant:</span> 
                      <span className='font-medium ml-2'>{selectedRequest.tenantName}</span>
                    </div>
                    {selectedRequest.preferredTime && (
                      <div className='col-span-2'>
                        <span className='text-blue-700'>Preferred Date & Time:</span> 
                        <span className='font-semibold ml-2 text-blue-600'>{selectedRequest.preferredTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-2'>Topic / Summary *</label>
                  <input
                    type='text'
                    value={reportForm.topic}
                    onChange={(e) => setReportForm({...reportForm, topic: e.target.value})}
                    className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='e.g., Fixed electrical issue in room 101'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-2'>Status *</label>
                  <select
                    value={reportForm.status}
                    onChange={(e) => setReportForm({...reportForm, status: e.target.value})}
                    className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="WAITING_FOR_REPAIR">Waiting for Repair</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Date & Time - Only for Completed status */}
              {reportForm.status === 'COMPLETED' && (
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium mb-2'>Completion Date *</label>
                    <input
                      type='date'
                      value={reportForm.completionDate}
                      onChange={(e) => setReportForm({...reportForm, completionDate: e.target.value})}
                      className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium mb-2'>Completion Time *</label>
                    <input
                      type='time'
                      value={reportForm.completionTime}
                      onChange={(e) => setReportForm({...reportForm, completionTime: e.target.value})}
                      className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      required
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className='block text-sm font-medium mb-2'>Additional Notes</label>
                <textarea
                  value={reportForm.notes}
                  onChange={(e) => setReportForm({...reportForm, notes: e.target.value})}
                  placeholder='Any additional information about the maintenance work...'
                  className='w-full border border-gray-300 rounded-lg px-4 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              {/* Add Items Section */}
              <div className='border-t pt-6'>
                <h4 className='font-semibold mb-4'>Materials/Items Used</h4>
                <div className='grid grid-cols-12 gap-3 mb-4 items-end'>
                  <div className='col-span-5'>
                    <label className='block text-sm font-medium mb-1'>Select Item</label>
                    <select
                      value={selectedStock}
                      onChange={(e) => setSelectedStock(e.target.value)}
                      className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value=''>Choose an item...</option>
                      {availableStocks.map(stock => (
                        <option key={stock.id} value={stock.id}>
                          {stock.itemName} ({stock.quantity} {stock.unit} available)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='col-span-2'>
                    <label className='block text-sm font-medium mb-1'>Quantity</label>
                    <input
                      type='number'
                      min='1'
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div className='col-span-3'>
                    <label className='block text-sm font-medium mb-1'>Notes</label>
                    <input
                      type='text'
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      placeholder='Optional'
                      className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                  <div className='col-span-2'>
                    <button
                      onClick={handleAddItemToReport}
                      disabled={!selectedStock}
                      className='w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50'
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {reportForm.items.length > 0 ? (
                  <div className='border rounded-lg overflow-hidden'>
                    <table className='min-w-full'>
                      <thead className='bg-gray-50'>
                        <tr>
                          <th className='px-4 py-2 text-left text-sm font-medium text-gray-600'>Item Name</th>
                          <th className='px-4 py-2 text-left text-sm font-medium text-gray-600'>Quantity</th>
                          <th className='px-4 py-2 text-left text-sm font-medium text-gray-600'>Unit</th>
                          <th className='px-4 py-2 text-left text-sm font-medium text-gray-600'>Notes</th>
                          <th className='px-4 py-2 text-left text-sm font-medium text-gray-600'>Action</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {reportForm.items.map((item, index) => (
                          <tr key={index} className='hover:bg-gray-50'>
                            <td className='px-4 py-2'>{item.itemName}</td>
                            <td className='px-4 py-2'>{item.quantity}</td>
                            <td className='px-4 py-2'>{item.unit}</td>
                            <td className='px-4 py-2 text-sm text-gray-600'>{item.notes || '-'}</td>
                            <td className='px-4 py-2'>
                              <button
                                onClick={() => handleRemoveItemFromReport(index)}
                                className='text-red-600 hover:text-red-800'
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className='text-gray-500 text-center py-6 border rounded-lg'>No items added yet</p>
                )}
              </div>

              {/* Actions */}
              <div className='flex gap-3 justify-end border-t pt-4'>
                <button
                  onClick={() => setShowSendReportModal(false)}
                  disabled={isProcessing}
                  className='px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium disabled:opacity-50'
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitSendReport}
                  disabled={isProcessing}
                  className='px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2'
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle />
                      Send Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRequest && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-2xl'>
            <h3 className='text-xl font-bold mb-4 flex items-center gap-2'>
              <FiEdit />
              Edit Maintenance Request
            </h3>
            
            <div className='mb-4'>
              <label className='block text-sm font-medium mb-2'>Title *</label>
              <input
                type='text'
                value={editFormData.title}
                onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Brief description of the issue'
              />
            </div>

            <div className='mb-4'>
              <label className='block text-sm font-medium mb-2'>Description *</label>
              <textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                className='w-full border border-gray-300 rounded-lg px-4 py-2 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Detailed description of the problem'
              />
            </div>

            <div className='grid grid-cols-2 gap-4 mb-4'>
              <div>
                <label className='block text-sm font-medium mb-2'>Category *</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                  className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='PLUMBING'>Plumbing</option>
                  <option value='ELECTRICAL'>Electrical</option>
                  <option value='HVAC'>HVAC</option>
                  <option value='APPLIANCE'>Appliance</option>
                  <option value='STRUCTURAL'>Structural</option>
                  <option value='CLEANING'>Cleaning</option>
                  <option value='OTHER'>Other</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium mb-2'>Priority *</label>
                <select
                  value={editFormData.priority}
                  onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})}
                  className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='LOW'>Low - Can wait</option>
                  <option value='MEDIUM'>Medium - Should be fixed soon</option>
                  <option value='HIGH'>High - Needs attention</option>
                  <option value='URGENT'>Urgent - Fix immediately</option>
                </select>
              </div>
            </div>

            <div className='mb-4'>
              <label className='block text-sm font-medium mb-2'>Status *</label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                className='w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='SUBMITTED'>Submitted</option>
                <option value='WAITING_FOR_REPAIR'>Waiting for Repair</option>
                <option value='APPROVED'>Approved</option>
                <option value='IN_PROGRESS'>In Progress</option>
                <option value='COMPLETED'>Completed</option>
                <option value='CANCELLED'>Cancelled</option>
              </select>
            </div>

            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedRequest(null);
                }}
                disabled={isProcessing}
                className='px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEdit}
                disabled={isProcessing || !editFormData.title || !editFormData.description}
                className='px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2'
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <FiCheckCircle />
                    Update Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRequest && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-xl font-bold mb-4 flex items-center gap-2 text-red-600'>
              <FiTrash2 />
              Delete Maintenance Request
            </h3>
            
            <div className='mb-6'>
              <p className='text-gray-700 mb-4'>
                Are you sure you want to delete this maintenance request?
              </p>
              <div className='bg-gray-50 p-4 rounded-lg'>
                <p className='text-sm font-medium mb-1'>{selectedRequest.title}</p>
                <p className='text-sm text-gray-600'>Room: {selectedRequest.roomNumber}</p>
                <p className='text-sm text-gray-600'>Tenant: {selectedRequest.tenantName}</p>
              </div>
              <p className='text-sm text-red-600 mt-4'>
                ⚠️ This action cannot be undone.
              </p>
            </div>

            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRequest(null);
                }}
                disabled={isProcessing}
                className='px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                className='px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2'
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 />
                    Delete Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaintenanceRequestsPage;