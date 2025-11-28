import { redisService } from "./services/redis.service";
import { startPersistenceWorker } from "./workers/persistence.worker";
import { startGravityWorker } from "./workers/gravity.worker";
import logger from "./utils/logger";

async function startWorker() {
  try {
    logger.info("Starting Worker Process...");

    // Connect to Redis
    await redisService.connect();

    // Start Background Workers
    startPersistenceWorker(); // Sync Redis → PostgreSQL
    startGravityWorker(); // Apply gravity when idle

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
