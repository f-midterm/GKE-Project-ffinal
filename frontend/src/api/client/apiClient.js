/**
 * API Client
 * 
 * Centralized HTTP client for making API requests.
 * Handles authentication, error handling, and request/response interceptors.
 * 
 * @module api/client/apiClient
 */

import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = '/api';

// Backend URL for static resources (images, files)
// Use relative path to go through Vite proxy in development
// In production, same origin will work
const BACKEND_URL = '';

/**
 * Build full URL for backend static resources (images, files)
 * @param {string} path - Relative path from backend (e.g., /uploads/payment-slips/...)
 * @returns {string} Full URL to access the resource
 */
export const getBackendResourceUrl = (path) => {
  if (!path) return '';
  // Return path as-is - will go through proxy /api or direct in production
  // Need to proxy /uploads/** to backend in vite.config.js
  return path;
};

/**
 * API Client class for making HTTP requests
 */
class APIClient {
  /**
   * Makes an HTTP request to the API
   * 
   * @private
   * @param {string} endpoint - API endpoint (e.g., '/auth/login')
   * @param {object} options - Fetch API options
   * @returns {Promise<any>} Response data
   */
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    // Validate token before making request
    if (token && !this.isTokenValid(token)) {
      console.warn('Token expired - logging out');
      this.handleLogout();
      return Promise.reject(new Error('Session expired. Please login again.'));
    }
    
    // Don't set Content-Type for FormData - browser will set it with proper boundary
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    
    // Only add Content-Type if not FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    const config = {
      headers: headers,
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await this.handleErrorResponse(response);
        throw new Error(errorData);
      }
      
      return await this.handleSuccessResponse(response);
    } catch (error) {
      console.error(`API request failed [${endpoint}]:`, error.message);
      throw error;
    }
  }

  /**
   * Handles successful API responses
   * 
   * @private
   * @param {Response} response - Fetch Response object
   * @returns {Promise<any>} Parsed response data
   */
  async handleSuccessResponse(response) {
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // Handle PDF/Blob responses
    if (contentType && contentType.includes('application/pdf')) {
      return await response.blob();
    }
    
    // Handle empty responses (204 No Content, etc.)
    if (response.status === 204 || contentLength === '0' || 
        (!contentType || !contentType.includes('application/json'))) {
      return null;
    }
    
    // Parse JSON response
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Handles API error responses
   * 
   * @private
   * @param {Response} response - Fetch Response object
   * @returns {Promise<string>} Error message
   */
  async handleErrorResponse(response) {
    // Handle authentication errors - auto logout
    if (response.status === 401 || response.status === 403) {
      console.warn('Authentication failed - logging out');
      this.handleLogout();
      return 'Session expired. Please login again.';
    }
    
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorData = await response.text();
      if (errorData) {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(errorData);
          // Extract message from various error formats
          errorMessage = parsed.message || parsed.error || parsed.details || errorData;
        } catch {
          errorMessage = errorData;
        }
      }
    } catch (e) {
      // Use default error message
    }
    
    return errorMessage;
  }

  /**
   * Makes a GET request
   * 
   * @param {string} endpoint - API endpoint
   * @param {object} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Makes a POST request
   * 
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {object} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data, options = {}) {
    // Don't stringify FormData - it needs to be sent as-is with proper boundary
    const body = data instanceof FormData ? data : JSON.stringify(data);
    
    return this.request(endpoint, {
      method: 'POST',
      body: body,
      ...options,
    });
  }

  /**
   * Makes a PUT request
   * 
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {object} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Makes a DELETE request
   * 
   * @param {string} endpoint - API endpoint
   * @param {object} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * Makes a PATCH request
   * 
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {object} options - Additional fetch options
   * @returns {Promise<any>} Response data
   */
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Validates JWT token expiration
   * 
   * @private
   * @param {string} token - JWT token
   * @returns {boolean} True if token is valid and not expired
   */
  isTokenValid(token) {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      console.error('Invalid token:', error);
      return false;
    }
  }

  /**
   * Handles user logout - clears storage and redirects to login
   * 
   * @private
   */
  handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    // Redirect to login with expired message
    window.location.href = '/login?session=expired';
  }
}

// Export singleton instance
const apiClient = new APIClient();
export default apiClient;
