/**
 * Rental Requests Service
 * 
 * Handles all rental request-related API calls including fetching,
 * creating, updating, and managing rental applications.
 * 
 * @module api/services/rentalRequests.service
 */

import apiClient from '../client/apiClient';

// ============================================
// NEW AUTHENTICATED ENDPOINTS (User-based booking flow)
// ============================================

/**
 * Get the latest rental request status for the authenticated user
 * Used by booking page to check if user can book, has pending request, etc.
 * 
 * @async
 * @function getMyLatestRequest
 * @returns {Promise<{
 *   id: number,
 *   userId: number,
 *   unitId: number,
 *   status: string,
 *   isPending: boolean,
 *   isApproved: boolean,
 *   isRejected: boolean,
 *   requiresAcknowledgement: boolean,
 *   hasActiveLease: boolean,
 *   canCreateNewRequest: boolean,
 *   statusMessage: string,
 *   rejectionReason: string
 * }>} Latest request status with flags
 * @throws {Error} When request fails or user not authenticated
 * 
 * @example
 * const status = await getMyLatestRequest();
 * if (status.isPending) {
 *   // Redirect to waiting page
 * } else if (status.requiresAcknowledgement) {
 *   // Show rejection modal
 * }
 */
export const getMyLatestRequest = async () => {
  return await apiClient.get('/rental-requests/me/latest');
};

/**
 * Acknowledge a rejected rental request
 * Dismisses the rejection notification and allows user to create new booking
 * 
 * @async
 * @function acknowledgeRejection
 * @param {number} id - Rental request ID to acknowledge
 * @returns {Promise<{
 *   requestId: number,
 *   acknowledgedAt: string,
 *   message: string,
 *   canCreateNewRequest: boolean
 * }>} Acknowledgement confirmation
 * @throws {Error} When acknowledgement fails (not owner, already acknowledged, etc.)
 * 
 * @example
 * await acknowledgeRejection(5);
 * // User can now submit new booking request
 */
export const acknowledgeRejection = async (id) => {
  return await apiClient.post(`/rental-requests/${id}/acknowledge`);
};

/**
 * Create rental request with authentication (RECOMMENDED for logged-in users)
 * Includes full validation: prevents duplicate bookings, VILLAGER blocking, etc.
 * 
 * @async
 * @function createAuthenticatedRentalRequest
 * @param {object} requestData - Rental request creation data
 * @param {number} requestData.unitId - ID of the unit being applied for
 * @param {string} requestData.firstName - Applicant's first name
 * @param {string} requestData.lastName - Applicant's last name
 * @param {string} requestData.email - Applicant's email address
 * @param {string} requestData.phone - Applicant's phone number
 * @param {string} [requestData.occupation] - Applicant's occupation
 * @param {string} [requestData.emergencyContact] - Emergency contact name
 * @param {string} [requestData.emergencyPhone] - Emergency contact phone
 * @param {number} requestData.leaseDurationMonths - Desired lease duration in months
 * @param {string} [requestData.notes] - Additional notes
 * @returns {Promise<object>} Created rental request
 * @throws {Error} When creation fails
 * @throws {Error} With status 409 if user already has pending/approved booking
 * @throws {Error} With status 409 if user hasn't acknowledged previous rejection
 * 
 * @example
 * try {
 *   const request = await createAuthenticatedRentalRequest({
 *     unitId: 5,
 *     firstName: 'Jane',
 *     lastName: 'Smith',
 *     email: 'jane@example.com',
 *     phone: '9876543210',
 *     occupation: 'Software Engineer',
 *     emergencyContact: 'John Smith',
 *     emergencyPhone: '1234567890',
 *     leaseDurationMonths: 12,
 *     notes: 'Prefer early move-in'
 *   });
 * } catch (error) {
 *   if (error.message.includes('409')) {
 *     // Handle duplicate booking error
 *     alert('You already have a pending or approved booking');
 *   }
 * }
 */
export const createAuthenticatedRentalRequest = async (requestData) => {
  return await apiClient.post('/rental-requests/authenticated', requestData);
};

// ============================================
// EXISTING ENDPOINTS (Legacy/Admin use)
// ============================================

/**
 * Retrieves all rental requests
 * 
 * @async
 * @function getAllRentalRequests
 * @returns {Promise<Array<{id: number, unit: object, applicantName: string, email: string, phoneNumber: string, requestDate: string, status: string}>>} Array of all rental requests
 * @throws {Error} When fetching rental requests fails
 * 
 * @example
 * const requests = await getAllRentalRequests();
 * console.log(`Total rental requests: ${requests.length}`);
 */
export const getAllRentalRequests = async () => {
  return await apiClient.get('/rental-requests');
};

/**
 * Retrieves a specific rental request by ID
 * 
 * @async
 * @function getRentalRequestById
 * @param {number} id - Rental request ID
 * @returns {Promise<{id: number, unit: object, applicantName: string, email: string, phoneNumber: string, requestDate: string, status: string}>} Rental request details
 * @throws {Error} When request not found or fetch fails
 * 
 * @example
 * const request = await getRentalRequestById(1);
 * console.log(`Applicant: ${request.applicantName}`);
 */
