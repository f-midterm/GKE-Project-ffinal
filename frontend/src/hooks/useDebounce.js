/**
 * useDebounce Hook
 * 
 * Custom hook for debouncing values to improve performance
 * in search inputs and other frequently changing values.
 * 
 * @module hooks/useDebounce
 */

import { useState, useEffect } from 'react';

/**
 * Debounces a value by delaying updates
 * 
 * @param {any} value - Value to debounce
 * @param {number} [delay=500] - Delay in milliseconds
 * @returns {any} Debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     searchAPI(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up timer to update debounced value
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timer on value or delay change
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Debounces a callback function
 * 
 * @param {Function} callback - Callback function to debounce
 * @param {number} [delay=500] - Delay in milliseconds
 * @returns {Function} Debounced callback function
 * 
 * @example
 * const handleSearch = useDebouncedCallback((term) => {
 *   searchAPI(term);
 * }, 300);
 * 
 * <input onChange={(e) => handleSearch(e.target.value)} />
 */
export const useDebouncedCallback = (callback, delay = 500) => {
  const [timer, setTimer] = useState(null);

  const debouncedCallback = (...args) => {
    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimer(newTimer);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  return debouncedCallback;
};
