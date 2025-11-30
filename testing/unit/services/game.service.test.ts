/**
 * Unit Tests for game.service.ts
 * Testing scroll batch processing, anti-cheat validation, and game state
 * Target: >95% coverage
 */

// Mock Redis service
const mockRedisService = {
  incrementCountryHeight: jest.fn(),
  updateLastActivity: jest.fn(),
  updateCountryLastActivity: jest.fn(),
  getGlobalHeight: jest.fn(),
  getAllCountryHeights: jest.fn(),
};

jest.mock("../../../src/services/redis.service", () => ({
  redisService: mockRedisService,
}));

// Mock logger
jest.mock("../../../src/utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock getCurrentVelocity from worker
const mockGetCurrentVelocity = jest.fn(() => 100);
jest.mock("../../../src/workers/global-height.worker", () => ({
  getCurrentVelocity: mockGetCurrentVelocity,
}));

import { gameService } from "../../../src/services/game.service";
import { pixelsToMillimeters } from "../../../src/config/game.constants";
import logger from "../../../src/utils/logger";

describe("GameService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default mock implementation after clearAllMocks
    mockGetCurrentVelocity.mockReturnValue(100);
  });

  describe("processScrollBatch", () => {
    const userId = "user-123";
    const countryCode = "TH";

    describe("Valid scroll batches", () => {
      it("should process valid scroll batch successfully", async () => {
        mockRedisService.incrementCountryHeight.mockResolvedValue(1000);

        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          100, // 100 pixels
          1000, // 1 second interval
        );

        expect(result).toEqual({ success: true });
        expect(mockRedisService.incrementCountryHeight).toHaveBeenCalledWith(
          countryCode,
          pixelsToMillimeters(100),
        );
        expect(mockRedisService.updateLastActivity).toHaveBeenCalled();
        expect(mockRedisService.updateCountryLastActivity).toHaveBeenCalledWith(
          countryCode,
        );
      });

      it("should handle small scroll deltas", async () => {
        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          10, // Small scroll
          500,
        );

        expect(result).toEqual({ success: true });
        expect(mockRedisService.incrementCountryHeight).toHaveBeenCalledWith(
          countryCode,
          pixelsToMillimeters(10),
        );
      });

      it("should handle large valid scroll deltas", async () => {
        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          1000,
          2000, // 2 seconds, velocity = ~132.5 mm/s
        );

        expect(result).toEqual({ success: true });
      });

      it("should work for different countries", async () => {
        await gameService.processScrollBatch(userId, "US", 100, 1000);
        await gameService.processScrollBatch(userId, "JP", 200, 1000);
        await gameService.processScrollBatch(userId, "DE", 150, 1000);

        expect(mockRedisService.incrementCountryHeight).toHaveBeenCalledTimes(
          3,
        );
        expect(mockRedisService.updateCountryLastActivity).toHaveBeenCalledWith(
          "US",
        );
        expect(mockRedisService.updateCountryLastActivity).toHaveBeenCalledWith(
          "JP",
        );
        expect(mockRedisService.updateCountryLastActivity).toHaveBeenCalledWith(
          "DE",
        );
      });
    });

    describe("Anti-cheat: Velocity validation", () => {
      it("should reject scroll with excessive velocity (> 2000 mm/s)", async () => {
        // 10000 pixels in 100ms = very high velocity
        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          10000,
          100,
        );

        expect(result).toBeNull();
        expect(mockRedisService.incrementCountryHeight).not.toHaveBeenCalled();
        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining("Suspicious activity"),
        );
      });

      it("should reject extremely fast scrolling", async () => {
        // 5000 pixels in 50ms = very suspicious
        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          5000,
          50,
        );

        expect(result).toBeNull();
      });

      it("should accept scroll at maximum allowed velocity", async () => {
        // Calculate pixels for ~1900 mm/s (just below 2000 limit)
        // 1900 mm/s = 1.9 m/s
        // To get 1900mm in 1 second, we need: 1900mm / 0.264583 = ~7182 pixels
        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          7000,
          1000,
        );

        expect(result).toEqual({ success: true });
      });

      it("should calculate velocity correctly for different time intervals", async () => {
        // 1000 pixels in 500ms should be valid
        // ~265mm / 0.5s = 530 mm/s (well below limit)
        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          1000,
          500,
        );

        expect(result).toEqual({ success: true });
      });

      it("should log warning with velocity information when rejecting", async () => {
        await gameService.processScrollBatch(userId, countryCode, 10000, 100);

        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringMatching(/Suspicious activity.*Velocity.*mm\/s/),
        );
        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining(userId),
        );
      });
    });

    describe("Edge cases", () => {
      it("should handle zero pixel delta", async () => {
        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          0,
          1000,
        );

        expect(result).toEqual({ success: true });
        expect(mockRedisService.incrementCountryHeight).toHaveBeenCalledWith(
          countryCode,
          0,
        );
      });

      it("should handle very small time intervals", async () => {
        // Small delta with small interval should still validate
        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          1,
          100,
        );

        expect(result).toEqual({ success: true });
      });

      it("should handle large time intervals", async () => {
        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          1000,
          10000, // 10 seconds
        );

        expect(result).toEqual({ success: true });
      });

      it("should handle unknown country code", async () => {
        const result = await gameService.processScrollBatch(
          userId,
          "XX",
          100,
          1000,
        );

        expect(result).toEqual({ success: true });
        expect(mockRedisService.updateCountryLastActivity).toHaveBeenCalledWith(
          "XX",
        );
      });
    });

    describe("Realistic usage scenarios", () => {
      it("should handle typical mobile scroll", async () => {
        // Typical mobile flick: 500 pixels in 300ms
        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          500,
          300,
        );

        expect(result).toEqual({ success: true });
      });

      it("should handle slow scroll", async () => {
        // Slow, deliberate scroll: 50 pixels in 1 second
        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          50,
          1000,
        );

        expect(result).toEqual({ success: true });
      });

      it("should handle aggressive but legitimate scrolling", async () => {
        // Fast but human-possible: 2000 pixels in 1 second
        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          2000,
          1000,
        );

        expect(result).toEqual({ success: true });
      });
    });

    describe("Boundary value analysis", () => {
      it("should test at velocity threshold boundary", async () => {
        // Exactly at 2000 mm/s threshold
        // 2000mm in 1000ms
        // pixels = 2000 / 0.264583 ≈ 7558 pixels
        const validResult = await gameService.processScrollBatch(
          userId,
          countryCode,
          7558,
          1000,
        );
        expect(validResult).toEqual({ success: true });

        // Just above threshold
        const invalidResult = await gameService.processScrollBatch(
          userId,
          countryCode,
          8000,
          1000,
        );
        expect(invalidResult).toBeNull();
      });

      it("should handle minimum positive values", async () => {
        const result = await gameService.processScrollBatch(
          userId,
          countryCode,
          1, // 1 pixel
          1, // 1 ms
        );

        // 1 pixel / 1ms = ~265 mm/s (below limit)
        expect(result).toEqual({ success: true });
      });
    });
  });

  describe("getGameState", () => {
    beforeEach(() => {
      mockRedisService.getGlobalHeight.mockResolvedValue("5000");
      mockRedisService.getAllCountryHeights.mockResolvedValue({
        TH: "2000",
        US: "1500",
        JP: "1000",
      });
    });

    it("should return complete game state", async () => {
      const result = await gameService.getGameState();

      expect(result).toEqual({
        height: "5000",
        velocity: 100, // Mocked value from worker
        countryHeights: {
          TH: "2000",
          US: "1500",
          JP: "1000",
        },
      });
    });

    it("should call all required Redis methods", async () => {
      await gameService.getGameState();

      expect(mockRedisService.getGlobalHeight).toHaveBeenCalled();
      expect(mockRedisService.getAllCountryHeights).toHaveBeenCalled();
    });

    it("should handle zero height", async () => {
      mockRedisService.getGlobalHeight.mockResolvedValue("0");
      mockRedisService.getAllCountryHeights.mockResolvedValue({});

      const result = await gameService.getGameState();

      expect(result.height).toBe("0");
      expect(result.countryHeights).toEqual({});
    });

    it("should handle very large heights (BigInt)", async () => {
      mockRedisService.getGlobalHeight.mockResolvedValue("999999999999999");

      const result = await gameService.getGameState();

      expect(result.height).toBe("999999999999999");
    });

    it("should handle single country", async () => {
      mockRedisService.getAllCountryHeights.mockResolvedValue({
        TH: "1000",
      });

      const result = await gameService.getGameState();

      expect(result.countryHeights).toEqual({
        TH: "1000",
      });
    });

    it("should handle many countries", async () => {
      const manyCountries: Record<string, string> = {};
      for (let i = 0; i < 50; i++) {
        manyCountries[`C${i}`] = String(i * 100);
      }
      mockRedisService.getAllCountryHeights.mockResolvedValue(manyCountries);

      const result = await gameService.getGameState();

      expect(Object.keys(result.countryHeights)).toHaveLength(50);
    });

    it("should return velocity from worker", async () => {
      mockGetCurrentVelocity.mockReturnValue(250);

      const result = await gameService.getGameState();

      expect(result.velocity).toBe(250);
    });
  });

  describe("Integration: Multiple operations", () => {
    const testUserId = "test-user-123";

    it("should handle multiple scroll batches from same user", async () => {
      await gameService.processScrollBatch(testUserId, "TH", 100, 1000);
      await gameService.processScrollBatch(testUserId, "TH", 200, 1000);
      await gameService.processScrollBatch(testUserId, "TH", 150, 1000);

      expect(mockRedisService.incrementCountryHeight).toHaveBeenCalledTimes(3);
      expect(mockRedisService.updateLastActivity).toHaveBeenCalledTimes(3);
    });

    it("should handle scrolls from multiple users in same country", async () => {
      await gameService.processScrollBatch("user-1", "TH", 100, 1000);
      await gameService.processScrollBatch("user-2", "TH", 150, 1000);
      await gameService.processScrollBatch("user-3", "TH", 200, 1000);

      expect(mockRedisService.incrementCountryHeight).toHaveBeenCalledTimes(3);
      expect(mockRedisService.updateCountryLastActivity).toHaveBeenCalledWith(
        "TH",
      );
    });

    it("should correctly reject some batches while accepting others", async () => {
      const valid1 = await gameService.processScrollBatch(
        testUserId,
        "TH",
        100,
        1000,
      );
      const invalid = await gameService.processScrollBatch(
        testUserId,
        "TH",
        10000,
        100,
      );
      const valid2 = await gameService.processScrollBatch(
        testUserId,
        "TH",
        200,
        1000,
      );

      expect(valid1).toEqual({ success: true });
      expect(invalid).toBeNull();
      expect(valid2).toEqual({ success: true });
      expect(mockRedisService.incrementCountryHeight).toHaveBeenCalledTimes(2);
    });
  });
});
