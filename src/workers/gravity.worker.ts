import { redisService } from "../services/redis.service";
import logger from "../utils/logger";
import {
  GRAVITY_CHECK_INTERVAL_MS,
  COUNTRY_IDLE_THRESHOLD_MS,
  GRAVITY_DECAY_CM_PER_TICK,
} from "../config/game.constants";

export const startGravityWorker = () => {
  setInterval(async () => {
    try {
      const now = Date.now();

      // Get all countries and their heights
      const countryHeights = await redisService.getAllCountryHeights();

      if (Object.keys(countryHeights).length === 0) {
        return; // No countries to process
      }

      // Get all country last activities
      const countryActivities =
        await redisService.getAllCountryLastActivities();

      let affectedCountries = 0;

      // Check each country individually
      for (const [countryCode, height] of Object.entries(countryHeights)) {
        const heightValue = parseInt(height, 10);

        if (heightValue <= 0) continue; // Skip countries with 0 height

        const lastActivity = countryActivities[countryCode] || 0;
        const idleTime = now - lastActivity;

        // Apply gravity if country has been idle > threshold
        if (idleTime > COUNTRY_IDLE_THRESHOLD_MS) {
          await redisService.decreaseCountryHeight(
            countryCode,
            GRAVITY_DECAY_CM_PER_TICK,
          );
          affectedCountries++;
        }
      }

      if (affectedCountries > 0) {
        logger.debug(
          `Gravity applied to ${affectedCountries} countries (-${GRAVITY_DECAY_CM_PER_TICK}cm = -${GRAVITY_DECAY_CM_PER_TICK / 100}m each)`,
        );
      }
    } catch (error) {
      logger.error("Gravity worker error", error);
    }
  }, GRAVITY_CHECK_INTERVAL_MS);
};
