ALTER TABLE "UserDecoration"
ADD COLUMN "layer" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "coversFish" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "AdminAquariumDecoration"
ADD COLUMN "layer" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "coversFish" BOOLEAN NOT NULL DEFAULT false;

WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "userId"
    ORDER BY "acquiredAt", "id"
  ) - 1 AS "position"
  FROM "UserDecoration"
  WHERE "xPct" IS NOT NULL AND "yPct" IS NOT NULL
)
UPDATE "UserDecoration" AS decoration
SET "layer" = ranked."position"
FROM ranked
WHERE decoration."id" = ranked."id";

WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") - 1 AS "position"
  FROM "AdminAquariumDecoration"
)
UPDATE "AdminAquariumDecoration" AS decoration
SET "layer" = ranked."position"
FROM ranked
WHERE decoration."id" = ranked."id";
