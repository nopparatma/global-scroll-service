import { redisService } from "../services/redis.service";
import logger from "../utils/logger";
import prisma from "../utils/prisma";
const SYNC_INTERVAL = 30000; // 30 sec

export const startPersistenceWorker = () => {
  setInterval(async () => {
    try {
      // Sync Country Heights (includes global aggregate)
      const countryHeights = await redisService.getAllCountryHeights();

      if (Object.keys(countryHeights).length > 0) {
        // Batch insert country heights
        const countryData = Object.entries(countryHeights).map(
          ([countryCode, height]) => ({
            countryCode,
            height: BigInt(height),
          }),
        );

        await prisma.transactionHistoryRaw.createMany({
          data: countryData,
        });

        logger.info(`Synced ${countryData.length} country heights to DB`);
      }
    } catch (error) {
      logger.error("Persistence worker error", error);
    }
  }, SYNC_INTERVAL);
};
