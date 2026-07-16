import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Connect through the libSQL driver adapter. The exact same runtime code works
// against a local SQLite file (development) and a hosted Turso database
// (production) — only the environment variables change.
const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

// Reuse a single PrismaClient across hot reloads in development to avoid
// exhausting connections.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
