import apiClient from '../client/apiClient';

const USERS_BASE_URL = '/users';

/**
 * Get all users
 */
export const getAllUsers = async () => {
  const response = await apiClient.get(`${USERS_BASE_URL}`);
  return response.data;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  const response = await apiClient.get(`${USERS_BASE_URL}/${userId}`);
  return response.data;
};

/**
 * Update user
 */
export const updateUser = async (userId, data) => {
  const response = await apiClient.put(`${USERS_BASE_URL}/${userId}`, data);
  return response.data;
};

/**
 * Delete user
 */
export const deleteUser = async (userId) => {
  const response = await apiClient.delete(`${USERS_BASE_URL}/${userId}`);
  return response.data;
};
