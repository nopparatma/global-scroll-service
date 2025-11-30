/**
 * Unit Tests for game.constants.ts
 * Testing unit conversion functions and game configuration
 * Target: 100% coverage
 */

import {
  CSS_PIXELS_PER_INCH,
  MM_PER_INCH,
  MM_PER_PIXEL,
  pixelsToMillimeters,
  millimetersToMeters,
  millimetersToCentimeters,
  millimetersToKilometers,
  MAX_PIXELS_PER_BATCH,
  MAX_MM_PER_BATCH,
  MAX_VELOCITY_MM_PER_SECOND,
  MIN_BATCH_INTERVAL_MS,
  GRAVITY_CHECK_INTERVAL_MS,
  COUNTRY_IDLE_THRESHOLD_MS,
  GRAVITY_DECAY_MM_PER_TICK,
  PERSISTENCE_SYNC_INTERVAL_MS,
  GLOBAL_HEIGHT_SYNC_INTERVAL_MS,
  VELOCITY_WINDOW_SECONDS,
  formatHeight,
  formatVelocity,
} from "../../../src/config/game.constants";

describe("game.constants", () => {
  describe("Constants validation", () => {
    describe("CSS Reference Pixel constants", () => {
      it("should have correct CSS pixels per inch", () => {
        expect(CSS_PIXELS_PER_INCH).toBe(96);
      });

      it("should have correct millimeters per inch", () => {
        expect(MM_PER_INCH).toBe(25.4);
      });

      it("should have correct millimeters per pixel ratio", () => {
        expect(MM_PER_PIXEL).toBeCloseTo(0.264583, 6);
        expect(MM_PER_PIXEL).toBe(MM_PER_INCH / CSS_PIXELS_PER_INCH);
      });
    });

    describe("Anti-cheat constants", () => {
      it("should have maximum pixels per batch defined", () => {
        expect(MAX_PIXELS_PER_BATCH).toBe(10000);
      });

      it("should have maximum mm per batch calculated correctly", () => {
        expect(MAX_MM_PER_BATCH).toBe(
          pixelsToMillimeters(MAX_PIXELS_PER_BATCH),
        );
        expect(MAX_MM_PER_BATCH).toBeGreaterThan(0);
      });

      it("should have velocity limit defined", () => {
        expect(MAX_VELOCITY_MM_PER_SECOND).toBeGreaterThan(0);
      });

      it("should have minimum batch interval defined", () => {
        expect(MIN_BATCH_INTERVAL_MS).toBe(1000);
      });
    });

    describe("Gravity constants", () => {
      it("should have gravity check interval defined", () => {
        expect(GRAVITY_CHECK_INTERVAL_MS).toBe(1000);
      });

      it("should have country idle threshold defined", () => {
        expect(COUNTRY_IDLE_THRESHOLD_MS).toBe(5000);
      });

      it("should have gravity decay rate defined", () => {
        expect(GRAVITY_DECAY_MM_PER_TICK).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(GRAVITY_DECAY_MM_PER_TICK)).toBe(true);
      });
    });

    describe("Worker configuration constants", () => {
      it("should have persistence sync interval defined", () => {
        expect(PERSISTENCE_SYNC_INTERVAL_MS).toBe(30000);
      });

      it("should have global height sync interval defined", () => {
        expect(GLOBAL_HEIGHT_SYNC_INTERVAL_MS).toBe(1000);
      });

      it("should have velocity window in seconds matching sync interval", () => {
        expect(VELOCITY_WINDOW_SECONDS).toBe(
          GLOBAL_HEIGHT_SYNC_INTERVAL_MS / 1000,
        );
      });
    });
  });

  describe("pixelsToMillimeters", () => {
    describe("Standard conversions", () => {
      it("should convert 0 pixels to 0 millimeters", () => {
        expect(pixelsToMillimeters(0)).toBe(0);
      });

      it("should convert 96 pixels (1 inch) to ~25 millimeters", () => {
        const result = pixelsToMillimeters(96);
        expect(result).toBe(25); // Rounded
        expect(result).toBeCloseTo(25.4, 0);
      });

      it("should convert 100 pixels to ~26 millimeters", () => {
        const result = pixelsToMillimeters(100);
        expect(result).toBe(26);
      });

      it("should convert 1000 pixels to ~265 millimeters", () => {
        const result = pixelsToMillimeters(1000);
        expect(result).toBe(265);
      });

      it("should convert 3780 pixels to ~1000 millimeters (1 meter)", () => {
        const result = pixelsToMillimeters(3780);
        expect(result).toBeCloseTo(1000, 0);
      });

      it("should convert 10000 pixels (max batch) correctly", () => {
        const result = pixelsToMillimeters(10000);
        expect(result).toBe(2646);
        expect(Number.isInteger(result)).toBe(true);
      });
    });

    describe("Edge cases", () => {
      it("should handle very small pixel values", () => {
        expect(pixelsToMillimeters(1)).toBe(0); // Rounds to 0
      });

      it("should handle decimal pixel values", () => {
        expect(pixelsToMillimeters(100.5)).toBe(27);
        expect(pixelsToMillimeters(100.4)).toBe(27);
      });

      it("should handle very large pixel values", () => {
        const result = pixelsToMillimeters(1000000);
        expect(result).toBe(264583);
        expect(Number.isInteger(result)).toBe(true);
      });

      it("should always return integers (Redis requirement)", () => {
        const testCases = [0, 1, 10, 100, 500, 1000, 5000, 10000];
        testCases.forEach((pixels) => {
          const result = pixelsToMillimeters(pixels);
          expect(Number.isInteger(result)).toBe(true);
        });
      });
    });

    describe("Negative values", () => {
      it("should handle negative pixel values", () => {
        expect(pixelsToMillimeters(-100)).toBe(-26);
      });

      it("should preserve negative sign after rounding", () => {
        expect(pixelsToMillimeters(-1000)).toBe(-265);
      });
    });
  });

  describe("millimetersToMeters", () => {
    describe("Standard conversions", () => {
      it("should convert 0 millimeters to 0 meters", () => {
        expect(millimetersToMeters(0)).toBe(0);
      });

      it("should convert 1000 millimeters to 1 meter", () => {
        expect(millimetersToMeters(1000)).toBe(1);
      });

      it("should convert 500 millimeters to 0.5 meters", () => {
        expect(millimetersToMeters(500)).toBe(0.5);
      });

      it("should convert 2000 millimeters to 2 meters", () => {
        expect(millimetersToMeters(2000)).toBe(2);
      });

      it("should convert 1000000 millimeters to 1000 meters (1 km)", () => {
        expect(millimetersToMeters(1000000)).toBe(1000);
      });
    });

    describe("Edge cases", () => {
      it("should handle small values", () => {
        expect(millimetersToMeters(1)).toBe(0.001);
        expect(millimetersToMeters(10)).toBe(0.01);
      });

      it("should handle decimal precision", () => {
        expect(millimetersToMeters(1234)).toBe(1.234);
      });
    });
  });

  describe("millimetersToCentimeters", () => {
    describe("Standard conversions", () => {
      it("should convert 0 millimeters to 0 centimeters", () => {
        expect(millimetersToCentimeters(0)).toBe(0);
      });

      it("should convert 10 millimeters to 1 centimeter", () => {
        expect(millimetersToCentimeters(10)).toBe(1);
      });

      it("should convert 100 millimeters to 10 centimeters", () => {
        expect(millimetersToCentimeters(100)).toBe(10);
      });

      it("should convert 265 millimeters to 26.5 centimeters", () => {
        expect(millimetersToCentimeters(265)).toBe(26.5);
      });
    });

    describe("Edge cases", () => {
      it("should handle small values", () => {
        expect(millimetersToCentimeters(1)).toBe(0.1);
        expect(millimetersToCentimeters(5)).toBe(0.5);
      });
    });
  });

  describe("millimetersToKilometers", () => {
    describe("Standard conversions", () => {
      it("should convert 0 millimeters to 0 kilometers", () => {
        expect(millimetersToKilometers(0)).toBe(0);
      });

      it("should convert 1000000 millimeters to 1 kilometer", () => {
        expect(millimetersToKilometers(1000000)).toBe(1);
      });

      it("should convert 5000000 millimeters to 5 kilometers", () => {
        expect(millimetersToKilometers(5000000)).toBe(5);
      });
    });

    describe("Edge cases", () => {
      it("should handle small values", () => {
        expect(millimetersToKilometers(1000)).toBe(0.001);
      });

      it("should handle decimal precision", () => {
        expect(millimetersToKilometers(1234567)).toBe(1.234567);
      });
    });
  });

  describe("formatHeight", () => {
    describe("Meter formatting (< 1 km)", () => {
      it("should format 0 millimeters as 0.00 m", () => {
        expect(formatHeight(0)).toBe("0.00 m");
      });

      it("should format small heights in meters", () => {
        expect(formatHeight(100)).toBe("0.10 m"); // 100mm = 0.1m
        expect(formatHeight(500)).toBe("0.50 m"); // 500mm = 0.5m
        expect(formatHeight(1000)).toBe("1.00 m"); // 1000mm = 1m
      });

      it("should format medium heights in meters", () => {
        expect(formatHeight(5000)).toBe("5.00 m");
        expect(formatHeight(10000)).toBe("10.00 m");
      });

      it("should format heights just below 1 km in meters", () => {
        expect(formatHeight(999000)).toBe("999.00 m");
      });

      it("should maintain 2 decimal precision", () => {
        expect(formatHeight(1234)).toBe("1.23 m");
        expect(formatHeight(5678)).toBe("5.68 m");
      });
    });

    describe("Kilometer formatting (>= 1 km)", () => {
      it("should format exactly 1 km", () => {
        expect(formatHeight(1000000)).toBe("1.00 km");
      });

      it("should format large heights in kilometers", () => {
        expect(formatHeight(5000000)).toBe("5.00 km");
        expect(formatHeight(10000000)).toBe("10.00 km");
      });

      it("should maintain 2 decimal precision for kilometers", () => {
        expect(formatHeight(1234567)).toBe("1.23 km");
        expect(formatHeight(5678901)).toBe("5.68 km");
      });

      it("should format very large heights", () => {
        expect(formatHeight(100000000)).toBe("100.00 km");
      });
    });

    describe("Edge cases", () => {
      it("should handle threshold at 1000 meters (1 km)", () => {
        expect(formatHeight(999999)).toBe("1000.00 m");
        expect(formatHeight(1000000)).toBe("1.00 km");
      });

      it("should round decimal values correctly", () => {
        expect(formatHeight(1234)).toBe("1.23 m");
        expect(formatHeight(1235)).toBe("1.24 m"); // toFixed rounds 0.5 up
        expect(formatHeight(1236)).toBe("1.24 m");
      });
    });
  });

  describe("formatVelocity", () => {
    describe("Meters per second formatting (< 10 m/s)", () => {
      it("should format 0 mm/s as 0.00 m/s", () => {
        expect(formatVelocity(0)).toBe("0.00 m/s");
      });

      it("should format small velocities in m/s", () => {
        expect(formatVelocity(100)).toBe("0.10 m/s");
        expect(formatVelocity(500)).toBe("0.50 m/s");
        expect(formatVelocity(1000)).toBe("1.00 m/s");
      });

      it("should format medium velocities in m/s", () => {
        expect(formatVelocity(2000)).toBe("2.00 m/s");
        expect(formatVelocity(5000)).toBe("5.00 m/s");
      });

      it("should format velocities just below 10 m/s", () => {
        expect(formatVelocity(9999)).toBe("10.00 m/s");
      });

      it("should maintain 2 decimal precision", () => {
        expect(formatVelocity(1234)).toBe("1.23 m/s");
        expect(formatVelocity(5678)).toBe("5.68 m/s");
      });
    });

    describe("Kilometers per hour formatting (>= 10 m/s)", () => {
      it("should format exactly 10 m/s as km/h", () => {
        expect(formatVelocity(10000)).toBe("36.0 km/h"); // 10 m/s = 36 km/h
      });

      it("should format high velocities in km/h", () => {
        expect(formatVelocity(20000)).toBe("72.0 km/h"); // 20 m/s = 72 km/h
        expect(formatVelocity(50000)).toBe("180.0 km/h"); // 50 m/s = 180 km/h
      });

      it("should maintain 1 decimal precision for km/h", () => {
        expect(formatVelocity(15000)).toBe("54.0 km/h"); // 15 m/s = 54 km/h
      });

      it("should handle decimal conversions correctly", () => {
        expect(formatVelocity(27778)).toBe("100.0 km/h"); // ~27.778 m/s = 100 km/h
      });
    });

    describe("Edge cases", () => {
      it("should handle threshold at 10 m/s", () => {
        expect(formatVelocity(9999)).toBe("10.00 m/s");
        expect(formatVelocity(10000)).toBe("36.0 km/h");
      });

      it("should handle very high velocities", () => {
        expect(formatVelocity(100000)).toBe("360.0 km/h");
      });

      it("should round decimal values correctly", () => {
        expect(formatVelocity(1234)).toBe("1.23 m/s");
        expect(formatVelocity(1235)).toBe("1.24 m/s"); // toFixed rounds 0.5 up
      });
    });
  });

  describe("Integration: Pixel to display conversion", () => {
    it("should convert realistic scroll (100px) to display format", () => {
      const mm = pixelsToMillimeters(100); // 26mm
      const formatted = formatHeight(mm);
      expect(formatted).toBe("0.03 m"); // ~0.03m (3cm)
    });

    it("should convert 1 meter scroll to display format", () => {
      const mm = pixelsToMillimeters(3780); // ~1000mm
      const formatted = formatHeight(mm);
      expect(formatted).toBe("1.00 m");
    });

    it("should handle full conversion chain", () => {
      const pixels = 10000;
      const mm = pixelsToMillimeters(pixels);
      const meters = millimetersToMeters(mm);
      const cm = millimetersToCentimeters(mm);

      expect(mm).toBe(2646);
      expect(meters).toBeCloseTo(2.646, 3);
      expect(cm).toBeCloseTo(264.6, 1);
    });
  });
});
