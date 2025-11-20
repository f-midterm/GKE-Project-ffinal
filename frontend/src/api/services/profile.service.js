/**
 * Profile Service
 * 
 * Handles profile-related API calls including creating tenant profiles.
 * 
 * @module api/services/profile.service
 */

import apiClient from '../client/apiClient';

/**
 * Creates a new tenant profile for the authenticated user
 * 
 * @async
 * @function createProfile
 * @param {object} profileData - Profile creation data
 * @param {string} profileData.firstName - First name
 * @param {string} profileData.lastName - Last name
 * @param {string} profileData.phone - Phone number (will be auto-formatted to XXX-XXX-XXXX)
 * @param {string} profileData.emergencyContact - Emergency contact name
 * @param {string} profileData.emergencyPhone - Emergency phone number (will be auto-formatted)
 * @param {string} [profileData.occupation] - Occupation (optional)
 * @returns {Promise<{id: number, firstName: string, lastName: string, email: string, phone: string}>} Created profile
 * @throws {Error} When profile creation fails
 * 
 * @example
 * const profile = await createProfile({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   phone: '1234567890',
 *   emergencyContact: 'Jane Doe',
 *   emergencyPhone: '0987654321',
 *   occupation: 'Engineer'
 * });
 */
export const createProfile = async (profileData) => {
  return await apiClient.post('/auth/create-profile', profileData);
};

/**
 * Formats phone number to XXX-XXX-XXXX format
 * 
 * @function formatPhoneNumber
 * @param {string} phone - Phone number (10 digits)
 * @returns {string} Formatted phone number
 * 
 * @example
 * formatPhoneNumber('1234567890'); // Returns: '123-456-7890'
 * formatPhoneNumber('123-456-7890'); // Returns: '123-456-7890'
 */
export const formatPhoneNumber = (phone) => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if we have 10 digits
  if (cleaned.length !== 10) {
    return phone; // Return original if not 10 digits
  }
  
  // Format as XXX-XXX-XXXX
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

/**
 * Validates phone number (must be 10 digits)
 * 
 * @function validatePhoneNumber
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid, false otherwise
 * 
 * @example
 * validatePhoneNumber('1234567890'); // Returns: true
 * validatePhoneNumber('123-456-7890'); // Returns: true
 * validatePhoneNumber('12345'); // Returns: false
 */
export const validatePhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
};
