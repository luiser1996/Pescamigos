CREATE TYPE "Rarity" AS ENUM ('COMMON', 'RARE', 'VERY_RARE', 'LEGENDARY');
ALTER TABLE "Species" ADD COLUMN "rarity" "Rarity" NOT NULL DEFAULT 'COMMON';

UPDATE "Species" s SET "rarity" = CASE
  WHEN COALESCE(s."difficulty", 1) >= 5 OR (SELECT COUNT(*) FROM "Catch" c WHERE c."speciesId" = s.id AND c."deletedAt" IS NULL) <= 1 THEN 'LEGENDARY'::"Rarity"
  WHEN COALESCE(s."difficulty", 1) = 4 OR (SELECT COUNT(*) FROM "Catch" c WHERE c."speciesId" = s.id AND c."deletedAt" IS NULL) <= 3 THEN 'VERY_RARE'::"Rarity"
  WHEN COALESCE(s."difficulty", 1) = 3 OR (SELECT COUNT(*) FROM "Catch" c WHERE c."speciesId" = s.id AND c."deletedAt" IS NULL) <= 7 THEN 'RARE'::"Rarity"
  ELSE 'COMMON'::"Rarity"
END;
