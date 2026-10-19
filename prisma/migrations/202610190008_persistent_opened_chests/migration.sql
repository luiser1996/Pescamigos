ALTER TABLE "User" ADD COLUMN "chestsOpened" INTEGER NOT NULL DEFAULT 0;

UPDATE "User" AS account
SET "chestsOpened" = opened."count"
FROM (
  SELECT "userId", COUNT(*)::INTEGER AS "count"
  FROM "UserDecoration"
  WHERE "source" = 'CHEST'
  GROUP BY "userId"
) AS opened
WHERE account."id" = opened."userId";
