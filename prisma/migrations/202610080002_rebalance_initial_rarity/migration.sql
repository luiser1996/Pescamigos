UPDATE "Species" SET "rarity" = CASE
  WHEN COALESCE("difficulty", 1) >= 5 THEN 'LEGENDARY'::"Rarity"
  WHEN COALESCE("difficulty", 1) = 4 THEN 'VERY_RARE'::"Rarity"
  WHEN COALESCE("difficulty", 1) = 3 THEN 'RARE'::"Rarity"
  ELSE 'COMMON'::"Rarity"
END;
