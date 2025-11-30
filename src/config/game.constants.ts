/**
 * Game Configuration Constants
 *
 * This file defines core game mechanics including:
 * - Unit conversions (pixels to millimeters using CSS Reference Pixel)
 * - Anti-cheat limits
 * - Gravity mechanics
 *
 * PHYSICS STANDARD: CSS Reference Pixel (W3C)
 * - 1 pixel = 1/96 inch = 0.264583333 mm
 * - This ensures equal gameplay across all devices (96 PPI standard)
 * - Physical reality: scrolling 1 cm on screen ≈ gaining 1 cm in game
 *
 * STORAGE UNIT: Millimeters (integers)
 * - All heights stored as INTEGER millimeters (Redis & PostgreSQL requirement)
 * - 1 meter = 1000 mm, 1 cm = 10 mm
 */

import { env } from "./env";

// ============================================
// Unit Conversion (CSS Reference Pixel Standard)
// ============================================

/**
 * CSS Reference Pixel standard (W3C)
 * 1 inch = 2.54 cm = 25.4 mm
 * 1 inch = 96 pixels (CSS standard)
 * Therefore: 1 pixel = 25.4 / 96 = 0.264583333 mm
 */
export const CSS_PIXELS_PER_INCH = 96;
export const MM_PER_INCH = 25.4;
export const MM_PER_PIXEL = MM_PER_INCH / CSS_PIXELS_PER_INCH; // 0.264583333

/**
 * Convert pixels to millimeters using CSS Reference Pixel
 * @param pixels - Scroll delta in pixels from client
 * @returns Height in millimeters (integer, for Redis compatibility)
 *
 * Example:
 * - 100 px = 26 mm = 2.6 cm
 * - 1000 px = 265 mm = 26.5 cm
 * - 3780 px ≈ 1000 mm = 100 cm = 1 meter
 */
export function pixelsToMillimeters(pixels: number): number {
  return Math.round(pixels * MM_PER_PIXEL); // Round to integer for Redis
}

/**
 * Convert millimeters to meters for display
 * @param millimeters - Height in millimeters from storage
 * @returns Height in meters
 */
export function millimetersToMeters(millimeters: number): number {
  return millimeters / 1000;
}

/**
 * Convert millimeters to centimeters for display
 * @param millimeters - Height in millimeters from storage
 * @returns Height in centimeters
 */
export function millimetersToCentimeters(millimeters: number): number {
  return millimeters / 10;
}

/**
 * Convert millimeters to kilometers for display
 * @param millimeters - Height in millimeters from storage
 * @returns Height in kilometers
 */
export function millimetersToKilometers(millimeters: number): number {
  return millimeters / 1000000;
}

// ============================================
// Anti-Cheat Configuration
// ============================================

/**
 * Maximum pixels allowed per batch
 * Client-side validation limit (reasonable for mobile scrolling)
 */
export const MAX_PIXELS_PER_BATCH = 10000;

/**
 * Maximum millimeters allowed per batch (converted from max pixels)
 * 10000 px × 0.264583 = 2646 mm = 264.6 cm = 2.646 meters per batch
 */
export const MAX_MM_PER_BATCH = pixelsToMillimeters(MAX_PIXELS_PER_BATCH);

/**
 * Base maximum allowed velocity in millimeters per second
 * This prevents cheating through automated scrolling
 *
 * Realistic human scrolling on mobile:
 * - Fast flick scroll: ~2000-3000 px in 0.5s = ~1000-1500 mm/s (realistic)
 * - Anti-cheat limit set to 2000 mm/s (2 m/s) to allow aggressive scrolling
 *
 * Note: With CSS Reference Pixel, velocities are much lower than before
 * Can be adjusted via MAX_VELOCITY_MULTIPLIER environment variable
 */
const BASE_MAX_VELOCITY_MM_PER_SECOND = 2000; // 2000 mm/s = 2 m/s = 7.2 km/h
export const MAX_VELOCITY_MM_PER_SECOND =
  BASE_MAX_VELOCITY_MM_PER_SECOND * env.MAX_VELOCITY_MULTIPLIER;

/**
 * Minimum time between scroll batches in milliseconds
 * Prevents spam by ignoring events that come too quickly
 */
export const MIN_BATCH_INTERVAL_MS = 1000;

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
 * Base gravity decay rate in millimeters per tick
 * Applied every GRAVITY_CHECK_INTERVAL_MS when idle
 *
 * With CSS Reference Pixel:
 * - 26 mm/second = 2.6 cm/second ≈ 2.6% of 1 meter/second decay
 * - Proportional to the new pixel conversion rate
 * - Still creates urgency but matches the realistic scale
 * - INTEGER value required for Redis DECRBY command
 *
 * Can be adjusted via GRAVITY_STRENGTH_MULTIPLIER environment variable
 */
const BASE_GRAVITY_DECAY_MM_PER_TICK = 26; // 26 mm/s = 2.6 cm/s = 0.026 m/s decay rate
export const GRAVITY_DECAY_MM_PER_TICK = Math.round(
  BASE_GRAVITY_DECAY_MM_PER_TICK * env.GRAVITY_STRENGTH_MULTIPLIER,
);

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
 * @param millimeters - Height in millimeters
 * @returns Formatted string with appropriate unit
 */
export function formatHeight(millimeters: number): string {
  const meters = millimetersToMeters(millimeters);

  if (meters >= 1000) {
    const km = millimetersToKilometers(millimeters);
    return `${km.toFixed(2)} km`;
  }

  return `${meters.toFixed(2)} m`;
}

/**
 * Format velocity for display
 * @param mmPerSecond - Velocity in millimeters per second
 * @returns Formatted string with appropriate unit
 */
export function formatVelocity(mmPerSecond: number): string {
  const metersPerSecond = mmPerSecond / 1000;

  if (metersPerSecond >= 10) {
    const kmPerHour = (metersPerSecond * 3600) / 1000;
    return `${kmPerHour.toFixed(1)} km/h`;
  }

  return `${metersPerSecond.toFixed(2)} m/s`;
}
