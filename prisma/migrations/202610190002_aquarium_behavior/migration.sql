CREATE TYPE "AquariumBehavior" AS ENUM ('FREE_SWIMMER', 'BOTTOM_DWELLER', 'CEPHALOPOD');

ALTER TABLE "Species" ADD COLUMN "aquariumBehavior" "AquariumBehavior" NOT NULL DEFAULT 'FREE_SWIMMER';

UPDATE "Species"
SET "aquariumBehavior" = 'CEPHALOPOD'
WHERE lower("commonName") LIKE ANY (ARRAY['%calamar%', '%sepia%', '%pulpo%'])
   OR lower("scientificName") LIKE ANY (ARRAY['%loligo%', '%sepia %', '%octopus%']);

UPDATE "Species"
SET "aquariumBehavior" = 'BOTTOM_DWELLER'
WHERE lower("commonName") LIKE ANY (ARRAY[
  '%lenguado%', '%rodaballo%', '%raya%', '%pastinaca%', '%torpedo%',
  '%gobio%', '%pez araña%', '%rape%', '%cabracho%'
]);
