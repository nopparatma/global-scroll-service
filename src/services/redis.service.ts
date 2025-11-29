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

  async incrementGlobalHeight(amount: number): Promise<number> {
    return await this.client.incrBy("global:height", amount);
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

  // For gravity
  async decreaseGlobalHeight(amount: number): Promise<number> {
    return await this.client.decrBy("global:height", amount);
  }

  // For velocity tracking
  async setVelocity(velocity: number) {
    await this.client.set("global:velocity", velocity.toString(), {
      EX: 5, // Expire after 5 seconds (if no updates, velocity = 0)
    });
  }

  async getVelocity(): Promise<number> {
    const velocity = await this.client.get("global:velocity");
    return velocity ? parseFloat(velocity) : 0;
  }
}

export const redisService = new RedisService();
