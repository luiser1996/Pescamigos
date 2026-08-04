CREATE TABLE "StoredImage" (
  "id" TEXT NOT NULL,
  "originalPath" TEXT NOT NULL,
  "webPath" TEXT NOT NULL,
  "thumbnailPath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoredImage_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "User" ADD COLUMN "avatarImageId" TEXT;
ALTER TABLE "Species" ADD COLUMN "catalogImageId" TEXT, ADD COLUMN "detailImageId" TEXT;
CREATE UNIQUE INDEX "User_avatarImageId_key" ON "User"("avatarImageId");
CREATE UNIQUE INDEX "Species_catalogImageId_key" ON "Species"("catalogImageId");
CREATE UNIQUE INDEX "Species_detailImageId_key" ON "Species"("detailImageId");
ALTER TABLE "User" ADD CONSTRAINT "User_avatarImageId_fkey" FOREIGN KEY ("avatarImageId") REFERENCES "StoredImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Species" ADD CONSTRAINT "Species_catalogImageId_fkey" FOREIGN KEY ("catalogImageId") REFERENCES "StoredImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Species" ADD CONSTRAINT "Species_detailImageId_fkey" FOREIGN KEY ("detailImageId") REFERENCES "StoredImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