export const getRentalRequestById = async (id) => {
  return await apiClient.get(`/rental-requests/${id}`);
};

/**
 * Creates a new rental request
 * 
 * @deprecated Use createAuthenticatedRentalRequest() for logged-in users
 * @async
 * @function createRentalRequest
 * @param {object} requestData - Rental request creation data
 * @param {number} requestData.unitId - ID of the unit being applied for
 * @param {string} requestData.applicantName - Full name of the applicant
 * @param {string} requestData.email - Applicant's email address
 * @param {string} requestData.phoneNumber - Applicant's phone number
 * @param {string} [requestData.message] - Additional message from applicant
 * @param {string} [requestData.status='PENDING'] - Request status (PENDING, APPROVED, REJECTED)
 * @returns {Promise<{id: number, unit: object, applicantName: string, email: string, phoneNumber: string, requestDate: string, status: string}>} Created rental request
 * @throws {Error} When creation fails
 * 
 * @example
 * // Legacy endpoint - use createAuthenticatedRentalRequest() instead
 * const newRequest = await createRentalRequest({
 *   unitId: 5,
 *   applicantName: 'Jane Smith',
 *   email: 'jane@example.com',
 *   phoneNumber: '9876543210',
 *   message: 'Looking for a long-term lease',
 *   status: 'PENDING'
 * });
 */
export const createRentalRequest = async (requestData) => {
  return await apiClient.post('/rental-requests', requestData);
};

/**
 * Updates an existing rental request
 * 
 * @async
 * @function updateRentalRequest
 * @param {number} id - Rental request ID to update
 * @param {object} requestData - Updated request data
 * @param {string} [requestData.status] - Updated status
 * @param {string} [requestData.email] - Updated email
 * @param {string} [requestData.phoneNumber] - Updated phone number
 * @param {string} [requestData.message] - Updated message
 * @returns {Promise<{id: number, unit: object, applicantName: string, email: string, phoneNumber: string, requestDate: string, status: string}>} Updated rental request
 * @throws {Error} When update fails or request not found
 * 
 * @example
 * const updated = await updateRentalRequest(1, {
 *   status: 'APPROVED'
 * });
 */
export const updateRentalRequest = async (id, requestData) => {
  return await apiClient.put(`/rental-requests/${id}`, requestData);
};

/**
 * Deletes a rental request
 * 
 * @async
 * @function deleteRentalRequest
 * @param {number} id - Rental request ID to delete
 * @returns {Promise<void>}
 * @throws {Error} When deletion fails
 * 
 * @example
 * await deleteRentalRequest(5);
 * console.log('Rental request deleted successfully');
 */
export const deleteRentalRequest = async (id) => {
  return await apiClient.delete(`/rental-requests/${id}`);
};

/**
 * Retrieves pending rental requests only
 * 
 * @async
 * @function getPendingRentalRequests
 * @returns {Promise<Array<{id: number, unit: object, applicantName: string, email: string, requestDate: string}>>} Array of pending requests
 * @throws {Error} When fetching fails
 * 
 * @example
 * const pending = await getPendingRentalRequests();
 * console.log(`${pending.length} pending rental requests`);
 */
export const getPendingRentalRequests = async () => {
  const requests = await getAllRentalRequests();
  return requests.filter(request => request.status === 'PENDING');
};

/**
 * Approves a rental request and creates a lease
 * 
 * @async
 * @function approveRentalRequest
 * @param {number} id - Rental request ID to approve
 * @param {object} approvalData - Approval details
 * @param {number} approvalData.approvedByUserId - ID of the admin user approving
 * @param {string} approvalData.startDate - Lease start date (YYYY-MM-DD)
 * @param {string} approvalData.endDate - Lease end date (YYYY-MM-DD)
 * @returns {Promise<{id: number, status: string}>} Updated rental request
 * @throws {Error} When approval fails
 * 
 * @example
 * await approveRentalRequest(1, {
 *   approvedByUserId: 10,
 *   startDate: '2025-11-01',
 *   endDate: '2026-11-01'
 * });
 */
export const approveRentalRequest = async (id, approvalData) => {
  return await apiClient.put(`/rental-requests/${id}/approve`, approvalData);
};

/**
 * Rejects a rental request
 * 
 * @async
 * @function rejectRentalRequest
 * @param {number} id - Rental request ID to reject
 * @param {object} rejectionData - Rejection details
 * @param {string} rejectionData.reason - Reason for rejection
 * @param {number} [rejectionData.rejectedByUserId] - ID of the admin user rejecting
 * @returns {Promise<{id: number, status: string}>} Updated rental request
 * @throws {Error} When rejection fails
 * 
 * @example
 * await rejectRentalRequest(1, {
 *   reason: 'Incomplete documentation',
 *   rejectedByUserId: 10
 * });
 */
export const rejectRentalRequest = async (id, rejectionData) => {
  return await apiClient.put(`/rental-requests/${id}/reject`, rejectionData);
};
