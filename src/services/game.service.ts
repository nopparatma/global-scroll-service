import { redisService } from "./redis.service";
import { getCurrentVelocity } from "../workers/global-height.worker";
import logger from "../utils/logger";
import {
  pixelsToMillimeters,
  MAX_VELOCITY_MM_PER_SECOND,
} from "../config/game.constants";

class GameService {
  async processScrollBatch(
    userId: string,
    countryCode: string,
    deltaPixels: number,
    timeSinceLastBatch: number,
  ) {
    // 1. Convert pixels to millimeters
    const deltaMillimeters = pixelsToMillimeters(deltaPixels);

    // 2. Anti-Cheat: Velocity Check (in mm/s)
    const velocityMmPerSec = (deltaMillimeters / timeSinceLastBatch) * 1000;
    if (velocityMmPerSec > MAX_VELOCITY_MM_PER_SECOND) {
      logger.warn(
        `Suspicious activity from ${userId}: Velocity ${velocityMmPerSec.toFixed(2)} mm/s (${(velocityMmPerSec / 1000).toFixed(2)} m/s)`,
      );
      return null; // Reject
    }

    // 3. Update Redis (only country height in millimeters, global height calculated by worker)
    await redisService.incrementCountryHeight(countryCode, deltaMillimeters);
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
