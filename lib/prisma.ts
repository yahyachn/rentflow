import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

/**
 * Prisma Client singleton, wired through the `mariadb` driver adapter
 * (works against both MySQL and MariaDB servers — e.g. XAMPP's bundled
 * MySQL, a local MariaDB install, or a hosted MySQL instance).
 *
 * Why a driver adapter instead of the default binary/library query engine:
 * this keeps the whole data layer pure JS with no native Rust engine binary
 * to download or ship, which matters for constrained build/deploy
 * environments (and is simply the direction Prisma itself is heading).
 * `DATABASE_URL` is passed straight through, so swapping it for a different
 * MySQL instance in production needs no code change.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL ?? "");

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
