/**
 * Utility functions for date handling and formatting
 * Providing consistent date handling across the entire application
 * to prevent timezone-related issues between client and server
 */

/**
 * Gets the current date in the local timezone and returns components
 * This is the preferred method to get a date that respects the user's timezone
 * @returns Object with year, month, day as properly formatted strings
 */
function getLocalDateComponents(date = new Date()) {
  const year = date.getFullYear().toString();
  // Months are 0-indexed in JavaScript Date, so add 1 and pad with 0 if needed
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return { year, month, day };
}

/**
 * Format a date to YYYY-MM-DD string in the user's local timezone
 * This ensures consistency for database operations by always using
 * the local date components rather than UTC date which can be a day off
 * @param date Date to format (defaults to today)
 * @returns Formatted date string (YYYY-MM-DD)
 */
function formatToLocalISODate(date = new Date()) {
  const { year, month, day } = getLocalDateComponents(date);
  return `${year}-${month}-${day}`;
}

/**
 * Format a date to YYYY-MM-DD (ISO date string format without time)
 * NOTE: This uses UTC time which may not match the user's locale.
 * For most applications, use formatToLocalISODate() instead.
 * @param date Date to format (defaults to today)
 * @returns Formatted date string in UTC
 */
function formatToISODate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Get the formatted date for today in the user's local timezone
 * @returns Today's date in YYYY-MM-DD format adjusted for the user's timezone
 */
function getTodayFormatted() {
  return formatToLocalISODate(new Date());
}

/**
 * This function converts a MySQL-compatible datetime string to a JavaScript Date object
 * @param mysqlDatetime MySQL datetime string (YYYY-MM-DD HH:MM:SS)
 * @returns JavaScript Date object
 */
function mysqlDateTimeToDate(mysqlDatetime) {
  if (!mysqlDatetime) return new Date();
  return new Date(mysqlDatetime.replace(' ', 'T') + 'Z');
}

/**
 * Converts a JavaScript Date object to a MySQL-compatible datetime string
 * @param date JavaScript Date object
 * @returns MySQL datetime string (YYYY-MM-DD HH:MM:SS)
 */
function dateToMySQLDateTime(date = new Date()) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Parse a date string to ensure it is in the correct format
 * Use this when receiving date strings from the client
 * @param dateString Date string to parse (expected in YYYY-MM-DD format)
 * @returns Properly formatted date string (YYYY-MM-DD)
 */
function parseDateString(dateString) {
  // If the date is null, undefined or empty, return today's date
  if (!dateString) {
    return formatToLocalISODate();
  }
  
  // If it's already a valid date string format (YYYY-MM-DD), return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // If it contains a T (ISO format with time), extract just the date part
  if (dateString.includes('T')) {
    return dateString.split('T')[0];
  }
  
  // Try to parse as a Date object and format it
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return formatToLocalISODate(date);
    }
  } catch (e) {
    console.error('Error parsing date string:', e);
  }
  
  // If all else fails, return today's date
  return formatToLocalISODate();
}

module.exports = {
  getLocalDateComponents,
  formatToLocalISODate,
  formatToISODate,
  getTodayFormatted,
  mysqlDateTimeToDate,
  dateToMySQLDateTime,
  parseDateString
};
