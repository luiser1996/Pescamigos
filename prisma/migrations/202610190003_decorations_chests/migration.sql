-- CreateEnum
CREATE TYPE "DecorationSource" AS ENUM ('CHEST', 'CRAFT', 'DISMANTLE');

-- AlterTable
ALTER TABLE "Catch" ADD COLUMN "chestsAwarded" INTEGER;

-- CreateTable
CREATE TABLE "UserDecoration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "source" "DecorationSource" NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xPct" DOUBLE PRECISION,
    "yPct" DOUBLE PRECISION,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    CONSTRAINT "UserDecoration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserDecoration_userId_acquiredAt_idx" ON "UserDecoration"("userId", "acquiredAt");
CREATE INDEX "UserDecoration_userId_rarity_idx" ON "UserDecoration"("userId", "rarity");
ALTER TABLE "UserDecoration" ADD CONSTRAINT "UserDecoration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
