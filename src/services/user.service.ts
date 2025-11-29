import { User } from "@prisma/client";
import prisma from "../utils/prisma";
import logger from "../utils/logger";

class UserService {
  async findOrCreateByDeviceId(
    deviceId: string,
    countryCode: string = "XX",
  ): Promise<User> {
    try {
      let user = await prisma.user.findUnique({
        where: { deviceId },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            deviceId,
            countryCode,
          },
        });
        logger.info(`New user created: ${user.id} (${countryCode})`);
      }

      return user;
    } catch (error) {
      logger.error("Error in findOrCreateByDeviceId", error);
      throw error;
    }
  }

  async getUser(id: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id } });
  }
}

export const userService = new UserService();
