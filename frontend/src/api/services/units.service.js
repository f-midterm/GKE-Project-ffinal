/**
 * Units Service
 * 
 * Handles all unit-related API calls including fetching, creating,
 * updating, and deleting apartment units.
 * 
 * @module api/services/units.service
 */

import apiClient from '../client/apiClient';

/**
 * Retrieves all apartment units
 * 
 * @async
 * @function getAllUnits
 * @returns {Promise<Array<{id: number, roomNumber: string, floor: number, rentAmount: number, status: string, type: string, sizeSqm: number}>>} Array of all units
 * @throws {Error} When fetching units fails
 * 
 * @example
 * const units = await getAllUnits();
 * console.log(`Total units: ${units.length}`);
 */
export const getAllUnits = async () => {
  return await apiClient.get('/units');
};

/**
 * Retrieves a specific unit by ID
 * 
 * @async
 * @function getUnitById
 * @param {number} id - Unit ID
 * @returns {Promise<{id: number, roomNumber: string, floor: number, rentAmount: number, status: string, type: string, sizeSqm: number, description: string}>} Unit details
 * @throws {Error} When unit not found or request fails
 * 
 * @example
 * const unit = await getUnitById(1);
 * console.log(`Unit ${unit.roomNumber} on floor ${unit.floor}`);
 */
export const getUnitById = async (id) => {
  return await apiClient.get(`/units/${id}`);
};

/**
 * Retrieves detailed information about a unit including tenant and lease data
 * 
 * @async
 * @function getUnitDetails
 * @param {number} id - Unit ID
 * @returns {Promise<{unit: object, lease: object, tenant: object}>} Unit details with tenant and lease info
 * @throws {Error} When unit not found or request fails
 * 
 * @example
 * const details = await getUnitDetails(1);
 * console.log(`Unit ${details.unit.roomNumber} - Tenant: ${details.tenant?.firstName}`);
 */
export const getUnitDetails = async (id) => {
  return await apiClient.get(`/units/${id}/details`);
};

/**
 * Creates a new apartment unit
 * 
 * @async
 * @function createUnit
 * @param {object} unitData - Unit creation data
 * @param {string} unitData.roomNumber - Room number (e.g., "101", "A-205")
 * @param {number} unitData.floor - Floor number
 * @param {number} unitData.rentAmount - Monthly rent amount
 * @param {string} unitData.type - Unit type (Standard, Deluxe, Premium)
 * @param {number} [unitData.sizeSqm] - Size in square meters
 * @param {string} [unitData.description] - Unit description
 * @param {string} [unitData.status='AVAILABLE'] - Unit status (AVAILABLE, OCCUPIED, MAINTENANCE)
 * @returns {Promise<{id: number, roomNumber: string, floor: number, rentAmount: number, status: string, type: string}>} Created unit
 * @throws {Error} When creation fails (e.g., duplicate room number)
 * 
 * @example
 * const newUnit = await createUnit({
 *   roomNumber: '301',
 *   floor: 3,
 *   rentAmount: 1500,
 *   type: 'Standard',
 *   sizeSqm: 25.0,
 *   status: 'AVAILABLE'
 * });
 */
export const createUnit = async (unitData) => {
  return await apiClient.post('/units', unitData);
};

/**
 * Updates an existing unit
 * 
 * @async
 * @function updateUnit
 * @param {number} id - Unit ID to update
 * @param {object} unitData - Updated unit data
 * @param {string} [unitData.roomNumber] - Updated room number
 * @param {number} [unitData.floor] - Updated floor number
 * @param {number} [unitData.rentAmount] - Updated rent amount
 * @param {string} [unitData.type] - Updated unit type
 * @param {number} [unitData.sizeSqm] - Updated size
 * @param {string} [unitData.description] - Updated description
 * @param {string} [unitData.status] - Updated status
 * @returns {Promise<{id: number, roomNumber: string, floor: number, rentAmount: number, status: string, type: string}>} Updated unit
 * @throws {Error} When update fails or unit not found
 * 
 * @example
 * const updated = await updateUnit(1, {
 *   rentAmount: 1600,
 *   status: 'OCCUPIED'
 * });
 */
export const updateUnit = async (id, unitData) => {
  return await apiClient.put(`/units/${id}`, unitData);
};

/**
 * Deletes a unit
 * 
 * @async
 * @function deleteUnit
 * @param {number} id - Unit ID to delete
 * @returns {Promise<void>}
 * @throws {Error} When deletion fails or unit has active leases
 * 
 * @example
 * await deleteUnit(5);
 * console.log('Unit deleted successfully');
 */
export const deleteUnit = async (id) => {
  return await apiClient.delete(`/units/${id}`);
};

/**
 * Retrieves available (unoccupied) units
 * 
 * @async
 * @function getAvailableUnits
 * @returns {Promise<Array<{id: number, roomNumber: string, floor: number, rentAmount: number, type: string, sizeSqm: number}>>} Array of available units
 * @throws {Error} When fetching fails
 * 
 * @example
 * const available = await getAvailableUnits();
 * console.log(`${available.length} units available for rent`);
 */
export const getAvailableUnits = async () => {
  const units = await getAllUnits();
  return units.filter(unit => unit.status === 'AVAILABLE');
};
