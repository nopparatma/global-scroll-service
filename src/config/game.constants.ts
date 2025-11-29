/**
 * Game Configuration Constants
 *
 * This file defines core game mechanics including:
 * - Unit conversions (pixels to centimeters)
 * - Anti-cheat limits
 * - Gravity mechanics
 */

// ============================================
// Unit Conversion
// ============================================

/**
 * Conversion rate from pixels (client scroll) to centimeters (storage)
 *
 * Example:
 * - User scrolls 100 pixels → stored as 100 centimeters (1 meter)
 * - User scrolls 500 pixels → stored as 500 centimeters (5 meters)
 *
 * Adjustment notes:
 * - Lower value (e.g., 50): Makes game easier, height increases faster
 * - Higher value (e.g., 200): Makes game harder, requires more scrolling
 */
export const PIXELS_PER_METER = 100; // 100 pixels = 1 meter = 100 centimeters

/**
 * Convert pixels to centimeters
 * @param pixels - Scroll delta in pixels from client
 * @returns Height in centimeters (integer)
 */
export function pixelsToCentimeters(pixels: number): number {
  return Math.floor((pixels / PIXELS_PER_METER) * 100);
}

/**
 * Convert centimeters to meters for display
 * @param centimeters - Height in centimeters from storage
 * @returns Height in meters
 */
export function centimetersToMeters(centimeters: number): number {
  return centimeters / 100;
}

/**
 * Convert centimeters to kilometers for display
 * @param centimeters - Height in centimeters from storage
 * @returns Height in kilometers
 */
export function centimetersToKilometers(centimeters: number): number {
  return centimeters / 100000;
}

// ============================================
// Anti-Cheat Configuration
// ============================================

/**
 * Maximum allowed velocity in centimeters per second
 * This prevents cheating through automated scrolling
 *
 * 5000 cm/s = 50 meters/second = 180 km/h
 * This is extremely fast but allows for rapid manual scrolling
 */
export const MAX_VELOCITY_CM_PER_SECOND = 5000;

/**
 * Minimum time between scroll batches in milliseconds
 * Prevents spam by ignoring events that come too quickly
 */
export const MIN_BATCH_INTERVAL_MS = 1000;

/**
 * Maximum pixels allowed per batch
 * Client-side validation limit
 */
export const MAX_PIXELS_PER_BATCH = 10000;

/**
 * Maximum centimeters allowed per batch (converted from max pixels)
 */
export const MAX_CM_PER_BATCH = pixelsToCentimeters(MAX_PIXELS_PER_BATCH);

// ============================================
// Gravity Configuration
// ============================================

/**
 * How often gravity worker checks for idle countries (milliseconds)
 */
export const GRAVITY_CHECK_INTERVAL_MS = 1000;

/**
 * Idle time threshold before gravity applies (milliseconds)
 * If a country hasn't scrolled for this duration, height decreases
 */
export const COUNTRY_IDLE_THRESHOLD_MS = 5000; // 5 seconds

/**
 * Gravity decay rate in centimeters per tick
 * Applied every GRAVITY_CHECK_INTERVAL_MS when idle
 *
 * 100 cm/second = 1 meter/second decay
 * This creates urgency and encourages continuous scrolling
 */
export const GRAVITY_DECAY_CM_PER_TICK = 100;

// ============================================
// Worker Configuration
// ============================================

/**
 * How often to sync Redis state to PostgreSQL (milliseconds)
 */
export const PERSISTENCE_SYNC_INTERVAL_MS = 30000; // 30 seconds

/**
 * How often to calculate global height from country heights (milliseconds)
 */
export const GLOBAL_HEIGHT_SYNC_INTERVAL_MS = 1000; // 1 second

/**
 * Time window for velocity calculation (seconds)
 * Must match GLOBAL_HEIGHT_SYNC_INTERVAL_MS
 */
export const VELOCITY_WINDOW_SECONDS = GLOBAL_HEIGHT_SYNC_INTERVAL_MS / 1000;

// ============================================
// Display Configuration
// ============================================

/**
 * Format height for display
 * @param centimeters - Height in centimeters
 * @returns Formatted string with appropriate unit
 */
export function formatHeight(centimeters: number): string {
  const meters = centimetersToMeters(centimeters);

  if (meters >= 1000) {
    const km = centimetersToKilometers(centimeters);
    return `${km.toFixed(2)} km`;
  }

  return `${meters.toFixed(2)} m`;
}

/**
 * Format velocity for display
 * @param cmPerSecond - Velocity in centimeters per second
 * @returns Formatted string with appropriate unit
 */
export function formatVelocity(cmPerSecond: number): string {
  const metersPerSecond = cmPerSecond / 100;

  if (metersPerSecond >= 10) {
    const kmPerHour = (metersPerSecond * 3600) / 1000;
    return `${kmPerHour.toFixed(1)} km/h`;
  }

  return `${metersPerSecond.toFixed(2)} m/s`;
}
