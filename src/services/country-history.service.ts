import prisma from "../utils/prisma";
import logger from "../utils/logger";
import { getTimeAgo } from "../utils/time.helpers";
import type { TimeRange, Granularity } from "../types/history.types";

export interface CountryHistoryDataPoint {
  time: Date;
  height: string;
  minHeight?: string;
  maxHeight?: string;
  sampleCount?: number;
}

export interface CountryHistoryResponse {
  countryCode: string;
  range: TimeRange;
  granularity: Granularity;
  dataPoints: number;
  data: CountryHistoryDataPoint[];
  startDate?: Date;
  endDate?: Date;
}

export interface CountryRankingItem {
  countryCode: string;
  height: string;
  rank: number;
}

export interface CountryStats {
  countryCode: string;
  currentHeight: string;
  peakHeight: string;
  peakDate: Date;
  totalGrowth: string;
  averageGrowthPerDay: string;
  daysTracked: number;
  globalRank: number;
}

/**
 * Get historical height data for a specific country
 */
export async function getCountryHistory(
  countryCode: string,
  range: TimeRange,
): Promise<CountryHistoryResponse> {
  let granularity: Granularity;
  let data: CountryHistoryDataPoint[];

  switch (range) {
    case "1h":
    case "24h":
    case "7d":
      // Use raw data for 1h, 24h, 7d (retention: 7 days)
      granularity = "raw";
      data = await getCountryRawHistory(countryCode, range);
      break;

    case "30d":
    case "1y":
    case "5y":
    case "all":
      // Use daily aggregates for longer ranges
      granularity = "daily";
      data = await getCountryDailyHistory(countryCode, range);
      break;

    default:
      throw new Error(`Invalid time range: ${range}`);
  }

  const response: CountryHistoryResponse = {
    countryCode,
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
 * Get raw historical data for a country
 */
async function getCountryRawHistory(
  countryCode: string,
  range: "1h" | "24h" | "7d",
): Promise<CountryHistoryDataPoint[]> {
  const since = getTimeAgo(range);
  if (!since) throw new Error("Invalid range for raw history");

  const records = await prisma.transactionHistoryRaw.findMany({
    where: {
      countryCode,
      recordedAt: { gte: since },
    },
    orderBy: { recordedAt: "asc" },
  });

  return records.map((r) => ({
    time: r.recordedAt,
    height: r.height.toString(),
  }));
}

/**
 * Get daily aggregated data for a country
 */
async function getCountryDailyHistory(
  countryCode: string,
  range: "30d" | "1y" | "5y" | "all",
): Promise<CountryHistoryDataPoint[]> {
  const since = getTimeAgo(range);

  const records = await prisma.transactionHistoryDaily.findMany({
    where: {
      countryCode,
      ...(since ? { recordedAt: { gte: since } } : {}),
    },
    orderBy: { recordedAt: "asc" },
  });

  return records.map((r) => ({
    time: r.recordedAt,
    height: r.height.toString(),
    minHeight: r.minHeight.toString(),
    maxHeight: r.maxHeight.toString(),
    sampleCount: r.sampleCount,
  }));
}

/**
 * Get country rankings (leaderboard)
 * Based on latest daily data
 */
export async function getCountryRankings(): Promise<CountryRankingItem[]> {
  // Get latest date
  const latestRecord = await prisma.transactionHistoryDaily.findFirst({
    orderBy: { recordedAt: "desc" },
    select: { recordedAt: true },
  });

  if (!latestRecord) {
    return [];
  }

  // Get all countries for the latest date
  const records = await prisma.transactionHistoryDaily.findMany({
    where: {
      recordedAt: latestRecord.recordedAt,
    },
    orderBy: { height: "desc" },
    select: {
      countryCode: true,
      height: true,
    },
  });

  return records.map((record, index) => ({
    countryCode: record.countryCode,
    height: record.height.toString(),
    rank: index + 1,
  }));
}

/**
 * Get statistics for a specific country
 */
export async function getCountryStats(
  countryCode: string,
): Promise<CountryStats> {
  // Get peak from daily data
  const peak = await prisma.transactionHistoryDaily.findFirst({
    where: { countryCode },
    orderBy: { maxHeight: "desc" },
    select: {
      maxHeight: true,
      recordedAt: true,
    },
  });

  // Get first and latest records
  const first = await prisma.transactionHistoryDaily.findFirst({
    where: { countryCode },
    orderBy: { recordedAt: "asc" },
    select: { height: true, recordedAt: true },
  });

  const latest = await prisma.transactionHistoryDaily.findFirst({
    where: { countryCode },
    orderBy: { recordedAt: "desc" },
    select: { height: true },
  });

  if (!peak || !first || !latest) {
    throw new Error(`Insufficient data for country ${countryCode}`);
  }

  const daysTracked = Math.ceil(
    (Date.now() - first.recordedAt.getTime()) / (24 * 60 * 60 * 1000),
  );

  const totalGrowth = Number(latest.height) - Number(first.height);
  const averageGrowthPerDay = daysTracked > 0 ? totalGrowth / daysTracked : 0;

  // Get global rank
  const rankings = await getCountryRankings();
  const rankItem = rankings.find((r) => r.countryCode === countryCode);
  const globalRank = rankItem?.rank || 0;

  return {
    countryCode,
    currentHeight: latest.height.toString(),
    peakHeight: peak.maxHeight.toString(),
    peakDate: peak.recordedAt,
    totalGrowth: totalGrowth.toString(),
    averageGrowthPerDay: Math.round(averageGrowthPerDay).toString(),
    daysTracked,
    globalRank,
  };
}

/**
 * Get latest height for a specific country from raw data
 */
export async function getCountryLatestHeight(
  countryCode: string,
): Promise<string> {
  const latest = await prisma.transactionHistoryRaw.findFirst({
    where: { countryCode },
    orderBy: { recordedAt: "desc" },
    select: { height: true },
  });

  if (!latest) {
    // Fallback to daily if no raw data
    const dailyLatest = await prisma.transactionHistoryDaily.findFirst({
      where: { countryCode },
      orderBy: { recordedAt: "desc" },
      select: { height: true },
    });

    if (!dailyLatest) {
      return "0";
    }

    return dailyLatest.height.toString();
  }

  return latest.height.toString();
}

/**
 * Compare multiple countries over a time range
 */
export async function compareCountries(
  countryCodes: string[],
  range: TimeRange,
): Promise<Record<string, CountryHistoryResponse>> {
  const results: Record<string, CountryHistoryResponse> = {};

  for (const countryCode of countryCodes) {
    try {
      results[countryCode] = await getCountryHistory(countryCode, range);
    } catch (error) {
      // Skip countries with no data
      logger.debug(`No data found for country ${countryCode}:`, error);
      continue;
    }
  }

  return results;
}
