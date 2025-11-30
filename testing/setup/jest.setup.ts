/**
 * Jest Global Setup
 * Runs before all tests
 */

// Extend Jest matchers
import "jest-extended";

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.PORT = "3001";
process.env.CORS_ORIGIN = "*";
process.env.GAME_DIFFICULTY_MULTIPLIER = "1.0";
process.env.GRAVITY_STRENGTH_MULTIPLIER = "1.0";
process.env.MAX_VELOCITY_MULTIPLIER = "1.0";
process.env.AGGREGATION_CRON_SCHEDULE = "0 3 * * *";

// Suppress console output during tests (optional - remove if you want to see logs)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
