import { Router } from "express";
import {
  getHistory,
  getStats,
  getLatestHeight,
} from "../services/history.service";
import {
  getCountryHistory,
  getCountryRankings,
  getCountryStats,
  getCountryLatestHeight,
  compareCountries,
} from "../services/country-history.service";
import logger from "../utils/logger";
import type { TimeRange } from "../types/history.types";
import {
  VALID_TIME_RANGES,
  COUNTRY_CODE_REGEX,
  MAX_COUNTRIES_COMPARISON,
} from "../constants/validation";

const router = Router();

/**
 * GET /api/history?range=1h|24h|7d|30d|1y|5y|all
 * Get historical height data for a given time range
 */
router.get("/history", async (req, res) => {
  try {
    const range = (req.query.range as TimeRange) || "24h";

    // Validate range
    if (!VALID_TIME_RANGES.includes(range)) {
      return res.status(400).json({
        error: "Invalid range parameter",
        validRanges: VALID_TIME_RANGES,
      });
    }

    const data = await getHistory(range);

    res.json(data);
  } catch (error) {
    logger.error("Failed to fetch history", error);
    res.status(500).json({
      error: "Failed to fetch historical data",
    });
  }
});

/**
 * GET /api/history/stats
 * Get statistical summary (peak, growth, etc.)
 */
router.get("/history/stats", async (_req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (error) {
    logger.error("Failed to fetch stats", error);

    // Return empty stats if no data
    if (error instanceof Error && error.message.includes("Insufficient data")) {
      return res.json({
        peakHeight: "0",
        peakDate: new Date(),
        totalGrowth: "0",
        averageGrowthPerDay: "0",
        currentHeight: "0",
        daysTracked: 0,
      });
    }

    res.status(500).json({
      error: "Failed to fetch statistics",
    });
  }
});

/**
 * GET /api/history/latest
 * Get the latest height value
 */
router.get("/history/latest", async (_req, res) => {
  try {
    const height = await getLatestHeight();
    res.json({ height });
  } catch (error) {
    logger.error("Failed to fetch latest height", error);
    res.status(500).json({
      error: "Failed to fetch latest height",
    });
  }
});

/**
 * GET /api/countries/rankings
 * Get country leaderboard
 */
router.get("/countries/rankings", async (_req, res) => {
  try {
    const rankings = await getCountryRankings();
    res.json({ rankings });
  } catch (error) {
    logger.error("Failed to fetch country rankings", error);
    res.status(500).json({
      error: "Failed to fetch country rankings",
      rankings: [],
    });
  }
});

/**
 * GET /api/countries/:countryCode/history?range=1h|24h|7d|30d|1y|5y|all
 * Get historical height data for a specific country
 */
router.get("/countries/:countryCode/history", async (req, res) => {
  try {
    const { countryCode } = req.params;
    const range = (req.query.range as TimeRange) || "24h";

    // Validate range
    if (!VALID_TIME_RANGES.includes(range)) {
      return res.status(400).json({
        error: "Invalid range parameter",
        validRanges: VALID_TIME_RANGES,
      });
    }

    // Validate country code (2 letters)
    if (!COUNTRY_CODE_REGEX.test(countryCode)) {
      return res.status(400).json({
        error:
          "Invalid country code format. Must be 2-letter ISO code (e.g., TH, US)",
      });
    }

    const data = await getCountryHistory(countryCode.toUpperCase(), range);
    res.json(data);
  } catch (error) {
    logger.error("Failed to fetch country history", error);
    res.status(500).json({
      error: "Failed to fetch country historical data",
    });
  }
});

/**
 * GET /api/countries/:countryCode/stats
 * Get statistics for a specific country
 */
router.get("/countries/:countryCode/stats", async (req, res) => {
  try {
    const { countryCode } = req.params;

    // Validate country code
    if (!COUNTRY_CODE_REGEX.test(countryCode)) {
      return res.status(400).json({
        error: "Invalid country code format",
      });
    }

    const stats = await getCountryStats(countryCode.toUpperCase());
    res.json(stats);
  } catch (error) {
    logger.error("Failed to fetch country stats", error);

    if (error instanceof Error && error.message.includes("Insufficient data")) {
      return res.status(404).json({
        error: `No data found for country ${req.params.countryCode}`,
      });
    }

    res.status(500).json({
      error: "Failed to fetch country statistics",
    });
  }
});

/**
 * GET /api/countries/:countryCode/latest
 * Get the latest height for a specific country
 */
router.get("/countries/:countryCode/latest", async (req, res) => {
  try {
    const { countryCode } = req.params;

    // Validate country code
    if (!COUNTRY_CODE_REGEX.test(countryCode)) {
      return res.status(400).json({
        error: "Invalid country code format",
      });
    }

    const height = await getCountryLatestHeight(countryCode.toUpperCase());
    res.json({ countryCode: countryCode.toUpperCase(), height });
  } catch (error) {
    logger.error("Failed to fetch country latest height", error);
    res.status(500).json({
      error: "Failed to fetch latest height",
    });
  }
});

/**
 * POST /api/countries/compare
 * Compare multiple countries over a time range
 * Body: { countryCodes: string[], range: TimeRange }
 */
router.post("/countries/compare", async (req, res) => {
  try {
    const { countryCodes, range = "24h" } = req.body;

    if (!Array.isArray(countryCodes) || countryCodes.length === 0) {
      return res.status(400).json({
        error: "countryCodes must be a non-empty array",
      });
    }

    if (countryCodes.length > MAX_COUNTRIES_COMPARISON) {
      return res.status(400).json({
        error: `Maximum ${MAX_COUNTRIES_COMPARISON} countries can be compared at once`,
      });
    }

    // Validate all country codes
    const invalidCodes = countryCodes.filter(
      (code) => !COUNTRY_CODE_REGEX.test(code),
    );
    if (invalidCodes.length > 0) {
      return res.status(400).json({
        error: "Invalid country codes",
        invalidCodes,
      });
    }

    // Validate range
    if (!VALID_TIME_RANGES.includes(range)) {
      return res.status(400).json({
        error: "Invalid range parameter",
        validRanges: VALID_TIME_RANGES,
      });
    }

    const upperCaseCodes = countryCodes.map((code) => code.toUpperCase());
    const comparison = await compareCountries(upperCaseCodes, range);

    res.json({
      range,
      countries: comparison,
    });
  } catch (error) {
    logger.error("Failed to compare countries", error);
    res.status(500).json({
      error: "Failed to compare countries",
    });
  }
});

export default router;
