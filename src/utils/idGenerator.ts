/**
 * Simple ID generator utility
 * Used throughout the app for creating unique identifiers
 */

/**
 * Generates a simple ID consisting of a timestamp and random string
 * @returns A unique string ID
 */
export default function generateSimpleId(): string {
  return 'id_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 11);
}
