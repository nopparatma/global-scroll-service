/**
 * Unit Tests for validation.ts
 * Testing validation constants and regex patterns
 * Target: 100% coverage
 */

import {
  VALID_TIME_RANGES,
  COUNTRY_CODE_REGEX,
  MAX_COUNTRIES_COMPARISON,
} from "../../../src/constants/validation";

describe("validation constants", () => {
  describe("VALID_TIME_RANGES", () => {
    it("should contain all expected time ranges", () => {
      expect(VALID_TIME_RANGES).toEqual([
        "1h",
        "24h",
        "7d",
        "30d",
        "1y",
        "5y",
        "all",
      ]);
    });

    it("should have 7 time ranges", () => {
      expect(VALID_TIME_RANGES).toHaveLength(7);
    });

    it("should include short-term ranges", () => {
      expect(VALID_TIME_RANGES).toContain("1h");
      expect(VALID_TIME_RANGES).toContain("24h");
    });

    it("should include medium-term ranges", () => {
      expect(VALID_TIME_RANGES).toContain("7d");
      expect(VALID_TIME_RANGES).toContain("30d");
    });

    it("should include long-term ranges", () => {
      expect(VALID_TIME_RANGES).toContain("1y");
      expect(VALID_TIME_RANGES).toContain("5y");
    });

    it("should include unlimited range", () => {
      expect(VALID_TIME_RANGES).toContain("all");
    });

    it("should be in logical order", () => {
      const order = ["1h", "24h", "7d", "30d", "1y", "5y", "all"];
      expect(VALID_TIME_RANGES).toEqual(order);
    });
  });

  describe("COUNTRY_CODE_REGEX", () => {
    describe("Valid country codes (ISO 3166-1 alpha-2)", () => {
      it("should match uppercase 2-letter codes", () => {
        expect(COUNTRY_CODE_REGEX.test("TH")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("US")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("JP")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("DE")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("GB")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("FR")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("CN")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("KR")).toBe(true);
      });

      it("should match lowercase 2-letter codes (case insensitive)", () => {
        expect(COUNTRY_CODE_REGEX.test("th")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("us")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("jp")).toBe(true);
      });

      it("should match mixed case codes", () => {
        expect(COUNTRY_CODE_REGEX.test("Th")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("tH")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("Us")).toBe(true);
      });

      it("should match unknown country code", () => {
        expect(COUNTRY_CODE_REGEX.test("XX")).toBe(true);
      });

      it("should match all valid letter combinations", () => {
        expect(COUNTRY_CODE_REGEX.test("AA")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("ZZ")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("AB")).toBe(true);
        expect(COUNTRY_CODE_REGEX.test("YZ")).toBe(true);
      });
    });

    describe("Invalid country codes", () => {
      it("should reject empty string", () => {
        expect(COUNTRY_CODE_REGEX.test("")).toBe(false);
      });

      it("should reject single character", () => {
        expect(COUNTRY_CODE_REGEX.test("T")).toBe(false);
        expect(COUNTRY_CODE_REGEX.test("U")).toBe(false);
      });

      it("should reject three characters", () => {
        expect(COUNTRY_CODE_REGEX.test("USA")).toBe(false);
        expect(COUNTRY_CODE_REGEX.test("THA")).toBe(false);
        expect(COUNTRY_CODE_REGEX.test("JPN")).toBe(false);
      });

      it("should reject numbers", () => {
        expect(COUNTRY_CODE_REGEX.test("12")).toBe(false);
        expect(COUNTRY_CODE_REGEX.test("T1")).toBe(false);
        expect(COUNTRY_CODE_REGEX.test("1T")).toBe(false);
      });

      it("should reject special characters", () => {
        expect(COUNTRY_CODE_REGEX.test("T$")).toBe(false);
        expect(COUNTRY_CODE_REGEX.test("U@")).toBe(false);
        expect(COUNTRY_CODE_REGEX.test("T-")).toBe(false);
        expect(COUNTRY_CODE_REGEX.test("U_")).toBe(false);
      });

      it("should reject codes with spaces", () => {
        expect(COUNTRY_CODE_REGEX.test("T H")).toBe(false);
        expect(COUNTRY_CODE_REGEX.test(" TH")).toBe(false);
        expect(COUNTRY_CODE_REGEX.test("TH ")).toBe(false);
      });

      it("should reject longer strings", () => {
        expect(COUNTRY_CODE_REGEX.test("THAILAND")).toBe(false);
        expect(COUNTRY_CODE_REGEX.test("UNITED STATES")).toBe(false);
      });

      it("should reject null and undefined", () => {
        expect(COUNTRY_CODE_REGEX.test(null as unknown as string)).toBe(false);
        expect(COUNTRY_CODE_REGEX.test(undefined as unknown as string)).toBe(
          false,
        );
      });
    });

    describe("Edge cases", () => {
      it("should handle strings with extra whitespace", () => {
        expect(COUNTRY_CODE_REGEX.test(" TH")).toBe(false);
        expect(COUNTRY_CODE_REGEX.test("TH ")).toBe(false);
        expect(COUNTRY_CODE_REGEX.test(" TH ")).toBe(false);
      });

      it("should handle strings with unicode characters", () => {
        expect(COUNTRY_CODE_REGEX.test("ไท")).toBe(false); // Thai characters
        expect(COUNTRY_CODE_REGEX.test("中国")).toBe(false); // Chinese characters
      });

      it("should be case insensitive due to /i flag", () => {
        const testCodes = ["th", "TH", "Th", "tH"];
        testCodes.forEach((code) => {
          expect(COUNTRY_CODE_REGEX.test(code)).toBe(true);
        });
      });
    });

    describe("Real-world country codes", () => {
      it("should match common country codes", () => {
        const commonCodes = [
          "TH", // Thailand
          "US", // United States
          "GB", // United Kingdom
          "DE", // Germany
          "FR", // France
          "JP", // Japan
          "CN", // China
          "IN", // India
          "BR", // Brazil
          "CA", // Canada
          "AU", // Australia
          "KR", // South Korea
          "IT", // Italy
          "ES", // Spain
          "MX", // Mexico
        ];

        commonCodes.forEach((code) => {
          expect(COUNTRY_CODE_REGEX.test(code)).toBe(true);
        });
      });

      it("should match all letters A-Z", () => {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let i = 0; i < alphabet.length; i++) {
          for (let j = 0; j < alphabet.length; j++) {
            const code = alphabet[i] + alphabet[j];
            expect(COUNTRY_CODE_REGEX.test(code)).toBe(true);
          }
        }
      });
    });
  });

  describe("MAX_COUNTRIES_COMPARISON", () => {
    it("should be defined", () => {
      expect(MAX_COUNTRIES_COMPARISON).toBeDefined();
    });

    it("should be a positive number", () => {
      expect(MAX_COUNTRIES_COMPARISON).toBeGreaterThan(0);
    });

    it("should equal 10", () => {
      expect(MAX_COUNTRIES_COMPARISON).toBe(10);
    });

    it("should be a reasonable limit for API queries", () => {
      expect(MAX_COUNTRIES_COMPARISON).toBeGreaterThanOrEqual(5);
      expect(MAX_COUNTRIES_COMPARISON).toBeLessThanOrEqual(100);
    });

    it("should be an integer", () => {
      expect(Number.isInteger(MAX_COUNTRIES_COMPARISON)).toBe(true);
    });
  });

  describe("Integration: Validation workflow", () => {
    it("should validate time range is in valid list", () => {
      const timeRange = "24h";
      expect(
        VALID_TIME_RANGES.includes(
          timeRange as (typeof VALID_TIME_RANGES)[number],
        ),
      ).toBe(true);
    });

    it("should reject invalid time range", () => {
      const timeRange = "48h";
      expect(
        VALID_TIME_RANGES.includes(
          timeRange as (typeof VALID_TIME_RANGES)[number],
        ),
      ).toBe(false);
    });

    it("should validate country code format", () => {
      const countryCode = "TH";
      expect(COUNTRY_CODE_REGEX.test(countryCode)).toBe(true);
    });

    it("should reject invalid country code format", () => {
      const countryCode = "THAILAND";
      expect(COUNTRY_CODE_REGEX.test(countryCode)).toBe(false);
    });

    it("should validate country comparison count", () => {
      const countriesToCompare = ["TH", "US", "JP"];
      expect(countriesToCompare.length).toBeLessThanOrEqual(
        MAX_COUNTRIES_COMPARISON,
      );
    });

    it("should reject too many countries for comparison", () => {
      const countriesToCompare = Array(15).fill("TH");
      expect(countriesToCompare.length).toBeGreaterThan(
        MAX_COUNTRIES_COMPARISON,
      );
    });
  });

  describe("Type safety", () => {
    it("should ensure VALID_TIME_RANGES is readonly array", () => {
      expect(Array.isArray(VALID_TIME_RANGES)).toBe(true);
    });

    it("should ensure COUNTRY_CODE_REGEX is RegExp", () => {
      expect(COUNTRY_CODE_REGEX).toBeInstanceOf(RegExp);
    });

    it("should ensure MAX_COUNTRIES_COMPARISON is number", () => {
      expect(typeof MAX_COUNTRIES_COMPARISON).toBe("number");
    });
  });
});
