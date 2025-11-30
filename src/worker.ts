import { redisService } from "./services/redis.service";
import { startPersistenceWorker } from "./workers/persistence.worker";
import { startGravityWorker } from "./workers/gravity.worker";
import { startGlobalHeightWorker } from "./workers/global-height.worker";
import { runAggregation } from "./workers/aggregation.worker";
import cron from "node-cron";
import logger from "./utils/logger";
import { env } from "./config/env";

async function startWorker() {
  try {
    logger.info("Starting Worker Process...");

    // Connect to Redis
    await redisService.connect();

    // Start Background Workers
    startGlobalHeightWorker(); // Calculate global height from country heights
    startPersistenceWorker(); // Sync Redis → PostgreSQL
    startGravityWorker(); // Apply gravity when idle

    // Schedule aggregation job (configurable via AGGREGATION_CRON_SCHEDULE)
    const cronSchedule = env.AGGREGATION_CRON_SCHEDULE;
    cron.schedule(cronSchedule, async () => {
      logger.info("Starting scheduled aggregation...");
      try {
        await runAggregation();
        logger.info("Scheduled aggregation completed successfully");
      } catch (error) {
        logger.error("Scheduled aggregation failed", error);
      }
    });

    logger.info(`Aggregation cron job scheduled: ${cronSchedule}`);
    logger.info("Worker process started successfully");

    // Graceful Shutdown
    const shutdown = async () => {
      logger.info("Shutting down worker...");
      await redisService.disconnect();
      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("Failed to start worker", error);
    process.exit(1);
  }
}

startWorker();
