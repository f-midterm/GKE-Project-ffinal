/**
 * Report Service
 * 
 * Handles all report-related API calls for financial reports,
 * statistics, and analytics
 * 
 * @module api/services/report.service
 */

import apiClient from '../client/apiClient';

/**
 * Get admin dashboard statistics
 * 
 * @async
 * @function getAdminDashboard
 * @returns {Promise<Object>} Dashboard statistics
 * @throws {Error} When fetching fails
 */
export const getAdminDashboard = async () => {
  return await apiClient.get('/admin/dashboard');
};

/**
 * Get revenue by date range
 * 
 * @async
 * @function getRevenue
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Revenue data
 * @throws {Error} When fetching fails
 */
export const getRevenue = async (startDate, endDate) => {
  return await apiClient.get(`/payments/revenue?startDate=${startDate}&endDate=${endDate}`);
};

/**
 * Get monthly revenue summary for the current year
 * 
 * @async
 * @function getMonthlyRevenue
 * @param {number} year - Year to fetch data for
 * @returns {Promise<Array>} Monthly revenue data
 * @throws {Error} When fetching fails
 */
export const getMonthlyRevenue = async (year = new Date().getFullYear()) => {
  const months = [];
  
  for (let month = 1; month <= 12; month++) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    try {
      const data = await getRevenue(startDate, endDate);
      months.push({
        month,
        name: new Date(year, month - 1).toLocaleString('en', { month: 'short' }),
        revenue: data.totalRevenue || 0,
        startDate,
        endDate
      });
    } catch (error) {
      console.error(`Error fetching revenue for ${year}-${month}:`, error);
      months.push({
        month,
        name: new Date(year, month - 1).toLocaleString('en', { month: 'short' }),
        revenue: 0,
        startDate,
        endDate
      });
    }
  }
  
  return months;
};

/**
 * Get rental requests summary by unit type
 * 
 * @async
 * @function getRentalRequestsByUnitType
 * @returns {Promise<Array>} Rental requests grouped by unit type
 * @throws {Error} When fetching fails
 */
export const getRentalRequestsByUnitType = async () => {
  try {
    const rentalRequests = await apiClient.get('/rental-requests');
    const units = await apiClient.get('/units');
    
    // Count approved requests by unit type
    const unitTypeCounts = {};
    
    rentalRequests.forEach(request => {
      if (request.status === 'APPROVED') {
        const unit = units.find(u => u.id === request.unitId);
        if (unit) {
          const type = unit.type || 'Other';
          unitTypeCounts[type] = (unitTypeCounts[type] || 0) + 1;
        }
      }
    });
    
    return Object.entries(unitTypeCounts).map(([name, value]) => ({
      name,
      value
    }));
  } catch (error) {
    console.error('Error fetching rental requests by unit type:', error);
    return [];
  }
};

/**
 * Get booking summary by month
 * 
 * @async
 * @function getMonthlyBookings
 * @param {number} year - Year to fetch data for
 * @returns {Promise<Array>} Monthly booking data
 * @throws {Error} When fetching fails
 */
export const getMonthlyBookings = async (year = new Date().getFullYear()) => {
  try {
    const rentalRequests = await apiClient.get('/rental-requests');
    
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      name: new Date(year, i).toLocaleString('en', { month: 'short' }),
      bookings: 0
    }));
    
    rentalRequests.forEach(request => {
      const requestDate = new Date(request.requestDate);
      if (requestDate.getFullYear() === year) {
        const monthIndex = requestDate.getMonth();
        monthlyData[monthIndex].bookings += 1;
      }
    });
    
    return monthlyData;
  } catch (error) {
    console.error('Error fetching monthly bookings:', error);
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      name: new Date(year, i).toLocaleString('en', { month: 'short' }),
      bookings: 0
    }));
  }
};

/**
 * Get total expenses (maintenance costs)
 * 
 * @async
 * @function getTotalExpenses
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<number>} Total expenses
 * @throws {Error} When fetching fails
 */
export const getTotalExpenses = async (startDate, endDate) => {
  try {
    const maintenanceRequests = await apiClient.get('/maintenance-requests');
    
    const total = maintenanceRequests
      .filter(request => {
        const completedDate = new Date(request.completedDate);
        return request.status === 'COMPLETED' &&
               request.actualCost &&
               completedDate >= new Date(startDate) &&
               completedDate <= new Date(endDate);
      })
      .reduce((sum, request) => sum + (request.actualCost || 0), 0);
    
    return total;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return 0;
  }
};

/**
 * Get monthly expenses for the year
 * 
 * @async
 * @function getMonthlyExpenses
 * @param {number} year - Year to fetch data for
 * @returns {Promise<Array>} Monthly expense data
 * @throws {Error} When fetching fails
 */
export const getMonthlyExpenses = async (year = new Date().getFullYear()) => {
  try {
    const maintenanceRequests = await apiClient.get('/maintenance-requests');
    
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      name: new Date(year, i).toLocaleString('en', { month: 'short' }),
      expense: 0
    }));
    
    maintenanceRequests.forEach(request => {
      if (request.status === 'COMPLETED' && request.actualCost && request.completedDate) {
        const completedDate = new Date(request.completedDate);
        if (completedDate.getFullYear() === year) {
          const monthIndex = completedDate.getMonth();
          monthlyData[monthIndex].expense += request.actualCost;
        }
      }
    });
    
    return monthlyData;
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      name: new Date(year, i).toLocaleString('en', { month: 'short' }),
      expense: 0
    }));
  }
};
