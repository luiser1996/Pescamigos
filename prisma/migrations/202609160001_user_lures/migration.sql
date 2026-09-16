ALTER TABLE "User" ADD COLUMN "lostLures" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "favoriteLureImageId" TEXT;
CREATE UNIQUE INDEX "User_favoriteLureImageId_key" ON "User"("favoriteLureImageId");
ALTER TABLE "User" ADD CONSTRAINT "User_favoriteLureImageId_fkey" FOREIGN KEY ("favoriteLureImageId") REFERENCES "StoredImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_lostLures_nonnegative" CHECK ("lostLures" >= 0);
