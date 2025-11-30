import { redisService } from "../services/redis.service";
import logger from "../utils/logger";
import prisma from "../utils/prisma";
const SYNC_INTERVAL = 30000; // 30 sec

export const startPersistenceWorker = () => {
  setInterval(async () => {
    try {
      // Sync Country Heights (includes global aggregate)
      const countryHeights = await redisService.getAllCountryHeights();

      // Always insert records, even if all heights are 0
      // This ensures continuous data collection for analytics
      const countryData = Object.entries(countryHeights).map(
        ([countryCode, height]) => ({
          countryCode,
          height: BigInt(height),
        }),
      );

      if (countryData.length > 0) {
        await prisma.transactionHistoryRaw.createMany({
          data: countryData,
        });

        logger.info(`Synced ${countryData.length} country heights to DB`);
      } else {
        logger.debug(
          "No country data to sync (no countries have scrolled yet)",
        );
      }
    } catch (error) {
      logger.error("Persistence worker error", error);
    }
  }, SYNC_INTERVAL);
};
