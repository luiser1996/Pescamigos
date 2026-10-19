CREATE TABLE "AquariumFish" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "catchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AquariumFish_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AquariumFish_userId_catchId_key" ON "AquariumFish"("userId", "catchId");
CREATE INDEX "AquariumFish_userId_createdAt_idx" ON "AquariumFish"("userId", "createdAt");

ALTER TABLE "AquariumFish" ADD CONSTRAINT "AquariumFish_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AquariumFish" ADD CONSTRAINT "AquariumFish_catchId_fkey" FOREIGN KEY ("catchId") REFERENCES "Catch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
