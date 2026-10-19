CREATE TABLE "AdminAquariumFish" (
    "id" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "lengthCm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAquariumFish_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAquariumDecoration" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "xPct" DOUBLE PRECISION NOT NULL,
    "yPct" DOUBLE PRECISION NOT NULL,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAquariumDecoration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAquariumFish_createdAt_idx" ON "AdminAquariumFish"("createdAt");
CREATE INDEX "AdminAquariumDecoration_createdAt_idx" ON "AdminAquariumDecoration"("createdAt");
ALTER TABLE "AdminAquariumFish" ADD CONSTRAINT "AdminAquariumFish_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;
