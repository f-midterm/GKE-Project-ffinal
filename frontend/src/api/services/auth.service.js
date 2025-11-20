/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls including login, registration,
 * logout, and user management.
 * 
 * @module api/services/auth.service
 */

import apiClient from '../client/apiClient';

/**
 * Authenticates a user with username and password
 * 
 * @async
 * @function login
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise<{token: string, role: string}>} Authentication response with JWT token and user role
 * @throws {Error} When authentication fails
 * 
 * @example
 * const { token, role } = await login('john_doe', 'password123');
 * localStorage.setItem('token', token);
 */
export const login = async (username, password) => {
  const response = await apiClient.post('/auth/login', { username, password });
  
  if (response?.token) {
    localStorage.setItem('token', response.token);
    if (response.role) {
      localStorage.setItem('role', response.role);
    }
  }
  
  return response;
};

/**
 * Registers a new user account
 * 
 * @async
 * @function register
 * @param {object} userData - User registration data
 * @param {string} userData.username - Desired username
 * @param {string} userData.password - User's password
 * @param {string} userData.email - User's email address
 * @param {string} [userData.phoneNumber] - User's phone number (optional)
 * @param {string} [userData.role='USER'] - User role (USER, VILLAGER, ADMIN)
 * @returns {Promise<{message: string, username: string, token: string, role: string}>} Registration success response with token for auto-login
 * @throws {Error} When registration fails (e.g., username already exists)
 * 
 * @example
 * const response = await register({
 *   username: 'john_doe',
 *   password: 'securePassword123',
 *   email: 'john@example.com',
 *   phoneNumber: '1234567890',
 *   role: 'USER'
 * });
 * // Response includes token for auto-login
 */
export const register = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  
  // Auto-login: Save token and user info
  if (response?.token) {
    localStorage.setItem('token', response.token);
    if (response.role) {
      localStorage.setItem('role', response.role);
    }
    if (response.username) {
      localStorage.setItem('username', response.username);
    }
  }
  
  return response;
};

/**
 * Logs out the current user by clearing stored credentials
 * 
 * @function logout
 * @returns {void}
 * 
 * @example
 * logout();
 * navigate('/login');
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
};

/**
 * Retrieves the currently authenticated user's information
 * 
 * @async
 * @function getCurrentUser
 * @returns {Promise<{id: number, username: string, email: string, role: string, phoneNumber: string}>} Current user data
 * @throws {Error} When user is not authenticated or request fails
 * 
 * @example
 * const user = await getCurrentUser();
 * console.log(`Welcome, ${user.username}!`);
 */
export const getCurrentUser = async () => {
  return await apiClient.get('/auth/me');
};

/**
 * Refreshes the current user's data from the server
 * Updates localStorage with fresh user information
 * 
 * @async
 * @function refreshUser
 * @returns {Promise<{id: number, username: string, email: string, role: string, phoneNumber: string}>} Updated user data
 * @throws {Error} When refresh fails
 * 
 * @example
 * const updatedUser = await refreshUser();
 * setUser(updatedUser);
 */
export const refreshUser = async () => {
  const user = await getCurrentUser();
  if (user) {
    localStorage.setItem('username', user.username);
    localStorage.setItem('role', user.role);
  }
  return user;
};

/**
 * Checks if a user is currently authenticated
 * 
 * @function isAuthenticated
 * @returns {boolean} True if user has a valid token, false otherwise
 * 
 * @example
 * if (isAuthenticated()) {
 *   // Allow access to protected route
 * } else {
 *   navigate('/login');
 * }
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Checks if the current user has the ADMIN role
 * 
 * @function isAdmin
 * @returns {boolean} True if user is an admin, false otherwise
 * 
 * @example
 * if (isAdmin()) {
 *   return <AdminDashboard />;
 * }
 */
export const isAdmin = () => {
  return localStorage.getItem('role') === 'ADMIN';
};

/**
 * Checks if the current user has the VILLAGER role
 * 
 * @function isVillager
 * @returns {boolean} True if user is a villager, false otherwise
 * 
 * @example
 * if (isVillager()) {
 *   return <VillagerDashboard />;
 * }
 */
export const isVillager = () => {
  return localStorage.getItem('role') === 'VILLAGER';
};

/**
 * Gets the stored user role
 * 
 * @function getRole
 * @returns {string|null} User role or null if not found
 * 
 * @example
 * const role = getRole();
 * console.log(`User role: ${role}`);
 */
export const getRole = () => {
  return localStorage.getItem('role');
};

/**
 * Gets the stored username
 * 
 * @function getUsername
 * @returns {string|null} Username or null if not found
 * 
 * @example
 * const username = getUsername();
 * console.log(`Logged in as: ${username}`);
 */
export const getUsername = () => {
  return localStorage.getItem('username');
};
