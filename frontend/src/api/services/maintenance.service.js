/**
 * Maintenance Service
 * 
 * Handles all maintenance request-related API calls including fetching,
 * creating, updating, and managing maintenance requests.
 * 
 * @module api/services/maintenance.service
 */

import apiClient from '../client/apiClient';

/**
 * Retrieves all maintenance requests
 * 
 * @async
 * @function getAllMaintenanceRequests
 * @returns {Promise<Array<{id: number, unit: object, description: string, status: string, priority: string, requestDate: string, completionDate: string}>>} Array of all maintenance requests
 * @throws {Error} When fetching maintenance requests fails
 * 
 * @example
 * const requests = await getAllMaintenanceRequests();
 * console.log(`Total maintenance requests: ${requests.length}`);
 */
export const getAllMaintenanceRequests = async () => {
  return await apiClient.get('/maintenance-requests');
};

/**
 * Retrieves a specific maintenance request by ID
 * 
 * @async
 * @function getMaintenanceRequestById
 * @param {number} id - Maintenance request ID
 * @returns {Promise<{id: number, unit: object, description: string, status: string, priority: string, requestDate: string, completionDate: string}>} Maintenance request details
 * @throws {Error} When request not found or fetch fails
 * 
 * @example
 * const request = await getMaintenanceRequestById(1);
 * console.log(`Request: ${request.description}`);
 */
export const getMaintenanceRequestById = async (id) => {
  return await apiClient.get(`/maintenance-requests/${id}`);
};

/**
 * Retrieves maintenance requests by tenant ID
 * 
 * @async
 * @function getRequestsByTenantId
 * @param {number} tenantId - Tenant ID
 * @returns {Promise<Array>} Array of maintenance requests for the tenant
 * @throws {Error} When fetch fails
 */
export const getRequestsByTenantId = async (tenantId) => {
  return await apiClient.get(`/maintenance-requests/tenant/${tenantId}`);
};

/**
 * Retrieves my maintenance requests (for logged-in user)
 * 
 * @async
 * @function getMyMaintenanceRequests
 * @returns {Promise<Array>} Array of maintenance requests for the logged-in user
 * @throws {Error} When fetch fails
 */
export const getMyMaintenanceRequests = async () => {
  return await apiClient.get('/maintenance-requests/my-requests');
};

/**
 * Retrieves maintenance requests by unit ID
 * 
 * @async
 * @function getRequestsByUnitId
 * @param {number} unitId - Unit ID
 * @returns {Promise<Array>} Array of maintenance requests for the unit
 * @throws {Error} When fetch fails
 */
export const getRequestsByUnitId = async (unitId) => {
  return await apiClient.get(`/maintenance-requests/unit/${unitId}`);
};

/**
 * Retrieves maintenance requests by status
 * 
 * @async
 * @function getRequestsByStatus
 * @param {string} status - Request status (SUBMITTED, WAITING_FOR_REPAIR, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED)
 * @returns {Promise<Array>} Array of maintenance requests with the specified status
 * @throws {Error} When fetch fails
 */
export const getRequestsByStatus = async (status) => {
  return await apiClient.get(`/maintenance-requests/status/${status}`);
};

/**
 * Retrieves maintenance requests by priority
 * 
 * @async
 * @function getRequestsByPriority
 * @param {string} priority - Priority level (LOW, MEDIUM, HIGH, URGENT)
 * @returns {Promise<Array>} Array of maintenance requests with the specified priority
 * @throws {Error} When fetch fails
 */
export const getRequestsByPriority = async (priority) => {
  return await apiClient.get(`/maintenance-requests/priority/${priority}`);
};

/**
 * Retrieves maintenance requests by category
 * 
 * @async
 * @function getRequestsByCategory
 * @param {string} category - Category (PLUMBING, ELECTRICAL, HVAC, APPLIANCE, STRUCTURAL, CLEANING, OTHER)
 * @returns {Promise<Array>} Array of maintenance requests in the specified category
 * @throws {Error} When fetch fails
 */
export const getRequestsByCategory = async (category) => {
  return await apiClient.get(`/maintenance-requests/category/${category}`);
};

/**
 * Retrieves open maintenance requests
 * 
 * @async
 * @function getOpenRequests
 * @returns {Promise<Array>} Array of open maintenance requests
 * @throws {Error} When fetch fails
 */
