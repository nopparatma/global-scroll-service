import { redisService } from "../services/redis.service";
import logger from "../utils/logger";

const GRAVITY_CHECK_INTERVAL = 1000; // 1 sec
const IDLE_THRESHOLD = 10000; // 10 sec
const GRAVITY_DECAY = 100; // px per tick

export const startGravityWorker = () => {
  setInterval(async () => {
    try {
      const lastActivity = await redisService.getLastActivity();
      const now = Date.now();

      if (now - lastActivity > IDLE_THRESHOLD) {
        const currentHeight = await redisService.getGlobalHeight();
        const heightValue = BigInt(currentHeight);

        if (heightValue > 0) {
          // Calculate decay amount: min(currentHeight, GRAVITY_DECAY)
          // Prevent height from going negative
          const decayAmount =
            heightValue >= BigInt(GRAVITY_DECAY)
              ? GRAVITY_DECAY
              : Number(heightValue);

          await redisService.decreaseGlobalHeight(decayAmount);

          const newHeight = Number(heightValue) - decayAmount;
          logger.debug(
            `Gravity applied: -${decayAmount}px (${Number(heightValue)} → ${newHeight})`,
          );
        }
      }
    } catch (error) {
      logger.error("Gravity worker error", error);
    }
  }, GRAVITY_CHECK_INTERVAL);
};
