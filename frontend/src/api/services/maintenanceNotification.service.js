/**
 * Maintenance Notification Service
 * 
 * Handles all maintenance notification-related API calls including fetching
 * and managing notifications.
 * 
 * @module api/services/maintenanceNotification.service
 */

import apiClient from '../client/apiClient';

/**
 * Retrieves all notifications for current user
 * 
 * @async
 * @function getAllNotifications
 * @returns {Promise<Array>} Array of notifications
 * @throws {Error} When fetching notifications fails
 */
export const getAllNotifications = async () => {
  return await apiClient.get('/maintenance/notifications');
};

/**
 * Retrieves unread notifications for current user
 * 
 * @async
 * @function getUnreadNotifications
 * @returns {Promise<Array>} Array of unread notifications
 * @throws {Error} When fetching unread notifications fails
 */
export const getUnreadNotifications = async () => {
  return await apiClient.get('/maintenance/notifications/unread');
};

/**
 * Gets count of unread notifications
 * 
 * @async
 * @function getUnreadCount
 * @returns {Promise<number>} Unread notification count
 * @throws {Error} When fetching count fails
 */
export const getUnreadCount = async () => {
  const response = await apiClient.get('/maintenance/notifications/unread/count');
  return response.count || 0;
};

/**
 * Marks a notification as read
 * 
 * @async
 * @function markAsRead
 * @param {number} id - Notification ID
 * @returns {Promise<void>}
 * @throws {Error} When marking as read fails
 */
export const markAsRead = async (id) => {
  return await apiClient.put(`/maintenance/notifications/${id}/read`);
};

/**
 * Marks all notifications as read
 * 
 * @async
 * @function markAllAsRead
 * @returns {Promise<void>}
 * @throws {Error} When marking all as read fails
 */
export const markAllAsRead = async () => {
  return await apiClient.put('/maintenance/notifications/read-all');
};

/**
 * Deletes a notification
 * 
 * @async
 * @function deleteNotification
 * @param {number} id - Notification ID
 * @returns {Promise<void>}
 * @throws {Error} When deleting notification fails
 */
export const deleteNotification = async (id) => {
  return await apiClient.delete(`/maintenance/notifications/${id}`);
};
