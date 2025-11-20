/**
 * Local Storage Utilities
 * 
 * Safe wrapper functions for localStorage operations with error handling
 * and type conversion support.
 * 
 * @module utils/storage
 */

/**
 * Safely retrieves an item from localStorage
 * 
 * @param {string} key - Storage key
 * @param {any} [defaultValue=null] - Default value if key doesn't exist
 * @returns {any} Retrieved value or default
 * 
 * @example
 * const token = getItem('token');
 * const user = getItem('user', {});
 */
export const getItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Safely retrieves and parses a JSON item from localStorage
 * 
 * @param {string} key - Storage key
 * @param {any} [defaultValue=null] - Default value if key doesn't exist or parsing fails
 * @returns {any} Parsed value or default
 * 
 * @example
 * const settings = getJSONItem('settings', { theme: 'light' });
 */
export const getJSONItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Safely sets an item in localStorage
 * 
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {boolean} True if successful, false otherwise
 * 
 * @example
 * setItem('token', 'abc123');
 */
export const setItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Safely sets a JSON item in localStorage
 * 
 * @param {string} key - Storage key
 * @param {any} value - Value to stringify and store
 * @returns {boolean} True if successful, false otherwise
 * 
 * @example
 * setJSONItem('user', { id: 1, name: 'John' });
 */
export const setJSONItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Safely removes an item from localStorage
 * 
 * @param {string} key - Storage key
 * @returns {boolean} True if successful, false otherwise
 * 
 * @example
 * removeItem('token');
 */
export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Safely clears all items from localStorage
 * 
 * @returns {boolean} True if successful, false otherwise
 * 
 * @example
 * clearAll(); // Clear all storage
 */
export const clearAll = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

/**
 * Checks if a key exists in localStorage
 * 
 * @param {string} key - Storage key
 * @returns {boolean} True if key exists
 * 
 * @example
 * if (hasItem('token')) {
 *   console.log('User is logged in');
 * }
 */
export const hasItem = (key) => {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error(`Error checking localStorage key "${key}":`, error);
    return false;
  }
};
