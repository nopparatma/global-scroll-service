import { redisService } from "../services/redis.service";
import logger from "../utils/logger";
import prisma from "../utils/prisma";
const SYNC_INTERVAL = 30000; // 30 sec

export const startPersistenceWorker = () => {
  setInterval(async () => {
    try {
      const height = await redisService.getGlobalHeight();

      await prisma.globalHistory.create({
        data: {
          height: BigInt(height),
        },
      });

      logger.info(`Synced global height to DB: ${height}`);
    } catch (error) {
      logger.error("Persistence worker error", error);
    }
  }, SYNC_INTERVAL);
};
