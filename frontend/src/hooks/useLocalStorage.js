/**
 * useLocalStorage Hook
 * 
 * Custom hook for managing localStorage state with React state synchronization.
 * 
 * @module hooks/useLocalStorage
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for persisting state in localStorage
 * 
 * @param {string} key - LocalStorage key
 * @param {any} initialValue - Initial value if key doesn't exist
 * @returns {[any, Function, Function]} [storedValue, setValue, removeValue]
 * 
 * @example
 * const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
 * 
 * // Set value
 * setTheme('dark');
 * 
 * // Remove value
 * removeTheme();
 */
export const useLocalStorage = (key, initialValue) => {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Set value in both state and localStorage
   */
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function (same as useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  /**
   * Remove value from both state and localStorage
   */
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync with localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
};

/**
 * Hook for persisting string values in localStorage (without JSON parsing)
 * 
 * @param {string} key - LocalStorage key
 * @param {string} initialValue - Initial value if key doesn't exist
 * @returns {[string, Function, Function]} [storedValue, setValue, removeValue]
 * 
 * @example
 * const [token, setToken, removeToken] = useLocalStorageString('token', '');
 */
export const useLocalStorageString = (key, initialValue = '') => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? item : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, valueToStore);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};
