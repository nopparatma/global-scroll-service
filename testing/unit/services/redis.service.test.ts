/**
 * Unit Tests for redis.service.ts
 * Testing Redis operations with mocked client
 * Target: >95% coverage
 */

import { RedisMock } from "../../mocks/redis.mock";

// Mock the redis module before importing the service
jest.mock("redis", () => ({
  createClient: jest.fn(() => new RedisMock()),
}));

// Mock logger
jest.mock("../../../src/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock environment
jest.mock("../../../src/config/env", () => ({
  env: {
    REDIS_URL: "redis://localhost:6379",
  },
}));

describe("RedisService", () => {
  let redisService: {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    setGlobalHeight: (value: string) => Promise<void>;
    getGlobalHeight: () => Promise<string>;
    incrementCountryHeight: (
      countryCode: string,
      amount: number,
    ) => Promise<number>;
    decreaseCountryHeight: (
      countryCode: string,
      amount: number,
    ) => Promise<number>;
    decreaseAllCountryHeights: (amount: number) => Promise<void>;
    getCountryHeights: (countries: string[]) => Promise<Record<string, string>>;
    getAllCountryHeights: () => Promise<Record<string, string>>;
    calculateGlobalHeightFromCountries: () => Promise<string>;
    updateLastActivity: () => Promise<void>;
    getLastActivity: () => Promise<number>;
    updateCountryLastActivity: (countryCode: string) => Promise<void>;
    getCountryLastActivity: (countryCode: string) => Promise<number>;
    getAllCountryLastActivities: () => Promise<Record<string, number>>;
    client?: RedisMock;
  };
  let mockClient: RedisMock;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    // Import fresh instance
    const { redisService: service } = await import(
      "../../../src/services/redis.service"
    );
    redisService = service as unknown as typeof redisService;
    mockClient = (redisService as unknown as { client: RedisMock }).client;

    await redisService.connect();
  });

  afterEach(async () => {
    await redisService.disconnect();
  });

  describe("Connection management", () => {
    it("should connect to Redis successfully", async () => {
      expect(mockClient.isConnected()).toBe(true);
    });

    it("should disconnect from Redis", async () => {
      await redisService.disconnect();
      expect(mockClient.isConnected()).toBe(false);
    });

    it("should not reconnect if already connected", async () => {
      // Already connected in beforeEach
      const initialConnectionState = mockClient.isConnected();
      expect(initialConnectionState).toBe(true);

      // Try to connect again
      await redisService.connect();

      // Should still be connected
      expect(mockClient.isConnected()).toBe(true);
    });
  });

  describe("setGlobalHeight", () => {
    it("should set global height to a string value", async () => {
      await redisService.setGlobalHeight("1000");
      const result = await mockClient.get("global:height");
      expect(result).toBe("1000");
    });

    it("should overwrite existing global height", async () => {
      await redisService.setGlobalHeight("500");
      await redisService.setGlobalHeight("1000");
      const result = await mockClient.get("global:height");
      expect(result).toBe("1000");
    });

    it("should handle zero value", async () => {
      await redisService.setGlobalHeight("0");
      const result = await mockClient.get("global:height");
      expect(result).toBe("0");
    });

    it("should handle large string values", async () => {
      await redisService.setGlobalHeight("999999999999");
      const result = await mockClient.get("global:height");
      expect(result).toBe("999999999999");
    });
  });

  describe("getGlobalHeight", () => {
    it("should return stored global height", async () => {
      await mockClient.set("global:height", "1500");
      const result = await redisService.getGlobalHeight();
      expect(result).toBe("1500");
    });

    it('should return "0" when no height is stored', async () => {
      const result = await redisService.getGlobalHeight();
      expect(result).toBe("0");
    });

    it("should handle very large values", async () => {
      await mockClient.set("global:height", "123456789012345");
      const result = await redisService.getGlobalHeight();
      expect(result).toBe("123456789012345");
    });
  });

  describe("incrementCountryHeight", () => {
    it("should increment country height by specified amount", async () => {
      const result = await redisService.incrementCountryHeight("TH", 100);
      expect(result).toBe(100);
    });

    it("should accumulate multiple increments", async () => {
      await redisService.incrementCountryHeight("US", 50);
      await redisService.incrementCountryHeight("US", 30);
      const result = await redisService.incrementCountryHeight("US", 20);
      expect(result).toBe(100);
    });

    it("should handle different countries independently", async () => {
      await redisService.incrementCountryHeight("TH", 100);
      await redisService.incrementCountryHeight("US", 200);

      const thHeight = await mockClient.get("global:height:TH");
      const usHeight = await mockClient.get("global:height:US");

      expect(thHeight).toBe("100");
      expect(usHeight).toBe("200");
    });

    it("should handle zero increment", async () => {
      await redisService.incrementCountryHeight("JP", 0);
      const result = await mockClient.get("global:height:JP");
      expect(result).toBe("0");
    });

    it("should handle large increments", async () => {
      const result = await redisService.incrementCountryHeight("DE", 999999);
      expect(result).toBe(999999);
    });
  });

  describe("decreaseCountryHeight", () => {
    it("should decrease country height by specified amount", async () => {
      await mockClient.set("global:height:TH", "100");
      const result = await redisService.decreaseCountryHeight("TH", 30);
      expect(result).toBe(70);
    });

    it("should not go below zero", async () => {
      await mockClient.set("global:height:US", "50");
      const result = await redisService.decreaseCountryHeight("US", 100);
      expect(result).toBe(0);
    });

    it("should return 0 when already at zero", async () => {
      await mockClient.set("global:height:JP", "0");
      const result = await redisService.decreaseCountryHeight("JP", 50);
      expect(result).toBe(0);
    });

    it("should handle missing country (default 0)", async () => {
      const result = await redisService.decreaseCountryHeight("XX", 10);
      expect(result).toBe(0);
    });

    it("should decrease to exactly zero", async () => {
      await mockClient.set("global:height:FR", "100");
      const result = await redisService.decreaseCountryHeight("FR", 100);
      expect(result).toBe(0);
    });
  });

  describe("getAllCountryHeights", () => {
    it("should return all country heights", async () => {
      await mockClient.set("global:height:TH", "1000");
      await mockClient.set("global:height:US", "2000");
      await mockClient.set("global:height:JP", "1500");

      const result = await redisService.getAllCountryHeights();

      expect(result).toEqual({
        US: "2000",
        JP: "1500",
        TH: "1000",
      });
    });

    it("should return empty object when no countries exist", async () => {
      const result = await redisService.getAllCountryHeights();
      expect(result).toEqual({});
    });

    it("should exclude global height key", async () => {
      await mockClient.set("global:height", "5000");
      await mockClient.set("global:height:TH", "1000");

      const result = await redisService.getAllCountryHeights();

      expect(result).toEqual({
        TH: "1000",
      });
      expect(result).not.toHaveProperty("height");
    });

    it("should sort countries by height descending", async () => {
      await mockClient.set("global:height:TH", "500");
      await mockClient.set("global:height:US", "2000");
      await mockClient.set("global:height:JP", "1000");

      const result = await redisService.getAllCountryHeights();
      const keys = Object.keys(result);

      expect(keys[0]).toBe("US"); // Highest
      expect(keys[1]).toBe("JP");
      expect(keys[2]).toBe("TH"); // Lowest
    });

    it("should handle many countries", async () => {
      const countries = ["TH", "US", "JP", "DE", "FR", "GB", "CN", "KR"];
      for (let i = 0; i < countries.length; i++) {
        await mockClient.set(`global:height:${countries[i]}`, String(i * 100));
      }

      const result = await redisService.getAllCountryHeights();
      expect(Object.keys(result)).toHaveLength(countries.length);
    });
  });

  describe("getCountryHeights", () => {
    beforeEach(async () => {
      await mockClient.set("global:height:TH", "1000");
      await mockClient.set("global:height:US", "2000");
      await mockClient.set("global:height:JP", "1500");
    });

    it("should return heights for specified countries", async () => {
      const result = await redisService.getCountryHeights(["TH", "US"]);
      expect(result).toEqual({
        TH: "1000",
        US: "2000",
      });
    });

    it('should return "0" for countries with no data', async () => {
      const result = await redisService.getCountryHeights(["TH", "XX"]);
      expect(result).toEqual({
        TH: "1000",
        XX: "0",
      });
    });

    it("should return empty object for empty array", async () => {
      const result = await redisService.getCountryHeights([]);
      expect(result).toEqual({});
    });

    it("should handle single country", async () => {
      const result = await redisService.getCountryHeights(["JP"]);
      expect(result).toEqual({
        JP: "1500",
      });
    });
  });

  describe("calculateGlobalHeightFromCountries", () => {
    it("should sum all country heights", async () => {
      await mockClient.set("global:height:TH", "1000");
      await mockClient.set("global:height:US", "2000");
      await mockClient.set("global:height:JP", "1500");

      const result = await redisService.calculateGlobalHeightFromCountries();
      expect(result).toBe("4500");
    });

    it('should return "0" when no countries exist', async () => {
      const result = await redisService.calculateGlobalHeightFromCountries();
      expect(result).toBe("0");
    });

    it("should handle very large sums using BigInt", async () => {
      await mockClient.set("global:height:TH", "999999999999");
      await mockClient.set("global:height:US", "888888888888");

      const result = await redisService.calculateGlobalHeightFromCountries();
      expect(result).toBe("1888888888887");
    });

    it("should handle single country", async () => {
      await mockClient.set("global:height:TH", "500");
      const result = await redisService.calculateGlobalHeightFromCountries();
      expect(result).toBe("500");
    });
  });

  describe("Last activity tracking", () => {
    describe("updateLastActivity", () => {
      it("should update global last activity timestamp", async () => {
        const beforeUpdate = Date.now();
        await redisService.updateLastActivity();
        const stored = await mockClient.get("global:last_activity");

        expect(stored).toBeDefined();
        const timestamp = parseInt(stored!, 10);
        expect(timestamp).toBeGreaterThanOrEqual(beforeUpdate);
      });

      it("should overwrite previous timestamp", async () => {
        await mockClient.set("global:last_activity", "1000000");
        await redisService.updateLastActivity();
        const stored = await mockClient.get("global:last_activity");
        const timestamp = parseInt(stored!, 10);
        expect(timestamp).toBeGreaterThan(1000000);
      });
    });

    describe("getLastActivity", () => {
      it("should return stored last activity timestamp", async () => {
        const now = Date.now();
        await mockClient.set("global:last_activity", String(now));
        const result = await redisService.getLastActivity();
        expect(result).toBe(now);
      });

      it("should return current time if no activity stored", async () => {
        const beforeCall = Date.now();
        const result = await redisService.getLastActivity();
        expect(result).toBeGreaterThanOrEqual(beforeCall);
      });
    });

    describe("updateCountryLastActivity", () => {
      it("should update country-specific last activity", async () => {
        const beforeUpdate = Date.now();
        await redisService.updateCountryLastActivity("TH");
        const stored = await mockClient.get("global:last_activity:TH");

        const timestamp = parseInt(stored!, 10);
        expect(timestamp).toBeGreaterThanOrEqual(beforeUpdate);
      });

      it("should handle multiple countries independently", async () => {
        await redisService.updateCountryLastActivity("TH");
        await redisService.updateCountryLastActivity("US");

        const thActivity = await mockClient.get("global:last_activity:TH");
        const usActivity = await mockClient.get("global:last_activity:US");

        expect(thActivity).toBeDefined();
        expect(usActivity).toBeDefined();
      });
    });

    describe("getCountryLastActivity", () => {
      it("should return country last activity timestamp", async () => {
        const now = Date.now();
        await mockClient.set("global:last_activity:TH", String(now));
        const result = await redisService.getCountryLastActivity("TH");
        expect(result).toBe(now);
      });

      it("should return 0 for country with no activity", async () => {
        const result = await redisService.getCountryLastActivity("XX");
        expect(result).toBe(0);
      });
    });

    describe("getAllCountryLastActivities", () => {
      it("should return all country activity timestamps", async () => {
        const now = Date.now();
        await mockClient.set("global:last_activity:TH", String(now));
        await mockClient.set("global:last_activity:US", String(now + 1000));

        const result = await redisService.getAllCountryLastActivities();

        expect(result).toHaveProperty("TH", now);
        expect(result).toHaveProperty("US", now + 1000);
      });

      it("should return empty object when no activities exist", async () => {
        const result = await redisService.getAllCountryLastActivities();
        expect(result).toEqual({});
      });

      it("should handle multiple countries", async () => {
        const countries = ["TH", "US", "JP", "DE"];
        for (let i = 0; i < countries.length; i++) {
          await mockClient.set(
            `global:last_activity:${countries[i]}`,
            String(Date.now() + i * 1000),
          );
        }

        const result = await redisService.getAllCountryLastActivities();
        expect(Object.keys(result)).toHaveLength(countries.length);
      });
    });
  });

  describe("decreaseAllCountryHeights", () => {
    it("should decrease all country heights by specified amount", async () => {
      await mockClient.set("global:height:TH", "1000");
      await mockClient.set("global:height:US", "2000");
      await mockClient.set("global:height:JP", "1500");

      await redisService.decreaseAllCountryHeights(100);

      const thHeight = await mockClient.get("global:height:TH");
      const usHeight = await mockClient.get("global:height:US");
      const jpHeight = await mockClient.get("global:height:JP");

      expect(thHeight).toBe("900");
      expect(usHeight).toBe("1900");
      expect(jpHeight).toBe("1400");
    });

    it("should not decrease any country below zero", async () => {
      await mockClient.set("global:height:TH", "50");
      await mockClient.set("global:height:US", "2000");

      await redisService.decreaseAllCountryHeights(100);

      const thHeight = await mockClient.get("global:height:TH");
      const usHeight = await mockClient.get("global:height:US");

      expect(thHeight).toBe("0"); // Capped at 0
      expect(usHeight).toBe("1900");
    });

    it("should handle empty country list gracefully", async () => {
      await redisService.decreaseAllCountryHeights(100);
      // Should not throw error
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle concurrent operations", async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(redisService.incrementCountryHeight("TH", 10));
      }

      await Promise.all(promises);
      const height = await mockClient.get("global:height:TH");
      expect(height).toBe("100"); // 10 increments of 10
    });

    it("should handle special characters in country codes", async () => {
      // While normally country codes are 2 letters, test robustness
      await redisService.incrementCountryHeight("XX", 100);
      const result = await mockClient.get("global:height:XX");
      expect(result).toBe("100");
    });
  });
});
