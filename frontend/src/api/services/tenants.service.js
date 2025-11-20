/**
 * Tenants Service
 * 
 * Handles all tenant-related API calls including fetching, creating,
 * updating, and deleting tenant records.
 * 
 * @module api/services/tenants.service
 */

import apiClient from '../client/apiClient';

/**
 * Retrieves all tenants
 * 
 * @async
 * @function getAllTenants
 * @returns {Promise<Array<{id: number, name: string, email: string, phoneNumber: string, moveInDate: string}>>} Array of all tenants
 * @throws {Error} When fetching tenants fails
 * 
 * @example
 * const tenants = await getAllTenants();
 * console.log(`Total tenants: ${tenants.length}`);
 */
export const getAllTenants = async () => {
  return await apiClient.get('/tenants');
};

/**
 * Retrieves a specific tenant by ID
 * 
 * @async
 * @function getTenantById
 * @param {number} id - Tenant ID
 * @returns {Promise<{id: number, name: string, email: string, phoneNumber: string, moveInDate: string}>} Tenant details
 * @throws {Error} When tenant not found or request fails
 * 
 * @example
 * const tenant = await getTenantById(1);
 * console.log(`Tenant: ${tenant.name}`);
 */
export const getTenantById = async (id) => {
  return await apiClient.get(`/tenants/${id}`);
};

/**
 * Creates a new tenant record
 * 
 * @async
 * @function createTenant
 * @param {object} tenantData - Tenant creation data
 * @param {string} tenantData.name - Tenant's full name
 * @param {string} tenantData.email - Tenant's email address
 * @param {string} tenantData.phoneNumber - Tenant's phone number
 * @param {string} [tenantData.moveInDate] - Move-in date (ISO format)
 * @returns {Promise<{id: number, name: string, email: string, phoneNumber: string, moveInDate: string}>} Created tenant
 * @throws {Error} When creation fails (e.g., duplicate email)
 * 
 * @example
 * const newTenant = await createTenant({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phoneNumber: '1234567890',
 *   moveInDate: '2024-01-15'
 * });
 */
export const createTenant = async (tenantData) => {
  return await apiClient.post('/tenants', tenantData);
};

/**
 * Updates an existing tenant
 * 
 * @async
 * @function updateTenant
 * @param {number} id - Tenant ID to update
 * @param {object} tenantData - Updated tenant data
 * @param {string} [tenantData.name] - Updated name
 * @param {string} [tenantData.email] - Updated email
 * @param {string} [tenantData.phoneNumber] - Updated phone number
 * @param {string} [tenantData.moveInDate] - Updated move-in date
 * @returns {Promise<{id: number, name: string, email: string, phoneNumber: string, moveInDate: string}>} Updated tenant
 * @throws {Error} When update fails or tenant not found
 * 
 * @example
 * const updated = await updateTenant(1, {
 *   phoneNumber: '9876543210',
 *   email: 'john.new@example.com'
 * });
 */
export const updateTenant = async (id, tenantData) => {
  return await apiClient.put(`/tenants/${id}`, tenantData);
};

/**
 * Deletes a tenant
 * 
 * @async
 * @function deleteTenant
 * @param {number} id - Tenant ID to delete
 * @returns {Promise<void>}
 * @throws {Error} When deletion fails or tenant has active leases
 * 
 * @example
 * await deleteTenant(5);
 * console.log('Tenant deleted successfully');
 */
export const deleteTenant = async (id) => {
  return await apiClient.delete(`/tenants/${id}`);
};
