/**
 * Unit Tests for time.helpers.ts
 * Testing time conversion, grouping, and calculation functions
 * Target: 100% coverage
 */

import {
  getTimeAgo,
  groupByTimeInterval,
  truncateToInterval,
  getNextInterval,
  formatDuration,
  average,
  weightedAverage,
} from "../../../src/utils/time.helpers";
import { TimeRange } from "../../../src/types/history.types";

describe("time.helpers", () => {
  describe("getTimeAgo", () => {
    const NOW = 1704067200000; // 2024-01-01 00:00:00 UTC
    let dateNowSpy: jest.SpyInstance;

    beforeEach(() => {
      dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(NOW);
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    describe("Valid time ranges", () => {
      it('should return date 1 hour ago for "1h"', () => {
        const result = getTimeAgo("1h");
        expect(result).toBeInstanceOf(Date);
        expect(result?.getTime()).toBe(NOW - 60 * 60 * 1000);
      });

      it('should return date 24 hours ago for "24h"', () => {
        const result = getTimeAgo("24h");
        expect(result).toBeInstanceOf(Date);
        expect(result?.getTime()).toBe(NOW - 24 * 60 * 60 * 1000);
      });

      it('should return date 7 days ago for "7d"', () => {
        const result = getTimeAgo("7d");
        expect(result).toBeInstanceOf(Date);
        expect(result?.getTime()).toBe(NOW - 7 * 24 * 60 * 60 * 1000);
      });

      it('should return date 30 days ago for "30d"', () => {
        const result = getTimeAgo("30d");
        expect(result).toBeInstanceOf(Date);
        expect(result?.getTime()).toBe(NOW - 30 * 24 * 60 * 60 * 1000);
      });

      it('should return date 1 year ago for "1y"', () => {
        const result = getTimeAgo("1y");
        expect(result).toBeInstanceOf(Date);
        expect(result?.getTime()).toBe(NOW - 365 * 24 * 60 * 60 * 1000);
      });

      it('should return date 5 years ago for "5y"', () => {
        const result = getTimeAgo("5y");
        expect(result).toBeInstanceOf(Date);
        expect(result?.getTime()).toBe(NOW - 5 * 365 * 24 * 60 * 60 * 1000);
      });

      it('should return null for "all"', () => {
        const result = getTimeAgo("all");
        expect(result).toBeNull();
      });
    });

    describe("Invalid time ranges", () => {
      it("should throw error for invalid time range", () => {
        expect(() => getTimeAgo("invalid" as TimeRange)).toThrow(
          "Invalid time range: invalid",
        );
      });

      it("should throw error for empty string", () => {
        expect(() => getTimeAgo("" as TimeRange)).toThrow(
          "Invalid time range: ",
        );
      });

      it("should throw error for undefined", () => {
        expect(() => getTimeAgo(undefined as unknown as TimeRange)).toThrow();
      });
    });
  });

  describe("groupByTimeInterval", () => {
    const createRecord = (date: Date) => ({ recordedAt: date });

    describe("Empty and edge cases", () => {
      it("should return empty array for empty input", () => {
        const result = groupByTimeInterval([], 1000);
        expect(result).toEqual([]);
      });

      it("should return single group for single record", () => {
        const record = createRecord(new Date("2024-01-01T00:00:00Z"));
        const result = groupByTimeInterval([record], 60000);
        expect(result).toEqual([[record]]);
      });
    });

    describe("Grouping logic", () => {
      it("should group records within same interval", () => {
        const records = [
          createRecord(new Date("2024-01-01T00:00:00Z")),
          createRecord(new Date("2024-01-01T00:00:30Z")), // 30s later
          createRecord(new Date("2024-01-01T00:00:45Z")), // 45s later
        ];
        const result = groupByTimeInterval(records, 60000); // 1 minute interval
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveLength(3);
      });

      it("should create separate groups when interval exceeded", () => {
        const records = [
          createRecord(new Date("2024-01-01T00:00:00Z")),
          createRecord(new Date("2024-01-01T00:01:30Z")), // 90s later (new group)
        ];
        const result = groupByTimeInterval(records, 60000); // 1 minute interval
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveLength(1);
        expect(result[1]).toHaveLength(1);
      });

      it("should handle multiple groups correctly", () => {
        const records = [
          createRecord(new Date("2024-01-01T00:00:00Z")),
          createRecord(new Date("2024-01-01T00:00:30Z")),
          createRecord(new Date("2024-01-01T00:01:30Z")),
          createRecord(new Date("2024-01-01T00:02:00Z")),
          createRecord(new Date("2024-01-01T00:03:30Z")),
        ];
        const result = groupByTimeInterval(records, 60000);
        expect(result).toHaveLength(3);
        expect(result[0]).toHaveLength(2); // 0:00, 0:00:30
        expect(result[1]).toHaveLength(2); // 0:01:30, 0:02:00
        expect(result[2]).toHaveLength(1); // 0:03:30
      });
    });

    describe("Different interval sizes", () => {
      it("should work with 1 second interval", () => {
        const records = [
          createRecord(new Date("2024-01-01T00:00:00.000Z")),
          createRecord(new Date("2024-01-01T00:00:00.500Z")),
          createRecord(new Date("2024-01-01T00:00:01.500Z")),
        ];
        const result = groupByTimeInterval(records, 1000);
        expect(result).toHaveLength(2);
      });

      it("should work with 1 hour interval", () => {
        const records = [
          createRecord(new Date("2024-01-01T00:00:00Z")),
          createRecord(new Date("2024-01-01T00:30:00Z")),
          createRecord(new Date("2024-01-01T01:30:00Z")),
        ];
        const result = groupByTimeInterval(records, 3600000);
        expect(result).toHaveLength(2);
      });
    });
  });

  describe("truncateToInterval", () => {
    describe("Truncation logic", () => {
      it("should truncate to nearest second", () => {
        const date = new Date("2024-01-01T00:00:00.750Z");
        const result = truncateToInterval(date, 1000);
        expect(result.getTime()).toBe(
          new Date("2024-01-01T00:00:00.000Z").getTime(),
        );
      });

      it("should truncate to nearest minute", () => {
        const date = new Date("2024-01-01T00:00:45.000Z");
        const result = truncateToInterval(date, 60000);
        expect(result.getTime()).toBe(
          new Date("2024-01-01T00:00:00.000Z").getTime(),
        );
      });

      it("should truncate to nearest hour", () => {
        const date = new Date("2024-01-01T00:45:30.000Z");
        const result = truncateToInterval(date, 3600000);
        expect(result.getTime()).toBe(
          new Date("2024-01-01T00:00:00.000Z").getTime(),
        );
      });
    });

    describe("Edge cases", () => {
      it("should return same date if already at interval boundary", () => {
        const date = new Date("2024-01-01T00:00:00.000Z");
        const result = truncateToInterval(date, 1000);
        expect(result.getTime()).toBe(date.getTime());
      });

      it("should handle epoch time (0)", () => {
        const date = new Date(0);
        const result = truncateToInterval(date, 1000);
        expect(result.getTime()).toBe(0);
      });
    });
  });

  describe("getNextInterval", () => {
    const NOW = 1704067200000; // 2024-01-01 00:00:00 UTC
    let dateNowSpy: jest.SpyInstance;

    beforeEach(() => {
      dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(NOW);
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    describe("Next interval calculation", () => {
      it("should return next second interval", () => {
        const result = getNextInterval(1000);
        // When at boundary, Math.ceil returns same time
        expect(result.getTime()).toBe(NOW);
      });

      it("should return next minute interval", () => {
        const result = getNextInterval(60000);
        // When at boundary, Math.ceil returns same time
        expect(result.getTime()).toBe(NOW);
      });

      it("should return next hour interval", () => {
        const result = getNextInterval(3600000);
        // When at boundary, Math.ceil returns same time
        expect(result.getTime()).toBe(NOW);
      });
    });

    describe("Edge cases", () => {
      it("should handle when current time is at interval boundary", () => {
        const result = getNextInterval(1000);
        expect(result.getTime()).toBeGreaterThanOrEqual(NOW);
      });

      it("should handle when current time is not at boundary", () => {
        dateNowSpy.mockReturnValue(NOW + 500);
        const result = getNextInterval(1000);
        expect(result.getTime()).toBe(NOW + 1000);
      });
    });
  });

  describe("formatDuration", () => {
    describe("Milliseconds", () => {
      it("should format durations less than 1 second as milliseconds", () => {
        expect(formatDuration(0)).toBe("0ms");
        expect(formatDuration(1)).toBe("1ms");
        expect(formatDuration(500)).toBe("500ms");
        expect(formatDuration(999)).toBe("999ms");
      });
    });

    describe("Seconds", () => {
      it("should format durations in seconds", () => {
        expect(formatDuration(1000)).toBe("1.0s");
        expect(formatDuration(5000)).toBe("5.0s");
        expect(formatDuration(5500)).toBe("5.5s");
        expect(formatDuration(59999)).toBe("60.0s");
      });
    });

    describe("Minutes", () => {
      it("should format durations in minutes", () => {
        expect(formatDuration(60000)).toBe("1.0m");
        expect(formatDuration(90000)).toBe("1.5m");
        expect(formatDuration(600000)).toBe("10.0m");
        expect(formatDuration(3599999)).toBe("60.0m");
      });
    });

    describe("Hours", () => {
      it("should format durations in hours", () => {
        expect(formatDuration(3600000)).toBe("1.0h");
        expect(formatDuration(5400000)).toBe("1.5h");
        expect(formatDuration(7200000)).toBe("2.0h");
        expect(formatDuration(86400000)).toBe("24.0h");
      });
    });

    describe("Precision", () => {
      it("should maintain one decimal place precision", () => {
        expect(formatDuration(1234)).toBe("1.2s");
        expect(formatDuration(61234)).toBe("1.0m");
        expect(formatDuration(3661234)).toBe("1.0h");
      });
    });
  });

  describe("average", () => {
    describe("Valid inputs", () => {
      it("should calculate average of positive numbers", () => {
        expect(average([1, 2, 3, 4, 5])).toBe(3);
        expect(average([10, 20, 30])).toBe(20);
      });

      it("should handle single number", () => {
        expect(average([42])).toBe(42);
      });

      it("should handle negative numbers", () => {
        expect(average([-5, -10, -15])).toBe(-10);
      });

      it("should handle mixed positive and negative numbers", () => {
        expect(average([-10, 0, 10])).toBe(0);
      });

      it("should handle decimal numbers", () => {
        expect(average([1.5, 2.5, 3.5])).toBeCloseTo(2.5);
      });

      it("should handle zero values", () => {
        expect(average([0, 0, 0])).toBe(0);
      });
    });

    describe("Edge cases", () => {
      it("should return 0 for empty array", () => {
        expect(average([])).toBe(0);
      });

      it("should handle large numbers", () => {
        expect(average([1000000, 2000000, 3000000])).toBe(2000000);
      });

      it("should handle very small numbers", () => {
        expect(average([0.001, 0.002, 0.003])).toBeCloseTo(0.002);
      });
    });
  });

  describe("weightedAverage", () => {
    describe("Valid inputs", () => {
      it("should calculate weighted average correctly", () => {
        const records = [
          { height: BigInt(100), sampleCount: 10 },
          { height: BigInt(200), sampleCount: 20 },
        ];
        // (100*10 + 200*20) / (10+20) = 5000/30 = 166.67
        expect(weightedAverage(records)).toBeCloseTo(166.67, 1);
      });

      it("should handle single record", () => {
        const records = [{ height: BigInt(500), sampleCount: 10 }];
        expect(weightedAverage(records)).toBe(500);
      });

      it("should handle equal weights", () => {
        const records = [
          { height: BigInt(100), sampleCount: 5 },
          { height: BigInt(200), sampleCount: 5 },
        ];
        expect(weightedAverage(records)).toBe(150);
      });

      it("should handle different weights correctly", () => {
        const records = [
          { height: BigInt(100), sampleCount: 1 },
          { height: BigInt(200), sampleCount: 9 },
        ];
        // (100*1 + 200*9) / 10 = 1900/10 = 190
        expect(weightedAverage(records)).toBe(190);
      });
    });

    describe("Edge cases", () => {
      it("should return 0 for empty array", () => {
        expect(weightedAverage([])).toBe(0);
      });

      it("should return 0 when all sample counts are 0", () => {
        const records = [
          { height: BigInt(100), sampleCount: 0 },
          { height: BigInt(200), sampleCount: 0 },
        ];
        expect(weightedAverage(records)).toBe(0);
      });

      it("should handle zero heights", () => {
        const records = [
          { height: BigInt(0), sampleCount: 10 },
          { height: BigInt(100), sampleCount: 10 },
        ];
        expect(weightedAverage(records)).toBe(50);
      });

      it("should handle large BigInt values", () => {
        const records = [
          { height: BigInt(1000000), sampleCount: 5 },
          { height: BigInt(2000000), sampleCount: 5 },
        ];
        expect(weightedAverage(records)).toBe(1500000);
      });

      it("should ignore records with zero sample count in calculation", () => {
        const records = [
          { height: BigInt(100), sampleCount: 10 },
          { height: BigInt(999999), sampleCount: 0 }, // Should not affect result
        ];
        expect(weightedAverage(records)).toBe(100);
      });
    });

    describe("Real-world scenarios", () => {
      it("should handle historical aggregation data", () => {
        const records = [
          { height: BigInt(1000), sampleCount: 30 }, // 30 samples at 1000mm
          { height: BigInt(2000), sampleCount: 60 }, // 60 samples at 2000mm
          { height: BigInt(1500), sampleCount: 10 }, // 10 samples at 1500mm
        ];
        // (1000*30 + 2000*60 + 1500*10) / (30+60+10) = 165000/100 = 1650
        expect(weightedAverage(records)).toBe(1650);
      });
    });
  });
});
