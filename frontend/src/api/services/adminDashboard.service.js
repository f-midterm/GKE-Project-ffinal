/**
 * Admin Dashboard Service
 * Handles API calls for admin dashboard data
 */

import apiClient from '../client/apiClient';

/**
 * Get admin dashboard data
 * Includes statistics and expiring leases
 * 
 * @async
 * @returns {Promise<Object>} Dashboard data with statistics
 * @example
 * const data = await getAdminDashboard();
 * console.log(data.adminName, data.leasesExpiringSoon);
 */
export const getAdminDashboard = async () => {
  return await apiClient.get('admin/dashboard');
};

export default {
  getAdminDashboard,
};
