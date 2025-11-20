/**
 * useApi Hook
 * 
 * Custom hook for making API calls with loading, error, and data state management.
 * 
 * @module hooks/useApi
 */

import { useState, useCallback } from 'react';

/**
 * Generic API hook for managing API call state
 * 
 * @param {Function} apiFunc - API function to call
 * @returns {object} API state and execute function
 * @returns {any} return.data - Response data
 * @returns {boolean} return.loading - Whether request is in progress
 * @returns {string|null} return.error - Error message if any
 * @returns {Function} return.execute - Function to execute API call
 * @returns {Function} return.reset - Function to reset state
 * 
 * @example
 * const { data, loading, error, execute } = useApi(getAllUnits);
 * 
 * useEffect(() => {
 *   execute();
 * }, []);
 */
export const useApi = (apiFunc) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Execute the API function
   */
  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFunc(...args);
      setData(response);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

/**
 * API hook that automatically executes on mount
 * 
 * @param {Function} apiFunc - API function to call
 * @param {Array} [dependencies=[]] - Dependencies for re-execution
 * @returns {object} API state and refetch function
 * 
 * @example
 * const { data: units, loading, error, refetch } = useApiOnMount(getAllUnits);
 */
export const useApiOnMount = (apiFunc, dependencies = []) => {
  const { data, loading, error, execute, reset } = useApi(apiFunc);

  // Execute on mount and when dependencies change
  React.useEffect(() => {
    execute();
  }, [execute, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    reset,
  };
};
