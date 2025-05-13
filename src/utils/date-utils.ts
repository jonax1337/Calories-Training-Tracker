/**
 * Utility functions for date handling and formatting
 */

/**
 * Format a date to YYYY-MM-DD (ISO date string format without time)
 * @param date Date to format (defaults to today)
 * @returns Formatted date string
 */
export function formatToISODate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get the formatted date for today
 * @returns Today's date in YYYY-MM-DD format
 */
export function getTodayFormatted(): string {
  return formatToISODate(new Date());
}

/**
 * Format a date to a more readable format
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Human readable date format
 */
export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
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
