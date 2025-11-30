import { cleanEnv, str, port, url, num } from "envalid";
import dotenv from "dotenv";

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ["development", "test", "production", "staging"] }),
  PORT: port({ default: 3000 }),
  REDIS_URL: url(),
  DATABASE_URL: url(),
  CORS_ORIGIN: str({ default: "*" }),

  // Game Balance Configuration
  GAME_DIFFICULTY_MULTIPLIER: num({ default: 1.0 }),
  GRAVITY_STRENGTH_MULTIPLIER: num({ default: 1.0 }),
  MAX_VELOCITY_MULTIPLIER: num({ default: 1.0 }),

  // Worker Configuration
  AGGREGATION_CRON_SCHEDULE: str({ default: "0 3 * * *" }), // Default: 03:00 AM daily
});
