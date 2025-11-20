/**
 * Dashboard Service
 * 
 * Handles dashboard-related API calls including statistics,
 * summaries, and aggregated data.
 * 
 * @module api/services/dashboard.service
 */

import apiClient from '../client/apiClient';
import { getAllUnits } from './units.service';
import { getAllTenants } from './tenants.service';
import { getAllPayments } from './payments.service';
import { getAllMaintenanceRequests } from './maintenance.service';

/**
 * Retrieves dashboard statistics
 * Note: This endpoint may not exist in backend - falls back to computed statistics
 * 
 * @async
 * @function getDashboardStats
 * @returns {Promise<{totalUnits: number, totalTenants: number, totalRevenue: number, pendingMaintenance: number}>} Dashboard statistics
 * @throws {Error} When fetching statistics fails
 * 
 * @example
 * const stats = await getDashboardStats();
 * console.log(`Total revenue: $${stats.totalRevenue}`);
 */
export const getDashboardStats = async () => {
  try {
    // Try to fetch from backend endpoint if it exists
    return await apiClient.get('/dashboard/stats');
  } catch (error) {
    // Fallback: compute statistics from individual endpoints
    return await computeDashboardStats();
  }
};

/**
 * Computes dashboard statistics from individual API endpoints
 * Used as fallback when dedicated dashboard endpoint is not available
 * 
 * @async
 * @function computeDashboardStats
 * @returns {Promise<{totalUnits: number, occupiedUnits: number, totalTenants: number, totalRevenue: number, pendingMaintenance: number, activeLeases: number}>} Computed statistics
 * @throws {Error} When computation fails
 * 
 * @example
 * const stats = await computeDashboardStats();
 * console.log(`Occupancy rate: ${(stats.occupiedUnits / stats.totalUnits * 100).toFixed(1)}%`);
 */
export const computeDashboardStats = async () => {
  try {
    const [units, tenants, payments, maintenanceRequests] = await Promise.all([
      getAllUnits(),
      getAllTenants(),
      getAllPayments(),
      getAllMaintenanceRequests()
    ]);

    const occupiedUnits = units.filter(u => u.status === 'OCCUPIED').length;
    const completedPayments = payments.filter(p => p.status === 'COMPLETED');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingMaintenance = maintenanceRequests.filter(r => r.status === 'PENDING').length;

    return {
      totalUnits: units.length,
      occupiedUnits,
      availableUnits: units.filter(u => u.status === 'AVAILABLE').length,
      totalTenants: tenants.length,
      totalRevenue,
      pendingMaintenance,
      totalMaintenanceRequests: maintenanceRequests.length,
      totalPayments: payments.length,
      completedPayments: completedPayments.length,
      occupancyRate: units.length > 0 ? (occupiedUnits / units.length * 100).toFixed(1) : 0
    };
  } catch (error) {
    console.error('Failed to compute dashboard stats:', error);
    throw new Error('Failed to load dashboard statistics');
  }
};

/**
 * Retrieves recent activity for the dashboard
 * 
 * @async
 * @function getRecentActivity
 * @param {number} [limit=10] - Maximum number of recent items to return
 * @returns {Promise<Array<{type: string, description: string, date: string}>>} Array of recent activities
 * @throws {Error} When fetching activity fails
 * 
 * @example
 * const activities = await getRecentActivity(5);
 * activities.forEach(a => console.log(`${a.type}: ${a.description}`));
 */
export const getRecentActivity = async (limit = 10) => {
  try {
    return await apiClient.get(`/dashboard/recent-activity?limit=${limit}`);
  } catch (error) {
    // Fallback: return empty array if endpoint doesn't exist
    return [];
  }
};

/**
 * Retrieves revenue trends over time
 * 
 * @async
 * @function getRevenueTrends
 * @param {string} period - Time period ('month', 'quarter', 'year')
 * @returns {Promise<Array<{period: string, revenue: number}>>} Revenue data by period
 * @throws {Error} When fetching trends fails
 * 
 * @example
 * const trends = await getRevenueTrends('month');
 * trends.forEach(t => console.log(`${t.period}: $${t.revenue}`));
 */
export const getRevenueTrends = async (period = 'month') => {
  try {
    return await apiClient.get(`/dashboard/revenue-trends?period=${period}`);
  } catch (error) {
    // Fallback: compute from payments
    return await computeRevenueTrends(period);
  }
};

/**
 * Computes revenue trends from payment data
 * 
 * @async
 * @function computeRevenueTrends
 * @param {string} period - Time period ('month', 'quarter', 'year')
 * @returns {Promise<Array<{period: string, revenue: number}>>} Computed revenue trends
 * 
 * @example
 * const trends = await computeRevenueTrends('month');
 */
export const computeRevenueTrends = async (period = 'month') => {
  try {
    const payments = await getAllPayments();
    const completedPayments = payments.filter(p => p.status === 'COMPLETED');
    
    // Group payments by period
    const grouped = {};
    completedPayments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      let key;
      
      switch (period) {
        case 'year':
          key = date.getFullYear().toString();
          break;
        case 'quarter':
          key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
          break;
        case 'month':
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      grouped[key] = (grouped[key] || 0) + (payment.amount || 0);
    });
    
    return Object.entries(grouped).map(([period, revenue]) => ({
      period,
      revenue
    })).sort((a, b) => a.period.localeCompare(b.period));
  } catch (error) {
    console.error('Failed to compute revenue trends:', error);
    return [];
  }
};
