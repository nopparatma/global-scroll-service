import type { TimeRange } from "../types/history.types";

/**
 * Valid time ranges for historical data queries
 */
export const VALID_TIME_RANGES: TimeRange[] = [
  "1h",
  "24h",
  "7d",
  "30d",
  "1y",
  "5y",
  "all",
];

/**
 * ISO 3166-1 alpha-2 country code format (2 uppercase letters)
 */
export const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/i;

/**
 * Maximum number of countries allowed in comparison requests
 */
export const MAX_COUNTRIES_COMPARISON = 10;
