import { redisService } from "./redis.service";
import { getCurrentVelocity } from "../workers/global-height.worker";
import logger from "../utils/logger";
import {
  pixelsToCentimeters,
  MAX_VELOCITY_CM_PER_SECOND,
} from "../config/game.constants";

class GameService {
  async processScrollBatch(
    userId: string,
    countryCode: string,
    deltaPixels: number,
    timeSinceLastBatch: number,
  ) {
    // 1. Convert pixels to centimeters
    const deltaCentimeters = pixelsToCentimeters(deltaPixels);

    // 2. Anti-Cheat: Velocity Check (in cm/s)
    const velocityCmPerSec = (deltaCentimeters / timeSinceLastBatch) * 1000;
    if (velocityCmPerSec > MAX_VELOCITY_CM_PER_SECOND) {
      logger.warn(
        `Suspicious activity from ${userId}: Velocity ${velocityCmPerSec.toFixed(2)} cm/s (${(velocityCmPerSec / 100).toFixed(2)} m/s)`,
      );
      return null; // Reject
    }

    // 3. Update Redis (only country height in centimeters, global height calculated by worker)
    await redisService.incrementCountryHeight(countryCode, deltaCentimeters);
    await redisService.updateLastActivity();
    await redisService.updateCountryLastActivity(countryCode);

    return {
      success: true,
    };
  }

  async getGameState() {
    const height = await redisService.getGlobalHeight();
    const velocity = getCurrentVelocity(); // Get velocity from worker
    const countryHeights = await redisService.getAllCountryHeights(); // Get all countries dynamically

    return {
      height,
      velocity,
      countryHeights,
    };
  }
}

export const gameService = new GameService();
