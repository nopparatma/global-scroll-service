import { TimeRange } from "../types/history.types";

/**
 * Convert time range to Date object representing how far back to query
 * @param range Time range string
 * @returns Date object or null for 'all'
 */
export function getTimeAgo(range: TimeRange): Date | null {
  const now = Date.now();

  switch (range) {
    case "1h":
      return new Date(now - 60 * 60 * 1000);
    case "24h":
      return new Date(now - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case "1y":
      return new Date(now - 365 * 24 * 60 * 60 * 1000);
    case "5y":
      return new Date(now - 5 * 365 * 24 * 60 * 60 * 1000);
    case "all":
      return null; // No time limit
    default:
      throw new Error(`Invalid time range: ${range}`);
  }
}

/**
 * Group records by time interval
 * @param records Array of records with recordedAt field
 * @param intervalMs Interval in milliseconds
 * @returns Array of grouped records
 */
export function groupByTimeInterval<T extends { recordedAt: Date }>(
  records: T[],
  intervalMs: number,
): T[][] {
  if (records.length === 0) return [];

  const groups: T[][] = [];
  let currentGroup: T[] = [];
  let groupStart: number = 0;

  for (const record of records) {
    const recordTime = record.recordedAt.getTime();

    if (currentGroup.length === 0) {
      // Start new group
      groupStart = recordTime;
      currentGroup.push(record);
    } else if (recordTime - groupStart < intervalMs) {
      // Add to current group
      currentGroup.push(record);
    } else {
      // Save current group and start new one
      groups.push(currentGroup);
      currentGroup = [record];
      groupStart = recordTime;
    }
  }

  // Don't forget the last group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Round down time to the nearest interval
 * @param date Date to truncate
 * @param intervalMs Interval in milliseconds
 * @returns Truncated date
 */
export function truncateToInterval(date: Date, intervalMs: number): Date {
  const timestamp = date.getTime();
  const truncated = Math.floor(timestamp / intervalMs) * intervalMs;
  return new Date(truncated);
}

/**
 * Calculate the next scheduled time for a given interval
 * @param intervalMs Interval in milliseconds
 * @returns Next interval date
 */
export function getNextInterval(intervalMs: number): Date {
  const now = Date.now();
  const nextTime = Math.ceil(now / intervalMs) * intervalMs;
  return new Date(nextTime);
}

/**
 * Format duration in milliseconds to human-readable string
 * @param ms Duration in milliseconds
 * @returns Formatted string (e.g., "2.5s", "1.2m", "3.4h")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else if (ms < 3600000) {
    return `${(ms / 60000).toFixed(1)}m`;
  } else {
    return `${(ms / 3600000).toFixed(1)}h`;
  }
}

/**
 * Calculate average of numbers
 * @param numbers Array of numbers
 * @returns Average value
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Calculate weighted average from aggregated records
 * @param records Array of records with avgHeight and sampleCount
 * @returns Weighted average
 */
export function weightedAverage(
  records: Array<{ height: bigint; sampleCount: number }>,
): number {
  if (records.length === 0) return 0;

  const totalSamples = records.reduce((sum, r) => sum + r.sampleCount, 0);
  if (totalSamples === 0) return 0;

  const weightedSum = records.reduce(
    (sum, r) => sum + Number(r.height) * r.sampleCount,
    0,
  );

  return weightedSum / totalSamples;
}
