import { PrismaClient } from "@prisma/client";

function cleanEnvUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  let url = raw.trim();
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }
  return url;
}

const cleanedDatabaseUrl = cleanEnvUrl(process.env.DATABASE_URL);
if (cleanedDatabaseUrl) {
  process.env.DATABASE_URL = cleanedDatabaseUrl;
}

const cleanedDirectUrl = cleanEnvUrl(process.env.DIRECT_URL);
if (cleanedDirectUrl) {
  process.env.DIRECT_URL = cleanedDirectUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: cleanedDatabaseUrl ? { db: { url: cleanedDatabaseUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

