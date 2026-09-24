-- ==============================================================================
-- CompareIt.pk - Supabase Row Level Security (RLS) & Policies
-- Run this in the Supabase SQL Editor to secure all tables against unauthorized
-- direct client-side REST access. Server-side Prisma uses direct/pooled postgres
-- connection which bypasses RLS safely.
-- ==============================================================================

-- 1. Enable RLS on all dashboard & analytics tables
ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "page_views" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "search_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "banners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "activity_logs" ENABLE ROW LEVEL SECURITY;

-- 2. Drop any previous policies to avoid duplication
DROP POLICY IF EXISTS "Public can view active banners" ON "banners";
DROP POLICY IF EXISTS "Public can insert page views via backend" ON "page_views";
DROP POLICY IF EXISTS "Public can insert search logs via backend" ON "search_logs";

-- 3. Banners: Allow public read access ONLY to active banners within valid date ranges
CREATE POLICY "Public can view active banners" ON "banners"
    FOR SELECT
    USING (
        "isActive" = true 
        AND ("startDate" IS NULL OR "startDate" <= CURRENT_TIMESTAMP)
        AND ("endDate" IS NULL OR "endDate" >= CURRENT_TIMESTAMP)
    );

-- 4. Users, Activity Logs, Page Views, Search Logs:
-- Deny all direct client-side Supabase REST access by default.
-- Prisma server-side queries execute with superuser/database role permissions,
-- keeping client data, credentials, and logs 100% private from browser inspection.
