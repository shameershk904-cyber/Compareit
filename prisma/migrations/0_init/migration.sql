-- CompareIt.pk Initial Migration
-- PostgreSQL on Supabase

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "BannerPlacement" AS ENUM ('HERO', 'TOP_BAR', 'POPUP', 'SIDEBAR');

-- CreateTable: users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: page_views
CREATE TABLE IF NOT EXISTS "page_views" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "screenSize" TEXT,
    "country" TEXT DEFAULT 'PK',
    "ipHash" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable: search_logs
CREATE TABLE IF NOT EXISTS "search_logs" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "clickedResult" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: banners
CREATE TABLE IF NOT EXISTS "banners" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desktopImage" TEXT NOT NULL,
    "mobileImage" TEXT,
    "altText" TEXT,
    "linkUrl" TEXT NOT NULL,
    "placement" "BannerPlacement" NOT NULL DEFAULT 'HERO',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_logs
CREATE TABLE IF NOT EXISTS "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "page_views_createdAt_idx" ON "page_views"("createdAt");
CREATE INDEX IF NOT EXISTS "page_views_path_idx" ON "page_views"("path");
CREATE INDEX IF NOT EXISTS "page_views_sessionId_idx" ON "page_views"("sessionId");
CREATE INDEX IF NOT EXISTS "page_views_country_idx" ON "page_views"("country");
CREATE INDEX IF NOT EXISTS "page_views_device_idx" ON "page_views"("device");
CREATE INDEX IF NOT EXISTS "search_logs_normalized_idx" ON "search_logs"("normalized");
CREATE INDEX IF NOT EXISTS "search_logs_createdAt_idx" ON "search_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "search_logs_resultsCount_idx" ON "search_logs"("resultsCount");
CREATE INDEX IF NOT EXISTS "banners_placement_isActive_idx" ON "banners"("placement", "isActive");
CREATE INDEX IF NOT EXISTS "banners_priority_idx" ON "banners"("priority");
CREATE INDEX IF NOT EXISTS "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "activity_logs_userEmail_idx" ON "activity_logs"("userEmail");
CREATE INDEX IF NOT EXISTS "activity_logs_entity_idx" ON "activity_logs"("entity");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_userId_fkey') THEN
        ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