export const getOpenRequests = async () => {
  return await apiClient.get('/maintenance-requests/open');
};

/**
 * Retrieves high priority maintenance requests
 * 
 * @async
 * @function getHighPriorityRequests
 * @returns {Promise<Array>} Array of high priority maintenance requests
 * @throws {Error} When fetch fails
 */
export const getHighPriorityRequests = async () => {
  return await apiClient.get('/maintenance-requests/high-priority');
};

/**
 * Creates a new maintenance request
 * 
 * @async
 * @function createMaintenanceRequest
 * @param {object} requestData - Maintenance request creation data
 * @param {number} requestData.unitId - ID of the unit requiring maintenance
 * @param {number} [requestData.tenantId] - ID of the tenant making the request
 * @param {string} requestData.title - Title of the maintenance request
 * @param {string} requestData.description - Detailed description of the issue
 * @param {string} [requestData.category='OTHER'] - Category (PLUMBING, ELECTRICAL, HVAC, APPLIANCE, STRUCTURAL, CLEANING, OTHER)
 * @param {string} [requestData.priority='MEDIUM'] - Priority level (LOW, MEDIUM, HIGH, URGENT)
 * @param {string} [requestData.urgency='MEDIUM'] - Urgency level (LOW, MEDIUM, HIGH, EMERGENCY)
 * @param {string} [requestData.preferredTime] - Preferred time for repair
 * @returns {Promise<object>} Created maintenance request
 * @throws {Error} When creation fails
 * 
 * @example
 * const newRequest = await createMaintenanceRequest({
 *   unitId: 5,
 *   tenantId: 10,
 *   title: 'Leaking faucet in kitchen',
 *   description: 'The kitchen faucet has been leaking for 2 days',
 *   category: 'PLUMBING',
 *   priority: 'HIGH',
 *   urgency: 'HIGH',
 *   preferredTime: 'Weekday mornings'
 * });
 */
export const createMaintenanceRequest = async (requestData) => {
  return await apiClient.post('/maintenance-requests', requestData);
};

/**
 * Updates an existing maintenance request
 * 
 * @async
 * @function updateMaintenanceRequest
 * @param {number} id - Maintenance request ID to update
 * @param {object} requestData - Updated request data
 * @param {string} [requestData.title] - Updated title
 * @param {string} [requestData.description] - Updated description
 * @param {string} [requestData.status] - Updated status
 * @param {string} [requestData.priority] - Updated priority
 * @param {string} [requestData.category] - Updated category
 * @param {string} [requestData.preferredTime] - Updated preferred time
 * @returns {Promise<object>} Updated maintenance request
 * @throws {Error} When update fails or request not found
 * 
 * @example
 * const updated = await updateMaintenanceRequest(1, {
 *   status: 'IN_PROGRESS',
 *   priority: 'HIGH'
 * });
 */
export const updateMaintenanceRequest = async (id, requestData) => {
  return await apiClient.put(`/maintenance-requests/${id}`, requestData);
};

/**
 * Updates the status of a maintenance request
 * 
 * @async
 * @function updateRequestStatus
 * @param {number} id - Maintenance request ID
 * @param {object} statusData - Status update data
 * @param {string} statusData.status - New status (SUBMITTED, WAITING_FOR_REPAIR, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED)
 * @param {string} [statusData.notes] - Optional notes about the status change
 * @returns {Promise<object>} Updated maintenance request
 * @throws {Error} When update fails
 * 
 * @example
 * const updated = await updateRequestStatus(1, {
 *   status: 'COMPLETED',
 *   notes: 'Fixed the leaking faucet. Replaced the washer.'
 * });
 */
export const updateRequestStatus = async (id, statusData) => {
  return await apiClient.put(`/maintenance-requests/${id}/status`, statusData);
};

/**
 * Updates the priority of a maintenance request
 * 
 * @async
 * @function updateRequestPriority
 * @param {number} id - Maintenance request ID
 * @param {object} priorityData - Priority update data
 * @param {string} priorityData.priority - New priority (LOW, MEDIUM, HIGH, URGENT)
 * @returns {Promise<object>} Updated maintenance request
 * @throws {Error} When update fails
 * 
 * @example
 * const updated = await updateRequestPriority(1, { priority: 'URGENT' });
 */
