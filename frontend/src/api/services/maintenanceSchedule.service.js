/**
 * Maintenance Schedule Service
 * 
 * Handles all maintenance schedule-related API calls including fetching,
 * creating, updating, and managing schedules.
 * 
 * @module api/services/maintenanceSchedule.service
 */

import apiClient from '../client/apiClient';

/**
 * Retrieves all active maintenance schedules
 * 
 * @async
 * @function getAllSchedules
 * @returns {Promise<Array>} Array of active maintenance schedules
 * @throws {Error} When fetching schedules fails
 */
export const getAllSchedules = async () => {
  return await apiClient.get('/maintenance/schedules');
};

/**
 * Retrieves a specific schedule by ID
 * 
 * @async
 * @function getScheduleById
 * @param {number} id - Schedule ID
 * @returns {Promise<Object>} Schedule details
 * @throws {Error} When schedule not found or fetch fails
 */
export const getScheduleById = async (id) => {
  return await apiClient.get(`/maintenance/schedules/${id}`);
};

/**
 * Creates a new maintenance schedule
 * 
 * @async
 * @function createSchedule
 * @param {Object} scheduleData - Schedule data
 * @param {string} scheduleData.title - Schedule title
 * @param {string} scheduleData.description - Schedule description
 * @param {string} scheduleData.category - Category (PLUMBING, ELECTRICAL, etc.)
 * @param {string} scheduleData.recurrenceType - Recurrence type (ONE_TIME, DAILY, WEEKLY, etc.)
 * @param {number} scheduleData.recurrenceInterval - Interval for recurrence
 * @param {string} scheduleData.targetType - Target type (ALL_UNITS, SPECIFIC_UNITS, etc.)
 * @param {Array<number>} scheduleData.targetUnits - Array of target unit IDs
 * @param {string} scheduleData.startDate - Start date (YYYY-MM-DD)
 * @param {string} scheduleData.endDate - End date (YYYY-MM-DD)
 * @param {number} scheduleData.notifyDaysBefore - Days before to notify
 * @param {Array<number>} scheduleData.notifyUsers - Array of user IDs to notify
 * @param {number} scheduleData.estimatedCost - Estimated cost
 * @param {number} scheduleData.assignedToUserId - Assigned user ID
 * @param {string} scheduleData.priority - Priority (LOW, MEDIUM, HIGH, URGENT)
 * @returns {Promise<Object>} Created schedule with ID
 * @throws {Error} When schedule creation fails
 */
export const createSchedule = async (scheduleData) => {
  return await apiClient.post('/maintenance/schedules', scheduleData);
};

/**
 * Updates an existing schedule
 * 
 * @async
 * @function updateSchedule
 * @param {number} id - Schedule ID
 * @param {Object} scheduleData - Updated schedule data
 * @returns {Promise<Object>} Updated schedule
 * @throws {Error} When schedule update fails
 */
export const updateSchedule = async (id, scheduleData) => {
  return await apiClient.put(`/maintenance/schedules/${id}`, scheduleData);
};

/**
 * Deletes a schedule
 * 
 * @async
 * @function deleteSchedule
 * @param {number} id - Schedule ID
 * @returns {Promise<void>}
 * @throws {Error} When schedule deletion fails
 */
export const deleteSchedule = async (id) => {
  return await apiClient.delete(`/maintenance/schedules/${id}`);
};

/**
 * Activates a schedule
 * 
 * @async
 * @function activateSchedule
 * @param {number} id - Schedule ID
 * @returns {Promise<void>}
 * @throws {Error} When activation fails
 */
export const activateSchedule = async (id) => {
  return await apiClient.post(`/maintenance/schedules/${id}/activate`);
};

/**
 * Deactivates a schedule
 * 
 * @async
 * @function deactivateSchedule
 * @param {number} id - Schedule ID
 * @returns {Promise<void>}
 * @throws {Error} When deactivation fails
 */
export const deactivateSchedule = async (id) => {
  return await apiClient.post(`/maintenance/schedules/${id}/deactivate`);
};

/**
 * Pauses a schedule
 * 
 * @async
 * @function pauseSchedule
 * @param {number} id - Schedule ID
 * @returns {Promise<void>}
 * @throws {Error} When pausing fails
 */
export const pauseSchedule = async (id) => {
  return await apiClient.post(`/maintenance/schedules/${id}/pause`);
};

/**
 * Resumes a paused schedule
 * 
 * @async
 * @function resumeSchedule
 * @param {number} id - Schedule ID
 * @returns {Promise<void>}
 * @throws {Error} When resuming fails
 */
export const resumeSchedule = async (id) => {
  return await apiClient.post(`/maintenance/schedules/${id}/resume`);
};

/**
 * Manually triggers a schedule (creates maintenance requests)
 * 
 * @async
 * @function triggerSchedule
 * @param {number} id - Schedule ID
 * @returns {Promise<void>}
 * @throws {Error} When triggering fails
 */
export const triggerSchedule = async (id) => {
  return await apiClient.post(`/maintenance/schedules/${id}/trigger`);
};

/**
 * Retrieves logs for a specific schedule
 * 
 * @async
 * @function getLogsBySchedule
 * @param {number} scheduleId - Schedule ID
 * @returns {Promise<Array>} Array of maintenance logs
 * @throws {Error} When fetching logs fails
 */
export const getLogsBySchedule = async (scheduleId) => {
  return await apiClient.get(`/maintenance/logs/schedule/${scheduleId}`);
};

/**
 * Retrieves logs for a specific maintenance request
 * 
 * @async
 * @function getLogsByRequest
 * @param {number} requestId - Maintenance request ID
 * @returns {Promise<Array>} Array of maintenance logs
 * @throws {Error} When fetching logs fails
 */
export const getLogsByRequest = async (requestId) => {
  return await apiClient.get(`/maintenance/logs/request/${requestId}`);
};

/**
 * Retrieves all maintenance logs
 * 
 * @async
 * @function getAllLogs
 * @returns {Promise<Array>} Array of all maintenance logs
 * @throws {Error} When fetching logs fails
 */
export const getAllLogs = async () => {
  return await apiClient.get('/maintenance/logs');
};

/**
 * Get affected units with auto-generated time slots for a schedule
 * 
 * @async
 * @function getScheduleAffectedUnits
 * @param {number} scheduleId - Schedule ID
 * @returns {Promise<Array>} Array of affected units with time slots
 * @throws {Error} When fetching fails
 */
export const getScheduleAffectedUnits = async (scheduleId) => {
  return await apiClient.get(`/maintenance/schedules/${scheduleId}/affected-units`);
};

/**
 * Trigger schedule for a specific unit
 * 
 * @async
 * @function triggerScheduleForUnit
 * @param {number} scheduleId - Schedule ID
 * @param {number} unitId - Unit ID
 * @param {string} preferredTime - Preferred time (optional)
 * @returns {Promise<Object>} Created maintenance request
 * @throws {Error} When triggering fails
 */
export const triggerScheduleForUnit = async (scheduleId, unitId, preferredTime = null) => {
  return await apiClient.post(`/maintenance/schedules/${scheduleId}/trigger-unit`, {
    unitId,
    preferredTime
  });
};
