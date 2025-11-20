/**
 * Application Constants
 * 
 * Central location for application-wide constants, configuration values,
 * and magic strings/numbers.
 * 
 * @module utils/constants
 */

/**
 * User roles
 * @constant
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  VILLAGER: 'VILLAGER',
  USER: 'USER',
};

/**
 * Unit status values
 * @constant
 */
export const UNIT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  MAINTENANCE: 'MAINTENANCE',
};

/**
 * Lease status values
 * @constant
 */
export const LEASE_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED',
};

/**
 * Payment status values
 * @constant
 */
export const PAYMENT_STATUS = {
  COMPLETED: 'COMPLETED',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
};

/**
 * Payment methods
 * @constant
 */
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  CHECK: 'CHECK',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CREDIT_CARD: 'CREDIT_CARD',
};

/**
 * Maintenance request status values
 * @constant
 */
export const MAINTENANCE_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

/**
 * Maintenance request priority levels
 * @constant
 */
export const MAINTENANCE_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

/**
 * Rental request status values
 * @constant
 */
export const RENTAL_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

/**
 * LocalStorage keys
 * @constant
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  ROLE: 'role',
  USERNAME: 'username',
  THEME: 'theme',
};

/**
 * API endpoints (base paths)
 * @constant
 */
export const API_ENDPOINTS = {
  AUTH: '/auth',
  UNITS: '/units',
  TENANTS: '/tenants',
  LEASES: '/leases',
  PAYMENTS: '/payments',
  MAINTENANCE: '/maintenance-requests',
  RENTAL_REQUESTS: '/rental-requests',
  DASHBOARD: '/dashboard',
};

/**
 * Route paths
 * @constant
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_TENANTS: '/admin/tenants',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_MAINTENANCE: '/admin/maintenance',
};

/**
 * Date formats
 * @constant
 */
export const DATE_FORMATS = {
  SHORT: 'short',
  MEDIUM: 'medium',
  LONG: 'long',
  FULL: 'full',
};

/**
 * Pagination defaults
 * @constant
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

/**
 * Form validation messages
 * @constant
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  INVALID_NUMBER: 'Please enter a valid number',
  INVALID_DATE: 'Please enter a valid date',
};

/**
 * HTTP status codes (commonly used)
 * @constant
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Debounce delays (in milliseconds)
 * @constant
 */
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  RESIZE: 150,
  SCROLL: 100,
};

/**
 * Theme options
 * @constant
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

/**
 * Table column keys for different entities
 * @constant
 */
export const TABLE_COLUMNS = {
  TENANTS: ['name', 'email', 'phoneNumber', 'moveInDate', 'actions'],
  PAYMENTS: ['tenant', 'amount', 'paymentDate', 'paymentMethod', 'status', 'actions'],
  MAINTENANCE: ['unit', 'description', 'priority', 'status', 'requestDate', 'actions'],
};
