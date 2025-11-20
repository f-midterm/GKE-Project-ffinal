/**
 * useAuth Hook
 * 
 * Custom hook for managing authentication state and operations.
 * 
 * @module hooks/useAuth
 */

import { useState, useEffect, useCallback } from 'react';
import {
  login as loginAPI,
  logout as logoutAPI,
  getCurrentUser,
  isAuthenticated as checkAuth,
  isAdmin as checkAdmin,
  isVillager as checkVillager,
  getRole,
  getUsername
} from '../api';

/**
 * Authentication hook for managing user authentication state
 * 
 * @returns {object} Auth state and functions
 * @returns {object|null} return.user - Current user object
 * @returns {boolean} return.isAuthenticated - Whether user is authenticated
 * @returns {boolean} return.isAdmin - Whether user is an admin
 * @returns {boolean} return.isVillager - Whether user is a villager
 * @returns {boolean} return.loading - Whether auth operation is in progress
 * @returns {string|null} return.error - Error message if any
 * @returns {Function} return.login - Login function
 * @returns {Function} return.logout - Logout function
 * @returns {Function} return.refreshUser - Refresh user data function
 * 
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 * 
 * const handleLogin = async () => {
 *   await login('username', 'password');
 * };
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status and load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (checkAuth()) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (err) {
          console.error('Failed to load user:', err);
          setError(err.message);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []); // Run only once on mount

  /**
   * Login user with username and password
   */
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginAPI(username, password);
      const userData = await getCurrentUser();
      setUser(userData);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout current user
   */
  const logout = useCallback(() => {
    logoutAPI();
    setUser(null);
    setError(null);
  }, []);

  /**
   * Refresh user data from server
   */
  const refreshUser = useCallback(async () => {
    if (!checkAuth()) {
      setUser(null);
      return;
    }

    setLoading(true);
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    isAuthenticated: checkAuth(),
    isAdmin: checkAdmin(),
    isVillager: checkVillager(),
    role: getRole(),
    username: getUsername(),
    loading,
    error,
    login,
    logout,
    refreshUser,
  };
};
