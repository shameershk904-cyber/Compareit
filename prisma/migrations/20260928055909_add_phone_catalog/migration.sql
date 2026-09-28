-- CreateTable
CREATE TABLE "phones" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT,
    "slug" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "pricePkr" INTEGER NOT NULL DEFAULT 0,
    "lowestVerifiedPrice" INTEGER NOT NULL DEFAULT 0,
    "usdPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image" TEXT NOT NULL DEFAULT '',
    "images" JSONB NOT NULL DEFAULT '[]',
    "releaseDate" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Available',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "trendingRank" INTEGER NOT NULL DEFAULT 0,
    "ptaStatus" TEXT NOT NULL DEFAULT '',
    "ptaTax" JSONB,
    "warranty" JSONB,
    "memory" JSONB NOT NULL DEFAULT '{}',
    "battery" JSONB NOT NULL DEFAULT '{}',
    "display" JSONB NOT NULL DEFAULT '{}',
    "platform" JSONB NOT NULL DEFAULT '{}',
    "camera" JSONB NOT NULL DEFAULT '{}',
    "connectivity" JSONB NOT NULL DEFAULT '{}',
    "expertVerdict" JSONB,
    "colorVariants" JSONB NOT NULL DEFAULT '[]',
    "detailedSpecs" JSONB NOT NULL DEFAULT '{}',
    "competitorIds" JSONB NOT NULL DEFAULT '[]',
    "banners" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_retailers" (
    "id" TEXT NOT NULL,
    "phoneId" TEXT NOT NULL,
    "store" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "delivery" TEXT NOT NULL DEFAULT '',
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "condition" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "phone_retailers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "phones_legacyId_key" ON "phones"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "phones_slug_key" ON "phones"("slug");

-- CreateIndex
CREATE INDEX "phones_slug_idx" ON "phones"("slug");

-- CreateIndex
CREATE INDEX "phones_brand_idx" ON "phones"("brand");

-- CreateIndex
CREATE INDEX "phones_brand_isActive_idx" ON "phones"("brand", "isActive");

-- CreateIndex
CREATE INDEX "phones_pricePkr_idx" ON "phones"("pricePkr");

-- CreateIndex
CREATE INDEX "phones_lowestVerifiedPrice_idx" ON "phones"("lowestVerifiedPrice");

-- CreateIndex
CREATE INDEX "phones_popular_idx" ON "phones"("popular");

-- CreateIndex
CREATE INDEX "phones_trendingRank_idx" ON "phones"("trendingRank");

-- CreateIndex
CREATE INDEX "phones_isActive_idx" ON "phones"("isActive");

-- CreateIndex
CREATE INDEX "phones_isActive_popular_idx" ON "phones"("isActive", "popular");

-- CreateIndex
CREATE INDEX "phones_isActive_trendingRank_idx" ON "phones"("isActive", "trendingRank");

-- CreateIndex
CREATE INDEX "phones_ptaStatus_idx" ON "phones"("ptaStatus");

-- CreateIndex
CREATE INDEX "phones_createdAt_idx" ON "phones"("createdAt");

-- CreateIndex
CREATE INDEX "phone_retailers_phoneId_idx" ON "phone_retailers"("phoneId");

-- CreateIndex
CREATE INDEX "phone_retailers_store_idx" ON "phone_retailers"("store");

-- AddForeignKey
ALTER TABLE "phone_retailers" ADD CONSTRAINT "phone_retailers_phoneId_fkey" FOREIGN KEY ("phoneId") REFERENCES "phones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
