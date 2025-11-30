import prisma from "../utils/prisma";
import logger from "../utils/logger";
import { average } from "../utils/time.helpers";
import type { RetentionPolicy } from "../types/history.types";

// Retention configuration for country-based history
const RETENTION_CONFIG: RetentionPolicy = {
  raw: {
    duration: 1 * 24 * 60 * 60 * 1000, // 1 days (keep raw data for a day)
    enabled: true,
  },
  daily: {
    duration: Infinity, // Infinite retention
    enabled: false, // No cleanup for daily data
  },
};

/**
 * Aggregate raw country data (30s) to daily data
 * Groups by day and country
 */
async function aggregateRawToDaily(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - RETENTION_CONFIG.raw.duration);

  logger.info("Starting Raw → Daily aggregation...");

  // Fetch raw records older than 24 hours
  const rawRecords = await prisma.transactionHistoryRaw.findMany({
    where: {
      recordedAt: {
        lt: oneDayAgo,
      },
    },
    orderBy: { recordedAt: "asc" },
  });

  if (rawRecords.length === 0) {
    logger.info("No raw records to aggregate");
    return 0;
  }

  logger.info(`Found ${rawRecords.length} raw records to aggregate`);

  // Group by country and day
  const dailyGroups: Record<
    string,
    Array<{ countryCode: string; height: bigint; recordedAt: Date }>
  > = {};

  for (const record of rawRecords) {
    const dayKey = `${record.countryCode}:${record.recordedAt.toISOString().split("T")[0]}`;
    if (!dailyGroups[dayKey]) {
      dailyGroups[dayKey] = [];
    }
    dailyGroups[dayKey].push(record);
  }

  let aggregated = 0;

  // Use transaction to ensure data integrity
  await prisma.$transaction(async (tx) => {
    // Create aggregated records
    for (const [dayKey, group] of Object.entries(dailyGroups)) {
      const countryCode = dayKey.split(":")[0];
      const heights = group.map((r) => Number(r.height));

      await tx.transactionHistoryDaily.create({
        data: {
          countryCode,
          recordedAt: group[0].recordedAt,
          height: BigInt(Math.round(average(heights))),
          minHeight: BigInt(Math.min(...heights)),
          maxHeight: BigInt(Math.max(...heights)),
          sampleCount: group.length,
        },
      });

      aggregated++;
    }

    // Delete aggregated raw records
    await tx.transactionHistoryRaw.deleteMany({
      where: {
        recordedAt: {
          lt: oneDayAgo,
        },
      },
    });
  });

  logger.info(`Aggregated ${aggregated} daily records from raw data`);
  return aggregated;
}

/**
 * Clean up old data according to retention policy
 * NOTE: Daily data has infinite retention (never deleted)
 */
async function cleanupOldData(): Promise<void> {
  logger.info("Starting cleanup of old data...");

  // Cleanup Raw table (older than 24h)
  if (RETENTION_CONFIG.raw.enabled) {
    const cutoff = new Date(Date.now() - RETENTION_CONFIG.raw.duration);
    const deleted = await prisma.transactionHistoryRaw.deleteMany({
      where: { recordedAt: { lt: cutoff } },
    });
    logger.info(`Cleaned up ${deleted.count} raw records older than 24h`);
  }

  // Daily table: Infinite retention (no cleanup)
  logger.info("Daily table: Infinite retention enabled (no cleanup)");
}

/**
 * Main aggregation function
 * Runs all aggregation stages sequentially
 */
export async function runAggregation(): Promise<void> {
  const startTime = Date.now();

  try {
    logger.info("=== Starting aggregation job ===");

    // Stage 1: Raw → Daily (for country data)
    const rawToDaily = await aggregateRawToDaily();

    // Stage 2: Cleanup old data
    await cleanupOldData();

    const duration = Date.now() - startTime;

    logger.info(
      `=== Aggregation completed in ${(duration / 1000).toFixed(1)}s ===`,
    );
    logger.info(`Total records aggregated: ${rawToDaily}`);
  } catch (error) {
    logger.error("Aggregation job failed", error);
    throw error;
  }
}
