import { redisService } from "../services/redis.service";
import logger from "../utils/logger";
import {
  GLOBAL_HEIGHT_SYNC_INTERVAL_MS,
  VELOCITY_WINDOW_SECONDS,
} from "../config/game.constants";

let previousHeight = "0";
let currentVelocity = 0; // Store velocity in memory

export const startGlobalHeightWorker = () => {
  setInterval(async () => {
    try {
      // 1. Calculate global height (in millimeters) from all country heights
      const globalHeightMm =
        await redisService.calculateGlobalHeightFromCountries();

      // 2. Calculate velocity based on height change (in mm/s)
      const currentHeight = BigInt(globalHeightMm);
      const prevHeight = BigInt(previousHeight);
      const heightDelta = currentHeight - prevHeight;

      // Convert to millimeters per second
      currentVelocity = Number(heightDelta) / VELOCITY_WINDOW_SECONDS;

      // 3. Update Redis with new global height (in millimeters)
      await redisService.setGlobalHeight(globalHeightMm);

      // 4. Store current height for next iteration
      previousHeight = globalHeightMm;

      logger.debug(
        `Global height updated: ${globalHeightMm}mm = ${(Number(globalHeightMm) / 10).toFixed(2)}cm = ${(Number(globalHeightMm) / 1000).toFixed(2)}m (Δ${heightDelta}mm, velocity: ${currentVelocity.toFixed(2)} mm/s = ${(currentVelocity / 1000).toFixed(2)} m/s)`,
      );
    } catch (error) {
      logger.error("Global height worker error", error);
    }
  }, GLOBAL_HEIGHT_SYNC_INTERVAL_MS);

  logger.info(
    `Global height worker started (${GLOBAL_HEIGHT_SYNC_INTERVAL_MS}ms interval)`,
  );
};

// Export getter for velocity
export const getCurrentVelocity = (): number => {
  return Math.round(currentVelocity);
};