export const updateRequestPriority = async (id, priorityData) => {
  return await apiClient.put(`/maintenance-requests/${id}/priority`, priorityData);
};

/**
 * Assigns a maintenance request to a technician
 * 
 * @async
 * @function assignMaintenanceRequest
 * @param {number} id - Maintenance request ID
 * @param {object} assignData - Assignment data
 * @param {number} assignData.assignedToUserId - User ID of the technician
 * @returns {Promise<object>} Updated maintenance request with assignment
 * @throws {Error} When assignment fails
 * 
 * @example
 * const assigned = await assignMaintenanceRequest(1, { assignedToUserId: 5 });
 */
export const assignMaintenanceRequest = async (id, assignData) => {
  return await apiClient.put(`/maintenance-requests/${id}/assign`, assignData);
};

/**
 * Completes a maintenance request
 * 
 * @async
 * @function completeMaintenanceRequest
 * @param {number} id - Maintenance request ID
 * @param {object} completionData - Completion data
 * @param {string} completionData.completionNotes - Notes about the completed work
 * @returns {Promise<object>} Completed maintenance request
 * @throws {Error} When completion fails
 * 
 * @example
 * const completed = await completeMaintenanceRequest(1, {
 *   completionNotes: 'Replaced broken pipe and tested for leaks. All working properly.'
 * });
 */
export const completeMaintenanceRequest = async (id, completionData) => {
  return await apiClient.put(`/maintenance-requests/${id}/complete`, completionData);
};

/**
 * Rejects/cancels a maintenance request
 * 
 * @async
 * @function rejectMaintenanceRequest
 * @param {number} id - Maintenance request ID
 * @param {object} rejectionData - Rejection data
 * @param {string} rejectionData.rejectionReason - Reason for rejection
 * @returns {Promise<object>} Cancelled maintenance request
 * @throws {Error} When rejection fails
 * 
 * @example
 * const rejected = await rejectMaintenanceRequest(1, {
 *   rejectionReason: 'Not covered under maintenance agreement'
 * });
 */
export const rejectMaintenanceRequest = async (id, rejectionData) => {
  return await apiClient.put(`/maintenance-requests/${id}/reject`, rejectionData);
};

/**
 * Deletes a maintenance request
 * 
 * @async
 * @function deleteMaintenanceRequest
 * @param {number} id - Maintenance request ID to delete
 * @returns {Promise<void>}
 * @throws {Error} When deletion fails
 * 
 * @example
 * await deleteMaintenanceRequest(5);
 * console.log('Maintenance request deleted successfully');
 */
export const deleteMaintenanceRequest = async (id) => {
  return await apiClient.delete(`/maintenance-requests/${id}`);
};

/**
 * Retrieves maintenance request statistics
 * 
 * @async
 * @function getMaintenanceStats
 * @returns {Promise<object>} Statistics object with counts by status
 * @throws {Error} When fetching stats fails
 * 
 * @example
 * const stats = await getMaintenanceStats();
 * console.log(`Total: ${stats.TOTAL}, Pending: ${stats.SUBMITTED}`);
 */
export const getMaintenanceStats = async () => {
  return await apiClient.get('/maintenance-requests/stats');
};

/**
 * Retrieves pending maintenance requests only
 * 
 * @async
 * @function getPendingRequests
 * @returns {Promise<Array<{id: number, unit: object, description: string, priority: string, requestDate: string}>>} Array of pending requests
 * @throws {Error} When fetching fails
 * 
 * @example
 * const pending = await getPendingRequests();
 * console.log(`${pending.length} pending requests`);
 */
export const getPendingRequests = async () => {
  const requests = await getAllMaintenanceRequests();
  return requests.filter(request => 
    request.status === 'SUBMITTED' || request.status === 'WAITING_FOR_REPAIR'
  );
};

// ============================================
// MAINTENANCE STOCK API CALLS
// ============================================

/**
 * Get all maintenance stock items
 */
export const getAllStocks = async () => {
  return await apiClient.get('/maintenance/stocks');
};

/**
 * Get stock by ID
 */
export const getStockById = async (id) => {
  return await apiClient.get(`/maintenance/stocks/${id}`);
};

/**
 * Get stocks by category
 */
