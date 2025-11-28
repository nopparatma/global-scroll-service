import http from "http";
import { Server } from "socket.io";
import app from "./app";
import { env } from "./config/env";
import logger from "./utils/logger";
import { redisService } from "./services/redis.service";
import { initializeSocketIO } from "./sockets/socket.controller";

import "./config/i18n"; // Init i18n

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.NODE_ENV === "production" ? "https://your-domain.com" : "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Initialize Services
async function startServer() {
  try {
    await redisService.connect();

    initializeSocketIO(io);

    server.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful Shutdown
    const shutdown = async () => {
      logger.info("Shutting down...");
      await redisService.disconnect();
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

startServer();
