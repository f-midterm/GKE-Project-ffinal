/**
 * Validation Utilities
 * 
 * Functions for validating user input, forms, and data.
 * 
 * @module utils/validators
 */

/**
 * Validates an email address
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 * 
 * @example
 * isValidEmail('test@example.com'); // true
 * isValidEmail('invalid-email'); // false
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a phone number (US format)
 * 
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 * 
 * @example
 * isValidPhone('1234567890'); // true
 * isValidPhone('123-456-7890'); // true
 * isValidPhone('123'); // false
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
};

/**
 * Validates password strength
 * 
 * @param {string} password - Password to validate
 * @param {object} [options] - Validation options
 * @param {number} [options.minLength=8] - Minimum password length
 * @param {boolean} [options.requireUppercase=true] - Require uppercase letter
 * @param {boolean} [options.requireLowercase=true] - Require lowercase letter
 * @param {boolean} [options.requireNumber=true] - Require number
 * @param {boolean} [options.requireSpecial=false] - Require special character
 * @returns {{isValid: boolean, errors: string[]}} Validation result with error messages
 * 
 * @example
 * validatePassword('Pass123'); 
 * // { isValid: true, errors: [] }
 * 
 * validatePassword('weak'); 
 * // { isValid: false, errors: ['Password must be at least 8 characters', ...] }
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false,
  } = options;

  const errors = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates that a value is not empty
 * 
 * @param {any} value - Value to check
 * @returns {boolean} True if value is not empty
 * 
 * @example
 * isRequired('test'); // true
 * isRequired(''); // false
 * isRequired(null); // false
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validates that a number is within a range
 * 
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {boolean} True if within range
 * 
 * @example
 * isInRange(5, 1, 10); // true
 * isInRange(15, 1, 10); // false
 */
export const isInRange = (value, min, max) => {
  const num = Number(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
};

/**
 * Validates that a string matches a minimum length
 * 
 * @param {string} value - String to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean} True if meets minimum length
 * 
 * @example
 * hasMinLength('hello', 3); // true
 * hasMinLength('hi', 3); // false
 */
export const hasMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

/**
 * Validates that a string matches a maximum length
 * 
 * @param {string} value - String to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if within maximum length
 * 
 * @example
 * hasMaxLength('hello', 10); // true
 * hasMaxLength('hello world', 5); // false
 */
export const hasMaxLength = (value, maxLength) => {
  return !value || value.length <= maxLength;
};

/**
 * Validates a date string or Date object
 * 
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if valid date
 * 
 * @example
 * isValidDate('2024-01-15'); // true
 * isValidDate('invalid'); // false
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

/**
 * Validates that a date is in the future
 * 
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if date is in the future
 * 
 * @example
 * isFutureDate('2025-01-01'); // true (if current date is before 2025)
 * isFutureDate('2020-01-01'); // false
 */
export const isFutureDate = (date) => {
  if (!isValidDate(date)) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
};

/**
 * Validates that a date is in the past
 * 
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if date is in the past
 * 
 * @example
 * isPastDate('2020-01-01'); // true
 * isPastDate('2025-01-01'); // false (if current date is before 2025)
 */
export const isPastDate = (date) => {
  if (!isValidDate(date)) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
};

/**
 * Validates a URL
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 * 
 * @example
 * isValidURL('https://example.com'); // true
 * isValidURL('not a url'); // false
 */
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates a number (allows decimals)
 * 
 * @param {any} value - Value to validate
 * @returns {boolean} True if valid number
 * 
 * @example
 * isNumber('123'); // true
 * isNumber('123.45'); // true
 * isNumber('abc'); // false
 */
export const isNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Validates a positive number
 * 
 * @param {any} value - Value to validate
 * @returns {boolean} True if positive number
 * 
 * @example
 * isPositiveNumber('123'); // true
 * isPositiveNumber('-5'); // false
 */
export const isPositiveNumber = (value) => {
  return isNumber(value) && parseFloat(value) > 0;
};