export const getStocksByCategory = async (category) => {
  return await apiClient.get(`/maintenance/stocks/category/${category}`);
};

/**
 * Search stocks by keyword
 */
export const searchStocks = async (keyword) => {
  return await apiClient.get(`/maintenance/stocks/search`, { params: { keyword } });
};

/**
 * Get low stock items
 */
export const getLowStockItems = async (threshold = 10) => {
  return await apiClient.get(`/maintenance/stocks/low-stock`, { params: { threshold } });
};

/**
 * Create new stock item
 */
export const createStock = async (stockData) => {
  return await apiClient.post('/maintenance/stocks', stockData);
};

/**
 * Update stock item
 */
export const updateStock = async (id, stockData) => {
  return await apiClient.put(`/maintenance/stocks/${id}`, stockData);
};

/**
 * Update stock quantity
 */
export const updateStockQuantity = async (id, quantityChange) => {
  return await apiClient.patch(`/maintenance/stocks/${id}/quantity`, { quantityChange });
};

/**
 * Add stock (restocking)
 */
export const addStockQuantity = async (id, quantity) => {
  return await apiClient.post(`/maintenance/stocks/${id}/add`, { quantity });
};

/**
 * Delete stock item
 */
export const deleteStock = async (id) => {
  return await apiClient.delete(`/maintenance/stocks/${id}`);
};

// ============================================
// MAINTENANCE REQUEST ITEMS API CALLS
// ============================================

/**
 * Get all items for a maintenance request
 */
export const getRequestItems = async (requestId) => {
  return await apiClient.get(`/maintenance-requests/${requestId}/items`);
};

/**
 * Add items to a maintenance request
 */
export const addItemsToRequest = async (requestId, items) => {
  return await apiClient.post(`/maintenance-requests/${requestId}/items`, items);
};

/**
 * Add a single item to a maintenance request
 */
export const addSingleItemToRequest = async (requestId, stockId, quantity, notes = null) => {
  return await apiClient.post(`/maintenance-requests/${requestId}/items/single`, {
    stockId,
    quantity,
    notes
  });
};

/**
 * Update item quantity
 */
export const updateItemQuantity = async (itemId, quantity) => {
  return await apiClient.patch(`/maintenance-requests/items/${itemId}/quantity`, { quantity });
};

/**
 * Remove an item from a request
 */
export const removeItem = async (itemId) => {
  return await apiClient.delete(`/maintenance-requests/items/${itemId}`);
};

/**
 * Calculate total cost for items in a request
 */
export const calculateItemsCost = async (requestId) => {
  return await apiClient.get(`/maintenance-requests/${requestId}/items/cost`);
};

/**
 * Get all completed and cancelled maintenance requests (for logs)
 */
export const getCompletedMaintenanceRequests = async () => {
  const allRequests = await apiClient.get('/maintenance-requests');
  return allRequests.filter(req => 
    req.status === 'COMPLETED' || req.status === 'CANCELLED'
  );
};

/**
 * Get maintenance requests by unit ID (for unit-specific logs)
 */
export const getMaintenanceRequestsByUnitId = async (unitId) => {
  return await apiClient.get(`/maintenance-requests/unit/${unitId}`);
};

/**
 * Get available time slots for a specific date
 * 
 * @async
 * @function getAvailableTimeSlots
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array<{timeSlot: string, startTime: string, endTime: string, bookedCount: number, available: boolean}>>}
 * @throws {Error} When fetching time slots fails
 */
export const getAvailableTimeSlots = async (date) => {
  return await apiClient.get(`/maintenance-requests/available-slots?date=${date}`);
};

/**
 * Select time slot for a maintenance request (Tenant action)
 * 
 * @async
 * @function selectTimeSlot
 * @param {number} requestId - Maintenance request ID
 * @param {object} timeSlotData - Time slot selection data
 * @param {string} timeSlotData.preferredDate - Preferred date (YYYY-MM-DD)
 * @param {string} timeSlotData.preferredTime - Preferred time (HH:mm)
 * @returns {Promise<object>} Updated maintenance request
 * @throws {Error} When selecting time slot fails
 */
export const selectTimeSlot = async (requestId, timeSlotData) => {
  return await apiClient.put(`/maintenance-requests/${requestId}/select-time`, timeSlotData);
};
