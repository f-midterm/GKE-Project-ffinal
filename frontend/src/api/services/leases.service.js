/**
 * Leases Service
 * 
 * Handles all lease agreement-related API calls including fetching,
 * creating, updating, and managing lease agreements.
 * 
 * @module api/services/leases.service
 */

import apiClient from '../client/apiClient';

/**
 * Retrieves all lease agreements
 * 
 * @async
 * @function getAllLeases
 * @returns {Promise<Array<{id: number, tenant: object, unit: object, startDate: string, endDate: string, monthlyRent: number, status: string}>>} Array of all leases
 * @throws {Error} When fetching leases fails
 * 
 * @example
 * const leases = await getAllLeases();
 * console.log(`Total leases: ${leases.length}`);
 */
export const getAllLeases = async () => {
  return await apiClient.get('/leases');
};

/**
 * Retrieves a specific lease by ID
 * 
 * @async
 * @function getLeaseById
 * @param {number} id - Lease ID
 * @returns {Promise<{id: number, tenant: object, unit: object, startDate: string, endDate: string, monthlyRent: number, status: string}>} Lease details
 * @throws {Error} When lease not found or request fails
 * 
 * @example
 * const lease = await getLeaseById(1);
 * console.log(`Lease for unit ${lease.unit.unitNumber}`);
 */
export const getLeaseById = async (id) => {
  return await apiClient.get(`/leases/${id}`);
};

/**
 * Creates a new lease agreement
 * 
 * @async
 * @function createLease
 * @param {object} leaseData - Lease creation data
 * @param {number} leaseData.tenantId - ID of the tenant
 * @param {number} leaseData.unitId - ID of the unit
 * @param {string} leaseData.startDate - Lease start date (ISO format)
 * @param {string} leaseData.endDate - Lease end date (ISO format)
 * @param {number} leaseData.monthlyRent - Monthly rent amount
 * @param {string} [leaseData.status='ACTIVE'] - Lease status (ACTIVE, EXPIRED, TERMINATED)
 * @returns {Promise<{id: number, tenant: object, unit: object, startDate: string, endDate: string, monthlyRent: number, status: string}>} Created lease
 * @throws {Error} When creation fails (e.g., unit already leased)
 * 
 * @example
 * const newLease = await createLease({
 *   tenantId: 1,
 *   unitId: 5,
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31',
 *   monthlyRent: 1500,
 *   status: 'ACTIVE'
 * });
 */
export const createLease = async (leaseData) => {
  return await apiClient.post('/leases', leaseData);
};

/**
 * Updates an existing lease
 * 
 * @async
 * @function updateLease
 * @param {number} id - Lease ID to update
 * @param {object} leaseData - Updated lease data
 * @param {string} [leaseData.startDate] - Updated start date
 * @param {string} [leaseData.endDate] - Updated end date
 * @param {number} [leaseData.monthlyRent] - Updated monthly rent
 * @param {string} [leaseData.status] - Updated status
 * @returns {Promise<{id: number, tenant: object, unit: object, startDate: string, endDate: string, monthlyRent: number, status: string}>} Updated lease
 * @throws {Error} When update fails or lease not found
 * 
 * @example
 * const updated = await updateLease(1, {
 *   endDate: '2025-12-31',
 *   monthlyRent: 1600
 * });
 */
export const updateLease = async (id, leaseData) => {
  return await apiClient.put(`/leases/${id}`, leaseData);
};

/**
 * Deletes a lease agreement
 * 
 * @async
 * @function deleteLease
 * @param {number} id - Lease ID to delete
 * @returns {Promise<void>}
 * @throws {Error} When deletion fails
 * 
 * @example
 * await deleteLease(5);
 * console.log('Lease deleted successfully');
 */
export const deleteLease = async (id) => {
  return await apiClient.delete(`/leases/${id}`);
};

/**
 * Retrieves active leases only
 * 
 * @async
 * @function getActiveLeases
 * @returns {Promise<Array<{id: number, tenant: object, unit: object, startDate: string, endDate: string, monthlyRent: number}>>} Array of active leases
 * @throws {Error} When fetching fails
 * 
 * @example
 * const active = await getActiveLeases();
 * console.log(`${active.length} active leases`);
 */
export const getActiveLeases = async () => {
  const leases = await getAllLeases();
  return leases.filter(lease => lease.status === 'ACTIVE');
};

/**
 * Downloads Lease Agreement PDF
 * 
 * @async
 * @function downloadLeaseAgreementPdf
 * @param {number} leaseId - Lease ID
 * @returns {Promise<Blob>} PDF file as Blob
 * @throws {Error} When download fails
 * 
 * @example
 * const pdfBlob = await downloadLeaseAgreementPdf(1);
 * const url = window.URL.createObjectURL(pdfBlob);
 * window.open(url, '_blank');
 */
export const downloadLeaseAgreementPdf = async (leaseId) => {
  const response = await apiClient.get(`/leases/${leaseId}/agreement`);
  return response;
};

/**
 * Terminates a lease (early checkout)
 * 
 * @async
 * @function terminateLease
 * @param {number} leaseId - Lease ID to terminate
 * @param {string} checkoutDate - Checkout date (ISO format: YYYY-MM-DD)
 * @returns {Promise<{id: number, status: string, actualEndDate: string}>} Terminated lease info
 * @throws {Error} When termination fails
 * 
 * @example
 * const terminated = await terminateLease(1, '2025-12-01');
 * console.log('Lease terminated. Unit will be available on:', terminated.actualEndDate);
 */
export const terminateLease = async (leaseId, checkoutDate) => {
  return await apiClient.post(`/leases/${leaseId}/terminate`, { checkoutDate });
};
