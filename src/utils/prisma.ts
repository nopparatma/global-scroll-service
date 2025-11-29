import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Prisma 7 Configuration
 *
 * In Prisma 7, the database connection URL is no longer specified in schema.prisma.
 * Instead, we pass it directly to the PrismaClient constructor via the `adapter` option.
 *
 * For standard PostgreSQL connections, we use the PrismaPg adapter.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;
