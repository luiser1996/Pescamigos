-- Existing users start with no pending chests. Historical catches that had not
-- been evaluated are marked as settled, while future catches will continue to
-- receive their normal chest award when they are registered.
UPDATE "Catch"
SET "chestsAwarded" = 0
WHERE "chestsAwarded" IS NULL;

UPDATE "User" AS users
SET "chestsOpened" = COALESCE((
  SELECT SUM(catches."chestsAwarded")
  FROM "Catch" AS catches
  WHERE catches."fisherId" = users."id"
), 0);
