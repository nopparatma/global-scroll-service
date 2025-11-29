import prisma from "../utils/prisma";
import { getTimeAgo } from "../utils/time.helpers";
import type {
  TimeRange,
  Granularity,
  HistoryResponse,
  HistoryDataPoint,
  HistoryStats,
} from "../types/history.types";

/**
 * Get historical height data for a given time range
 * Uses country history tables and sums all countries for global view
 */
export async function getHistory(range: TimeRange): Promise<HistoryResponse> {
  let granularity: Granularity;
  let data: HistoryDataPoint[];

  switch (range) {
    case "1h":
    case "24h":
    case "7d":
      // Use raw data for recent ranges
      granularity = "raw";
      data = await getRawHistory(range);
      break;

    case "30d":
    case "1y":
    case "5y":
    case "all":
      // Use daily aggregates for longer ranges
      granularity = "daily";
      data = await getDailyHistory(range);
      break;

    default:
      throw new Error(`Invalid time range: ${range}`);
  }

  const response: HistoryResponse = {
    range,
    granularity,
    dataPoints: data.length,
    data,
  };

  if (data.length > 0) {
    response.startDate = data[0].time;
    response.endDate = data[data.length - 1].time;
  }

  return response;
}

/**
 * Get raw historical data by summing all countries
 */
async function getRawHistory(
  range: "1h" | "24h" | "7d",
): Promise<HistoryDataPoint[]> {
  const since = getTimeAgo(range);
  if (!since) throw new Error("Invalid range for raw history");

  // Get all unique timestamps
  const timestamps = await prisma.transactionHistoryRaw.findMany({
    where: { recordedAt: { gte: since } },
    select: { recordedAt: true },
    distinct: ["recordedAt"],
    orderBy: { recordedAt: "asc" },
  });

  // For each timestamp, sum all country heights
  const data: HistoryDataPoint[] = [];
  for (const { recordedAt } of timestamps) {
    const records = await prisma.transactionHistoryRaw.findMany({
      where: { recordedAt },
      select: { height: true },
    });

    const totalHeight = records.reduce((sum, r) => sum + r.height, BigInt(0));
    data.push({
      time: recordedAt,
      height: totalHeight.toString(),
    });
  }

  return data;
}

/**
 * Get daily aggregated data by summing all countries
 */
async function getDailyHistory(
  range: "30d" | "1y" | "5y" | "all",
): Promise<HistoryDataPoint[]> {
  const since = getTimeAgo(range);

  // Get all unique dates
  const dates = await prisma.transactionHistoryDaily.findMany({
    where: since ? { recordedAt: { gte: since } } : undefined,
    select: { recordedAt: true },
    distinct: ["recordedAt"],
    orderBy: { recordedAt: "asc" },
  });

  // For each date, sum all country heights
  const data: HistoryDataPoint[] = [];
  for (const { recordedAt } of dates) {
    const records = await prisma.transactionHistoryDaily.findMany({
      where: { recordedAt },
      select: {
        height: true,
        minHeight: true,
        maxHeight: true,
        sampleCount: true,
      },
    });

    const totalHeight = records.reduce((sum, r) => sum + r.height, BigInt(0));
    const minHeight = records.reduce(
      (min, r) => (r.minHeight < min ? r.minHeight : min),
      records[0]?.minHeight || BigInt(0),
    );
    const maxHeight = records.reduce(
      (max, r) => (r.maxHeight > max ? r.maxHeight : max),
      records[0]?.maxHeight || BigInt(0),
    );
    const sampleCount = records.reduce((sum, r) => sum + r.sampleCount, 0);

    data.push({
      time: recordedAt,
      height: totalHeight.toString(),
      minHeight: minHeight.toString(),
      maxHeight: maxHeight.toString(),
      sampleCount,
    });
  }

  return data;
}

/**
 * Get statistical summary by aggregating country data
 */
export async function getStats(): Promise<HistoryStats> {
  // Get all daily records grouped by date
  const dailyData = await getDailyHistory("all");

  if (dailyData.length === 0) {
    throw new Error("Insufficient data for statistics");
  }

  // Find peak
  let peakHeight = BigInt(0);
  let peakDate = dailyData[0].time;

  for (const record of dailyData) {
    const maxHeight = BigInt(record.maxHeight || record.height);
    if (maxHeight > peakHeight) {
      peakHeight = maxHeight;
      peakDate = record.time;
    }
  }

  const first = dailyData[0];
  const latest = dailyData[dailyData.length - 1];

  const daysTracked = Math.ceil(
    (Date.now() - first.time.getTime()) / (24 * 60 * 60 * 1000),
  );

  const totalGrowth = BigInt(latest.height) - BigInt(first.height);
  const averageGrowthPerDay =
    daysTracked > 0 ? Number(totalGrowth) / daysTracked : 0;

  return {
    peakHeight: peakHeight.toString(),
    peakDate,
    totalGrowth: totalGrowth.toString(),
    averageGrowthPerDay: Math.round(averageGrowthPerDay).toString(),
    currentHeight: latest.height,
    daysTracked,
  };
}

/**
 * Get the latest height by summing all countries from raw data
 */
export async function getLatestHeight(): Promise<string> {
  // Get most recent timestamp
  const latestTimestamp = await prisma.transactionHistoryRaw.findFirst({
    orderBy: { recordedAt: "desc" },
    select: { recordedAt: true },
  });

  if (!latestTimestamp) {
    // Fallback to daily if no raw data
    const dailyLatest = await prisma.transactionHistoryDaily.findFirst({
      orderBy: { recordedAt: "desc" },
      select: { recordedAt: true },
    });

    if (!dailyLatest) {
      return "0";
    }

    // Sum all countries for that date
    const records = await prisma.transactionHistoryDaily.findMany({
      where: { recordedAt: dailyLatest.recordedAt },
      select: { height: true },
    });

    const total = records.reduce((sum, r) => sum + r.height, BigInt(0));
    return total.toString();
  }

  // Sum all countries for latest timestamp
  const records = await prisma.transactionHistoryRaw.findMany({
    where: { recordedAt: latestTimestamp.recordedAt },
    select: { height: true },
  });

  const total = records.reduce((sum, r) => sum + r.height, BigInt(0));
  return total.toString();
}
