/**
 * Test Fixtures
 * Common test data used across multiple test suites
 */

export const TEST_COUNTRY_CODES = {
  THAILAND: "TH",
  USA: "US",
  JAPAN: "JP",
  GERMANY: "DE",
  UNKNOWN: "XX",
} as const;

export const TEST_DEVICE_IDS = {
  DEVICE_1: "device-uuid-001",
  DEVICE_2: "device-uuid-002",
  DEVICE_3: "device-uuid-003",
} as const;

export const TEST_USER = {
  id: "user-uuid-001",
  deviceId: TEST_DEVICE_IDS.DEVICE_1,
  countryCode: TEST_COUNTRY_CODES.THAILAND,
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-01T00:00:00Z"),
};

export const TEST_HEIGHTS = {
  ZERO: 0,
  ONE_CM: 10, // 10mm
  TEN_CM: 100, // 100mm
  ONE_METER: 1000, // 1000mm
  ONE_KM: 1000000, // 1000000mm
} as const;

export const TEST_PIXELS = {
  ZERO: 0,
  SMALL: 100, // ~26mm
  MEDIUM: 1000, // ~265mm
  LARGE: 3780, // ~1000mm (1 meter)
  MAX_BATCH: 10000, // Max allowed per batch
} as const;

export const TEST_VELOCITIES = {
  ZERO: 0,
  SLOW: 100, // mm/s
  NORMAL: 500, // mm/s
  FAST: 1000, // mm/s
  VERY_FAST: 1800, // mm/s (below limit)
  TOO_FAST: 2500, // mm/s (above 2000 limit)
} as const;

export const TEST_TIME_RANGES = [
  "1h",
  "24h",
  "7d",
  "30d",
  "1y",
  "5y",
  "all",
] as const;

export const TEST_TIMESTAMPS = {
  NOW: Date.now(),
  ONE_HOUR_AGO: Date.now() - 60 * 60 * 1000,
  ONE_DAY_AGO: Date.now() - 24 * 60 * 60 * 1000,
  ONE_WEEK_AGO: Date.now() - 7 * 24 * 60 * 60 * 1000,
} as const;

export const TEST_HISTORY_RECORDS = [
  {
    id: "history-001",
    height: BigInt(1000),
    velocity: 100,
    recordedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    id: "history-002",
    height: BigInt(2000),
    velocity: 150,
    recordedAt: new Date("2025-01-01T01:00:00Z"),
  },
  {
    id: "history-003",
    height: BigInt(3000),
    velocity: 200,
    recordedAt: new Date("2025-01-01T02:00:00Z"),
  },
];

export const TEST_COUNTRY_HISTORY_RECORDS = [
  {
    id: "country-history-001",
    countryCode: TEST_COUNTRY_CODES.THAILAND,
    height: BigInt(500),
    velocity: 50,
    recordedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    id: "country-history-002",
    countryCode: TEST_COUNTRY_CODES.USA,
    height: BigInt(800),
    velocity: 80,
    recordedAt: new Date("2025-01-01T00:00:00Z"),
  },
];
