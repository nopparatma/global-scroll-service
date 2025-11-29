import { Server, Socket } from "socket.io";
import { z } from "zod";
import geoip from "geoip-lite";
import { userService } from "../services/user.service";
import { gameService } from "../services/game.service";
import logger from "../utils/logger";
import i18next from "../config/i18n";

// Validation Schemas
const ScrollBatchSchema = z.object({
  delta: z.number().positive().max(10000), // Max 10k pixels per batch
});

export const initializeSocketIO = (io: Server) => {
  io.on("connection", async (socket: Socket) => {
    try {
      // 1. Handshake & Auth
      const deviceId = socket.handshake.query.deviceId as string;
      const lang = (socket.handshake.query.lang as string) || "en";
      const manualCountryCode = socket.handshake.query.countryCode as string;

      if (!deviceId) {
        socket.disconnect(true);
        return;
      }

      // 2. GeoIP (or use manual country code if provided)
      let countryCode = manualCountryCode;

      if (!countryCode) {
        let ip = socket.handshake.address;
        // Handle localhost/proxy
        if (ip === "::1" || ip === "127.0.0.1") ip = "203.146.237.237"; // Default to TH IP for dev

        const geo = geoip.lookup(ip);
        countryCode = geo ? geo.country : "XX";
      }

      logger.info(
        `Country determined: ${countryCode} (manual: ${!!manualCountryCode})`,
      );

      // 3. Find/Create User
      const user = await userService.findOrCreateByDeviceId(
        deviceId,
        countryCode,
      );

      // 4. Join Room
      socket.join("global");
      logger.info(`User connected: ${user.id} (${countryCode})`);

      // 5. Send Init State
      const state = await gameService.getGameState();
      const t = i18next.getFixedT(lang);

      socket.emit("init", {
        ...state,
        user: { id: user.id, country: countryCode },
        message: t("system.welcome"),
      });

      // 6. Handle Events
      let lastBatchTime = Date.now();

      socket.on("scroll_batch", async (data) => {
        try {
          // Validate
          const { delta } = ScrollBatchSchema.parse(data);

          const now = Date.now();
          const timeDiff = now - lastBatchTime;

          // Rate Limit (Simple)
          if (timeDiff < 500) return; // Ignore if < 500ms

          await gameService.processScrollBatch(
            user.id,
            countryCode,
            delta,
            timeDiff,
          );

          lastBatchTime = now;
        } catch (error) {
          logger.warn(`Invalid scroll data from ${user.id}:`, error);
        }
      });

      socket.on("disconnect", () => {
        logger.info(`User disconnected: ${user.id}`);
      });
    } catch (error) {
      logger.error("Socket connection error", error);
      socket.disconnect();
    }
  });
  // Tick Loop (Broadcast state every 200ms)
  setInterval(async () => {
    const state = await gameService.getGameState();
    io.to("global").emit("tick", state);
  }, 200);
};
