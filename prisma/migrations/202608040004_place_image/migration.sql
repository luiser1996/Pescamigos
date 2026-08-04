ALTER TABLE "FishingPlace" ADD COLUMN "placeImageId" TEXT;
CREATE UNIQUE INDEX "FishingPlace_placeImageId_key" ON "FishingPlace"("placeImageId");
ALTER TABLE "FishingPlace" ADD CONSTRAINT "FishingPlace_placeImageId_fkey" FOREIGN KEY ("placeImageId") REFERENCES "StoredImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
