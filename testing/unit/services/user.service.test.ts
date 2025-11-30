/**
 * Unit Tests for user.service.ts
 * Testing user management and GeoIP integration
 * Target: >95% coverage
 */

import { mockPrismaClient } from "../../mocks/prisma.mock";
import {
  TEST_USER,
  TEST_DEVICE_IDS,
  TEST_COUNTRY_CODES,
} from "../../fixtures/test-data";

// Mock Prisma
jest.mock("../../../src/utils/prisma", () => ({
  __esModule: true,
  default: mockPrismaClient,
}));

// Mock logger
jest.mock("../../../src/utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { userService } from "../../../src/services/user.service";
import logger from "../../../src/utils/logger";

describe("UserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findOrCreateByDeviceId", () => {
    describe("Finding existing users", () => {
      it("should return existing user when found", async () => {
        mockPrismaClient.user.findUnique.mockResolvedValue(TEST_USER);

        const result = await userService.findOrCreateByDeviceId(
          TEST_DEVICE_IDS.DEVICE_1,
          TEST_COUNTRY_CODES.THAILAND,
        );

        expect(result).toEqual(TEST_USER);
        expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
          where: { deviceId: TEST_DEVICE_IDS.DEVICE_1 },
        });
        expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
      });

      it("should not log info when user already exists", async () => {
        mockPrismaClient.user.findUnique.mockResolvedValue(TEST_USER);

        await userService.findOrCreateByDeviceId(
          TEST_DEVICE_IDS.DEVICE_1,
          TEST_COUNTRY_CODES.THAILAND,
        );

        expect(logger.info).not.toHaveBeenCalled();
      });

      it("should find user regardless of country code provided", async () => {
        mockPrismaClient.user.findUnique.mockResolvedValue(TEST_USER);

        // Provide different country code than stored
        const result = await userService.findOrCreateByDeviceId(
          TEST_DEVICE_IDS.DEVICE_1,
          TEST_COUNTRY_CODES.USA, // Different from TEST_USER.countryCode
        );

        expect(result.countryCode).toBe(TEST_COUNTRY_CODES.THAILAND); // Original country
      });
    });

    describe("Creating new users", () => {
      beforeEach(() => {
        mockPrismaClient.user.findUnique.mockResolvedValue(null);
      });

      it("should create new user when not found", async () => {
        const newUser = {
          id: "new-user-id",
          deviceId: TEST_DEVICE_IDS.DEVICE_2,
          countryCode: TEST_COUNTRY_CODES.USA,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrismaClient.user.create.mockResolvedValue(newUser);

        const result = await userService.findOrCreateByDeviceId(
          TEST_DEVICE_IDS.DEVICE_2,
          TEST_COUNTRY_CODES.USA,
        );

        expect(result).toEqual(newUser);
        expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
          data: {
            deviceId: TEST_DEVICE_IDS.DEVICE_2,
            countryCode: TEST_COUNTRY_CODES.USA,
          },
        });
      });

      it('should use default country code "XX" when not provided', async () => {
        const newUser = {
          id: "new-user-id",
          deviceId: TEST_DEVICE_IDS.DEVICE_2,
          countryCode: "XX",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrismaClient.user.create.mockResolvedValue(newUser);

        const result = await userService.findOrCreateByDeviceId(
          TEST_DEVICE_IDS.DEVICE_2,
        );

        expect(result.countryCode).toBe("XX");
        expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
          data: {
            deviceId: TEST_DEVICE_IDS.DEVICE_2,
            countryCode: "XX",
          },
        });
      });

      it("should log info when creating new user", async () => {
        const newUser = {
          id: "new-user-id",
          deviceId: TEST_DEVICE_IDS.DEVICE_2,
          countryCode: TEST_COUNTRY_CODES.JAPAN,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrismaClient.user.create.mockResolvedValue(newUser);

        await userService.findOrCreateByDeviceId(
          TEST_DEVICE_IDS.DEVICE_2,
          TEST_COUNTRY_CODES.JAPAN,
        );

        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining("New user created"),
        );
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining(newUser.id),
        );
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining(TEST_COUNTRY_CODES.JAPAN),
        );
      });

      it("should create users for different countries", async () => {
        const countries = [
          TEST_COUNTRY_CODES.THAILAND,
          TEST_COUNTRY_CODES.USA,
          TEST_COUNTRY_CODES.JAPAN,
          TEST_COUNTRY_CODES.GERMANY,
        ];

        for (const country of countries) {
          const user = {
            id: `user-${country}`,
            deviceId: `device-${country}`,
            countryCode: country,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          mockPrismaClient.user.create.mockResolvedValue(user);

          const result = await userService.findOrCreateByDeviceId(
            `device-${country}`,
            country,
          );

          expect(result.countryCode).toBe(country);
        }
      });
    });

    describe("Error handling", () => {
      it("should throw error when findUnique fails", async () => {
        const error = new Error("Database connection error");
        mockPrismaClient.user.findUnique.mockRejectedValue(error);

        await expect(
          userService.findOrCreateByDeviceId(
            TEST_DEVICE_IDS.DEVICE_1,
            TEST_COUNTRY_CODES.THAILAND,
          ),
        ).rejects.toThrow("Database connection error");

        expect(logger.error).toHaveBeenCalledWith(
          "Error in findOrCreateByDeviceId",
          error,
        );
      });

      it("should throw error when create fails", async () => {
        mockPrismaClient.user.findUnique.mockResolvedValue(null);
        const error = new Error("Create failed");
        mockPrismaClient.user.create.mockRejectedValue(error);

        await expect(
          userService.findOrCreateByDeviceId(
            TEST_DEVICE_IDS.DEVICE_2,
            TEST_COUNTRY_CODES.USA,
          ),
        ).rejects.toThrow("Create failed");

        expect(logger.error).toHaveBeenCalledWith(
          "Error in findOrCreateByDeviceId",
          error,
        );
      });

      it("should log error before throwing", async () => {
        const error = new Error("Test error");
        mockPrismaClient.user.findUnique.mockRejectedValue(error);

        try {
          await userService.findOrCreateByDeviceId(
            TEST_DEVICE_IDS.DEVICE_1,
            TEST_COUNTRY_CODES.THAILAND,
          );
        } catch (e) {
          // Expected
          expect(e).toBe(error);
        }

        expect(logger.error).toHaveBeenCalledWith(
          "Error in findOrCreateByDeviceId",
          error,
        );
      });
    });

    describe("Edge cases", () => {
      it("should handle very long device IDs", async () => {
        const longDeviceId = "a".repeat(500);
        const user = {
          id: "user-id",
          deviceId: longDeviceId,
          countryCode: "TH",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrismaClient.user.findUnique.mockResolvedValue(null);
        mockPrismaClient.user.create.mockResolvedValue(user);

        const result = await userService.findOrCreateByDeviceId(
          longDeviceId,
          "TH",
        );

        expect(result.deviceId).toBe(longDeviceId);
      });

      it("should handle unknown country code", async () => {
        const user = {
          id: "user-id",
          deviceId: TEST_DEVICE_IDS.DEVICE_2,
          countryCode: TEST_COUNTRY_CODES.UNKNOWN,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrismaClient.user.findUnique.mockResolvedValue(null);
        mockPrismaClient.user.create.mockResolvedValue(user);

        const result = await userService.findOrCreateByDeviceId(
          TEST_DEVICE_IDS.DEVICE_2,
          TEST_COUNTRY_CODES.UNKNOWN,
        );

        expect(result.countryCode).toBe(TEST_COUNTRY_CODES.UNKNOWN);
      });

      it("should handle empty string country code", async () => {
        const user = {
          id: "user-id",
          deviceId: TEST_DEVICE_IDS.DEVICE_2,
          countryCode: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrismaClient.user.findUnique.mockResolvedValue(null);
        mockPrismaClient.user.create.mockResolvedValue(user);

        const result = await userService.findOrCreateByDeviceId(
          TEST_DEVICE_IDS.DEVICE_2,
          "",
        );

        expect(result.countryCode).toBe("");
      });
    });
  });

  describe("getUser", () => {
    describe("Finding users by ID", () => {
      it("should return user when found by ID", async () => {
        mockPrismaClient.user.findUnique.mockResolvedValue(TEST_USER);

        const result = await userService.getUser(TEST_USER.id);

        expect(result).toEqual(TEST_USER);
        expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
          where: { id: TEST_USER.id },
        });
      });

      it("should return null when user not found", async () => {
        mockPrismaClient.user.findUnique.mockResolvedValue(null);

        const result = await userService.getUser("non-existent-id");

        expect(result).toBeNull();
      });

      it("should find different users by their IDs", async () => {
        const users = [
          { ...TEST_USER, id: "user-1" },
          { ...TEST_USER, id: "user-2" },
          { ...TEST_USER, id: "user-3" },
        ];

        for (const user of users) {
          mockPrismaClient.user.findUnique.mockResolvedValue(user);

          const result = await userService.getUser(user.id);

          expect(result?.id).toBe(user.id);
          expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
            where: { id: user.id },
          });
        }
      });
    });

    describe("Edge cases", () => {
      it("should handle empty string ID", async () => {
        mockPrismaClient.user.findUnique.mockResolvedValue(null);

        const result = await userService.getUser("");

        expect(result).toBeNull();
        expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
          where: { id: "" },
        });
      });

      it("should handle very long IDs", async () => {
        const longId = "x".repeat(1000);
        mockPrismaClient.user.findUnique.mockResolvedValue(null);

        const result = await userService.getUser(longId);

        expect(result).toBeNull();
      });

      it("should handle special characters in ID", async () => {
        const specialId = "user-!@#$%^&*()";
        mockPrismaClient.user.findUnique.mockResolvedValue(null);

        await userService.getUser(specialId);

        expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
          where: { id: specialId },
        });
      });
    });

    describe("Error handling", () => {
      it("should throw error when query fails", async () => {
        const error = new Error("Database error");
        mockPrismaClient.user.findUnique.mockRejectedValue(error);

        await expect(userService.getUser("user-123")).rejects.toThrow(
          "Database error",
        );
      });
    });
  });

  describe("Integration: User lifecycle", () => {
    it("should create user and then be able to retrieve by ID", async () => {
      const newUser = {
        id: "new-user-123",
        deviceId: TEST_DEVICE_IDS.DEVICE_2,
        countryCode: TEST_COUNTRY_CODES.USA,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // First call: create user
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaClient.user.create.mockResolvedValue(newUser);

      const created = await userService.findOrCreateByDeviceId(
        TEST_DEVICE_IDS.DEVICE_2,
        TEST_COUNTRY_CODES.USA,
      );

      // Second call: find user by ID
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(newUser);
      const found = await userService.getUser(created.id);

      expect(found).toEqual(newUser);
    });

    it("should find existing user on subsequent calls with same deviceId", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(TEST_USER);

      const first = await userService.findOrCreateByDeviceId(
        TEST_DEVICE_IDS.DEVICE_1,
        TEST_COUNTRY_CODES.THAILAND,
      );
      const second = await userService.findOrCreateByDeviceId(
        TEST_DEVICE_IDS.DEVICE_1,
        TEST_COUNTRY_CODES.THAILAND,
      );

      expect(first).toEqual(second);
      expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
    });
  });
});
