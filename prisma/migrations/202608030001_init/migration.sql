-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "WaterType" AS ENUM ('FRESHWATER', 'SALTWATER', 'BRACKISH');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "FishingMode" AS ENUM ('SHORE', 'BOAT', 'RIVER', 'RESERVOIR', 'LAKE', 'BEACH', 'PORT', 'OTHER');

-- CreateEnum
CREATE TYPE "CatchDisposition" AS ENUM ('RELEASED', 'KEPT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "alternateNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "waterType" "WaterType" NOT NULL,
    "description" TEXT,
    "curiosities" TEXT,
    "habitat" TEXT,
    "granadaDistribution" TEXT,
    "usualSizeCm" DECIMAL(7,2),
    "documentedMaxSizeCm" DECIMAL(7,2),
    "usualWeightG" DECIMAL(10,2),
    "activeMonths" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "activityTimes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usualDepth" TEXT,
    "difficulty" INTEGER,
    "techniques" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "baits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conservationStatus" TEXT,
    "legalStatus" TEXT,
    "closedSeasonNotes" TEXT,
    "invasiveNotes" TEXT,
    "biologicalSeasonNotes" TEXT,
    "illustrationPath" TEXT,
    "silhouettePath" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeciesSource" (
    "id" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT,
    "url" TEXT NOT NULL,
    "scope" TEXT,
    "accessedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeciesSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FishingPlace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "waterType" "WaterType" NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FishingPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Catch" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "fisherId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "caughtAt" TIMESTAMP(3) NOT NULL,
    "timeKnown" BOOLEAN NOT NULL DEFAULT true,
    "lengthCm" DECIMAL(7,2) NOT NULL,
    "weightG" DECIMAL(10,2),
    "techniqueId" TEXT,
    "baitOrLureId" TEXT,
    "mode" "FishingMode" NOT NULL,
    "disposition" "CatchDisposition" NOT NULL,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Catch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatchPhoto" (
    "id" TEXT NOT NULL,
    "catchId" TEXT NOT NULL,
    "originalPath" TEXT NOT NULL,
    "webPath" TEXT NOT NULL,
    "thumbnailPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatchPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technique" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Technique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaitOrLure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BaitOrLure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Species_slug_key" ON "Species"("slug");

-- CreateIndex
CREATE INDEX "Species_waterType_archivedAt_idx" ON "Species"("waterType", "archivedAt");

-- CreateIndex
CREATE INDEX "Species_commonName_idx" ON "Species"("commonName");

-- CreateIndex
CREATE INDEX "Species_scientificName_idx" ON "Species"("scientificName");

-- CreateIndex
CREATE INDEX "SpeciesSource_speciesId_idx" ON "SpeciesSource"("speciesId");

-- CreateIndex
CREATE INDEX "FishingPlace_waterType_archivedAt_idx" ON "FishingPlace"("waterType", "archivedAt");

-- CreateIndex
CREATE INDEX "FishingPlace_latitude_longitude_idx" ON "FishingPlace"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "Catch_idempotencyKey_key" ON "Catch"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Catch_fisherId_caughtAt_idx" ON "Catch"("fisherId", "caughtAt");

-- CreateIndex
CREATE INDEX "Catch_speciesId_fisherId_deletedAt_idx" ON "Catch"("speciesId", "fisherId", "deletedAt");

-- CreateIndex
CREATE INDEX "Catch_placeId_caughtAt_idx" ON "Catch"("placeId", "caughtAt");

-- CreateIndex
CREATE INDEX "CatchPhoto_catchId_sortOrder_idx" ON "CatchPhoto"("catchId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Technique_name_key" ON "Technique"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BaitOrLure_name_key" ON "BaitOrLure"("name");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesSource" ADD CONSTRAINT "SpeciesSource_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishingPlace" ADD CONSTRAINT "FishingPlace_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catch" ADD CONSTRAINT "Catch_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catch" ADD CONSTRAINT "Catch_fisherId_fkey" FOREIGN KEY ("fisherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catch" ADD CONSTRAINT "Catch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catch" ADD CONSTRAINT "Catch_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "FishingPlace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catch" ADD CONSTRAINT "Catch_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES "Technique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catch" ADD CONSTRAINT "Catch_baitOrLureId_fkey" FOREIGN KEY ("baitOrLureId") REFERENCES "BaitOrLure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatchPhoto" ADD CONSTRAINT "CatchPhoto_catchId_fkey" FOREIGN KEY ("catchId") REFERENCES "Catch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
