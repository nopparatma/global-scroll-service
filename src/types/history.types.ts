// Type definitions for history-related functionality

export type TimeRange = "1h" | "24h" | "7d" | "30d" | "1y" | "5y" | "all";
export type Granularity = "raw" | "5min" | "hourly" | "daily";

export interface HistoryDataPoint {
  time: Date;
  height: string; // BigInt as string to avoid overflow
  minHeight?: string;
  maxHeight?: string;
  sampleCount?: number;
}

export interface HistoryResponse {
  range: TimeRange;
  granularity: Granularity;
  dataPoints: number;
  startDate?: Date;
  endDate?: Date;
  data: HistoryDataPoint[];
}

export interface HistoryStats {
  peakHeight: string;
  peakDate: Date;
  totalGrowth: string;
  averageGrowthPerDay: string;
  currentHeight: string;
  daysTracked: number;
}

export interface AggregationStatus {
  lastRun: Date | null;
  nextRun: Date;
  status: "idle" | "running" | "error";
  recordsAggregated?: number;
  duration?: number; // in milliseconds
  error?: string;
}

// Retention configuration
export interface RetentionConfig {
  duration: number; // in milliseconds
  enabled: boolean;
}

export interface RetentionPolicy {
  raw: RetentionConfig;
  fiveMin: RetentionConfig;
  hourly: RetentionConfig;
  daily: RetentionConfig;
}
