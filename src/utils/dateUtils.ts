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
export function getLocalDateComponents(date: Date = new Date()): { year: string, month: string, day: string } {
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
export function formatToLocalISODate(date: Date = new Date()): string {
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
export function formatToISODate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get the formatted date for today in the user's local timezone
 * @returns Today's date in YYYY-MM-DD format adjusted for the user's timezone
 */
export function getTodayFormatted(): string {
  return formatToLocalISODate(new Date());
}

/**
 * This function converts a MySQL-compatible datetime string to a JavaScript Date object
 * @param mysqlDatetime MySQL datetime string (YYYY-MM-DD HH:MM:SS)
 * @returns JavaScript Date object
 */
export function mysqlDateTimeToDate(mysqlDatetime: string): Date {
  if (!mysqlDatetime) return new Date();
  return new Date(mysqlDatetime.replace(' ', 'T') + 'Z');
}

/**
 * Converts a JavaScript Date object to a MySQL-compatible datetime string
 * @param date JavaScript Date object
 * @returns MySQL datetime string (YYYY-MM-DD HH:MM:SS)
 */
export function dateToMySQLDateTime(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Format a date to a more readable format in the user's locale
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Human readable date format
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get dates for the past week
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getPastWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push(formatToISODate(date));
  }
  
  return dates;
}

/**
 * Get a short format day name from a date string
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Short day name (e.g., "Mon")
 */
export function getShortDayName(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

/**
 * Format time from ISO string to human-readable format
 * @param isoString ISO date string
 * @returns Time in hh:mm AM/PM format
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
