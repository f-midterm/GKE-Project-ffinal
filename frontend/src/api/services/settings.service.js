/**
 * Settings Service
 * 
 * Handles apartment-wide settings like utility rates
 */

import apiClient from '../client/apiClient';

/**
 * Get all settings
 */
export const getAllSettings = async () => {
  return await apiClient.get('/settings');
};

/**
 * Get utility rates (electricity and water)
 */
export const getUtilityRates = async () => {
  return await apiClient.get('/settings/utility-rates');
};

/**
 * Update utility rates (Admin only)
 */
export const updateUtilityRates = async (rates) => {
  return await apiClient.put('/settings/utility-rates', rates);
};

/**
 * Update a specific setting (Admin only)
 */
export const updateSetting = async (key, value) => {
  return await apiClient.put(`/settings/${key}`, { value });
};
