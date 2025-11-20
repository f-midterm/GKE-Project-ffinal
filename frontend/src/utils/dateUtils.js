/**
 * Date and Time Utilities
 * Format dates and times with Thailand timezone (Asia/Bangkok)
 */

/**
 * Format datetime to Thai format with Bangkok timezone
 * @param {string|Date} dateString - Date string or Date object
 * @param {object} options - Additional Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDateTime = (dateString, options = {}) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '-';
  
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
    ...options
  };
  
  return date.toLocaleString('th-TH', defaultOptions);
};

/**
 * Format date only (without time) with Bangkok timezone
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Bangkok'
  });
};

/**
 * Format time only with Bangkok timezone
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted time string
 */
export const formatTime = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  });
};

/**
 * Format date with Thai Buddhist calendar
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string with Buddhist year
 */
export const formatDateThai = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleDateString('th-TH-u-ca-buddhist', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Bangkok'
  });
};

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  const now = new Date();
  
  if (isNaN(date.getTime())) return '-';
  
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'เมื่อสักครู่';
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  
  return formatDate(dateString);
};

/**
 * Convert date to ISO string with Bangkok timezone
 * @param {Date} date - Date object
 * @returns {string} ISO string
 */
export const toISOStringBangkok = (date) => {
  if (!date) return null;
  
  // Add 7 hours for Bangkok timezone (UTC+7)
  const bangkokDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
  return bangkokDate.toISOString();
};
