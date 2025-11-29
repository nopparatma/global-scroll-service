import { createClient } from "redis";
import { env } from "../config/env";
import logger from "../utils/logger";

class RedisService {
  private client;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: env.REDIS_URL,
    });

    this.client.on("error", (err) => logger.error("Redis Client Error", err));
    this.client.on("connect", () => {
      this.isConnected = true;
      logger.info("Redis Connected");
    });
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect() {
    await this.client.quit();
  }

  async setGlobalHeight(value: string): Promise<void> {
    await this.client.set("global:height", value);
  }

  async calculateGlobalHeightFromCountries(): Promise<string> {
    // Get all country heights
    const countryHeights = await this.getAllCountryHeights();

    // Sum all country heights
    let total = BigInt(0);
    for (const height of Object.values(countryHeights)) {
      total += BigInt(height);
    }

    return total.toString();
  }

  async incrementCountryHeight(
    countryCode: string,
    amount: number,
  ): Promise<number> {
    return await this.client.incrBy(`global:height:${countryCode}`, amount);
  }

  async getGlobalHeight(): Promise<string> {
    const height = await this.client.get("global:height");
    return height || "0";
  }

  async getCountryHeights(
    countries: string[],
  ): Promise<Record<string, string>> {
    if (countries.length === 0) return {};
    const keys = countries.map((c) => `global:height:${c}`);
    const values = await this.client.mGet(keys);

    const result: Record<string, string> = {};
    countries.forEach((c, i) => {
      result[c] = values[i] || "0";
    });
    return result;
  }

  async getAllCountryHeights(): Promise<Record<string, string>> {
    // Scan for all country height keys
    const keys: string[] = [];
    let cursor = "0";

    do {
      const result = await this.client.scan(cursor, {
        MATCH: "global:height:*",
        COUNT: 100,
      });
      cursor = result.cursor.toString();
      keys.push(...result.keys);
    } while (cursor !== "0");

    // Filter out the global height key (we only want country-specific ones)
    const countryKeys = keys.filter(
      (k) => k !== "global:height" && k.startsWith("global:height:"),
    );

    if (countryKeys.length === 0) return {};

    // Get all values
    const values = await this.client.mGet(countryKeys);

    // Build result object with country codes
    const result: Record<string, string> = {};
    countryKeys.forEach((key, i) => {
      const countryCode = key.replace("global:height:", "");
      const height = values[i] || "0";
      if (parseInt(height, 10) > 0) {
        // Only include countries with height > 0
        result[countryCode] = height;
      }
    });

    // Sort by height (descending)
    const sorted = Object.entries(result)
      .sort(([, a], [, b]) => parseInt(b, 10) - parseInt(a, 10))
      .reduce(
        (acc, [country, height]) => {
          acc[country] = height;
          return acc;
        },
        {} as Record<string, string>,
      );

    return sorted;
  }

  async updateLastActivity() {
    await this.client.set("global:last_activity", Date.now().toString());
  }

  async getLastActivity(): Promise<number> {
    const last = await this.client.get("global:last_activity");
    return last ? parseInt(last, 10) : Date.now();
  }

  // Country-specific last activity tracking
  async updateCountryLastActivity(countryCode: string) {
    await this.client.set(
      `global:last_activity:${countryCode}`,
      Date.now().toString(),
    );
  }

  async getCountryLastActivity(countryCode: string): Promise<number> {
    const last = await this.client.get(`global:last_activity:${countryCode}`);
    return last ? parseInt(last, 10) : 0; // Return 0 if never active (will trigger gravity)
  }

  async getAllCountryLastActivities(): Promise<Record<string, number>> {
    // Scan for all country last activity keys
    const keys: string[] = [];
    let cursor = "0";

    do {
      const result = await this.client.scan(cursor, {
        MATCH: "global:last_activity:*",
        COUNT: 100,
      });
      cursor = result.cursor.toString();
      keys.push(...result.keys);
    } while (cursor !== "0");

    if (keys.length === 0) return {};

    // Get all values
    const values = await this.client.mGet(keys);

    // Build result object
    const result: Record<string, number> = {};
    keys.forEach((key, i) => {
      const countryCode = key.replace("global:last_activity:", "");
      const timestamp = values[i] ? parseInt(values[i], 10) : 0;
      result[countryCode] = timestamp;
    });

    return result;
  }

  // For gravity - decrease individual country heights
  async decreaseCountryHeight(
    countryCode: string,
    amount: number,
  ): Promise<number> {
    // Prevent height from going negative
    const currentHeight = await this.client.get(`global:height:${countryCode}`);
    const currentValue = currentHeight ? parseInt(currentHeight, 10) : 0;

    if (currentValue <= 0) return 0;

    const decreaseAmount = Math.min(amount, currentValue);
    return await this.client.decrBy(
      `global:height:${countryCode}`,
      decreaseAmount,
    );
  }

  async decreaseAllCountryHeights(amount: number): Promise<void> {
    // Get all country keys
    const countryHeights = await this.getAllCountryHeights();

    // Decrease each country's height
    for (const countryCode of Object.keys(countryHeights)) {
      await this.decreaseCountryHeight(countryCode, amount);
    }
  }
}

export const redisService = new RedisService();
