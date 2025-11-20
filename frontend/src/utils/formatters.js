/**
 * Formatting Utilities
 * 
 * Functions for formatting dates, currency, numbers, and other display values.
 * 
 * @module utils/formatters
 */

/**
 * Formats a number as currency
 * 
 * @param {number} amount - Amount to format
 * @param {string} [currency='USD'] - Currency code
 * @param {string} [locale='en-US'] - Locale for formatting
 * @returns {string} Formatted currency string
 * 
 * @example
 * formatCurrency(1500); // "$1,500.00"
 * formatCurrency(1500, 'EUR', 'de-DE'); // "1.500,00 €"
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Formats a date string or Date object
 * 
 * @param {string|Date} date - Date to format
 * @param {string} [format='short'] - Format type ('short', 'medium', 'long', 'full')
 * @param {string} [locale='en-US'] - Locale for formatting
 * @returns {string} Formatted date string
 * 
 * @example
 * formatDate('2024-01-15'); // "1/15/2024"
 * formatDate('2024-01-15', 'long'); // "January 15, 2024"
 */
export const formatDate = (date, format = 'short', locale = 'en-US') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const options = {
    short: { month: 'numeric', day: 'numeric', year: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  };
  
  return new Intl.DateTimeFormat(locale, options[format]).format(dateObj);
};

/**
 * Formats a date and time string or Date object
 * 
 * @param {string|Date} date - Date/time to format
 * @param {string} [locale='en-US'] - Locale for formatting
 * @returns {string} Formatted date and time string
 * 
 * @example
 * formatDateTime('2024-01-15T14:30:00'); // "1/15/2024, 2:30 PM"
 */
export const formatDateTime = (date, locale = 'en-US') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(dateObj);
};

/**
 * Formats a phone number
 * 
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 * 
 * @example
 * formatPhoneNumber('1234567890'); // "(123) 456-7890"
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phoneNumber;
};

/**
 * Formats a number with thousand separators
 * 
 * @param {number} number - Number to format
 * @param {number} [decimals=0] - Number of decimal places
 * @param {string} [locale='en-US'] - Locale for formatting
 * @returns {string} Formatted number string
 * 
 * @example
 * formatNumber(1234567); // "1,234,567"
 * formatNumber(1234.5678, 2); // "1,234.57"
 */
export const formatNumber = (number, decimals = 0, locale = 'en-US') => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

/**
 * Formats a percentage
 * 
 * @param {number} value - Value to format as percentage (0-1 or 0-100)
 * @param {boolean} [isDecimal=true] - Whether value is decimal (0-1) or whole number (0-100)
 * @param {number} [decimals=1] - Number of decimal places
 * @returns {string} Formatted percentage string
 * 
 * @example
 * formatPercentage(0.856); // "85.6%"
 * formatPercentage(85.6, false); // "85.6%"
 */
export const formatPercentage = (value, isDecimal = true, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Truncates a string to a maximum length with ellipsis
 * 
 * @param {string} str - String to truncate
 * @param {number} [maxLength=50] - Maximum length
 * @param {string} [suffix='...'] - Suffix to add when truncated
 * @returns {string} Truncated string
 * 
 * @example
 * truncateText('This is a very long text', 10); // "This is a..."
 */
export const truncateText = (str, maxLength = 50, suffix = '...') => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalizes the first letter of a string
 * 
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 * 
 * @example
 * capitalize('hello world'); // "Hello world"
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Converts a string to title case
 * 
 * @param {string} str - String to convert
 * @returns {string} Title cased string
 * 
 * @example
 * titleCase('hello world'); // "Hello World"
 */
export const titleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
