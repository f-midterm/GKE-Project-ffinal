/**
 * API Services Index
 * 
 * Central export point for all API services.
 * Import from this file to access any API function.
 * 
 * @module api
 * 
 * @example
 * // Import specific services
 * import { login, logout } from '@/api';
 * import { getAllUnits, createUnit } from '@/api';
 * 
 * // Or import all from a namespace
 * import * as authAPI from '@/api/services/auth.service';
 * import * as unitsAPI from '@/api/services/units.service';
 */

// Authentication
export {
  login,
  register,
  logout,
  getCurrentUser,
  refreshUser,
  isAuthenticated,
  isAdmin,
  isVillager,
  getRole,
  getUsername
} from './services/auth.service';

// Units
export {
  getAllUnits,
  getUnitById,
  getUnitDetails,
  createUnit,
  updateUnit,
  deleteUnit,
  getAvailableUnits
} from './services/units.service';

// Tenants
export {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant
} from './services/tenants.service';

// Leases
export {
  getAllLeases,
  getLeaseById,
  createLease,
  updateLease,
  deleteLease,
  getActiveLeases
} from './services/leases.service';

// Payments
export {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByLeaseId,
  getPendingPayments
} from './services/payments.service';

// Maintenance
export {
  getAllMaintenanceRequests,
  getMaintenanceRequestById,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
  getPendingRequests,
  getHighPriorityRequests
} from './services/maintenance.service';

// Rental Requests
export {
  getAllRentalRequests,
  getRentalRequestById,
  createRentalRequest,
  updateRentalRequest,
  deleteRentalRequest,
  getPendingRentalRequests,
  approveRentalRequest,
  rejectRentalRequest
} from './services/rentalRequests.service';

// Dashboard
export {
  getDashboardStats,
  computeDashboardStats,
  getRecentActivity,
  getRevenueTrends,
  computeRevenueTrends
} from './services/dashboard.service';

// API Client (for advanced usage)
export { default as apiClient } from './client/apiClient';
