import type { Rarity } from "@prisma/client";
import { monthInAppTimeZone } from "@/lib/date";

export const rarityLabels: Record<Rarity, string> = {
  COMMON: "Común",
  RARE: "Raro",
  VERY_RARE: "Muy raro",
  LEGENDARY: "Legendario",
};
export const feminineRarityLabels: Record<Rarity, string> = {
  COMMON: "Común",
  RARE: "Rara",
  VERY_RARE: "Muy rara",
  LEGENDARY: "Legendaria",
};
const levels: Rarity[] = ["COMMON", "RARE", "VERY_RARE", "LEGENDARY"];
const number = (value: unknown) => (value == null ? null : Number(value));

export type ScoredCatch = {
  id: string;
  fisherId: string;
  speciesId: string;
  caughtAt: Date;
  lengthCm: unknown;
  weightG: unknown;
  species: {
    rarity: Rarity;
    usualSizeCm: unknown;
    documentedMaxSizeCm: unknown;
    usualWeightG: unknown;
    activeMonths: number[];
  };
};

export const pointBonuses = {
  firstSpeciesCatch: 100,
  speciesRecord: 150,
  absoluteRecord: 250,
} as const;

export type ScoreBonuses = {
  isFirstSpeciesCatch?: boolean;
  isSpeciesRecord?: boolean;
  isAbsoluteRecord?: boolean;
};

export function captureRarity(item: ScoredCatch): Rarity {
  const length = number(item.lengthCm) ?? 0;
  const weight = number(item.weightG);
  const usualLength = number(item.species.usualSizeCm);
  const maxLength = number(item.species.documentedMaxSizeCm);
  const usualWeight = number(item.species.usualWeightG);
  const ratio = usualLength
    ? length / usualLength
    : usualWeight && weight
      ? weight / usualWeight
      : 0;
  if ((maxLength && length >= maxLength * 0.9) || ratio >= 1.5)
    return "LEGENDARY";
  if (ratio > 1.1) return "VERY_RARE";
  if (ratio >= 0.9) return "RARE";
  return "COMMON";
}

export function recordIds(catches: ScoredCatch[]) {
  const result = new Set<string>();
  for (const speciesId of new Set(catches.map((c) => c.speciesId))) {
    const group = catches.filter((c) => c.speciesId === speciesId);
    const maxLength = Math.max(...group.map((c) => number(c.lengthCm) ?? 0));
    const weights = group
      .map((c) => number(c.weightG))
      .filter((x): x is number => x != null);
    const maxWeight = weights.length ? Math.max(...weights) : null;
    group.forEach((c) => {
      if (
        number(c.lengthCm) === maxLength ||
        (maxWeight != null && number(c.weightG) === maxWeight)
      )
        result.add(c.id);
    });
  }
  return result;
}

export function firstSpeciesCatchIds(catches: ScoredCatch[]) {
  const result = new Set<string>();
  for (const speciesId of new Set(catches.map((c) => c.speciesId))) {
    const first = catches
      .filter((c) => c.speciesId === speciesId)
      .sort(
        (a, b) =>
          a.caughtAt.getTime() - b.caughtAt.getTime() ||
          a.id.localeCompare(b.id),
      )[0];
    if (first) result.add(first.id);
  }
  return result;
}

export function absoluteRecordIds(catches: ScoredCatch[]) {
  const result = new Set<string>();
  if (!catches.length) return result;
  const maxLength = Math.max(...catches.map((c) => number(c.lengthCm) ?? 0));
  const weights = catches
    .map((c) => number(c.weightG))
    .filter((value): value is number => value != null);
  const maxWeight = weights.length ? Math.max(...weights) : null;
  catches.forEach((item) => {
    if (
      number(item.lengthCm) === maxLength ||
      (maxWeight != null && number(item.weightG) === maxWeight)
    )
      result.add(item.id);
  });
  return result;
}

export function scoringContext(catches: ScoredCatch[]) {
  return {
    speciesRecords: recordIds(catches),
    firstSpeciesCatches: firstSpeciesCatchIds(catches),
    absoluteRecords: absoluteRecordIds(catches),
  };
}

export function scoreBonusesFor(
  itemId: string,
  context: ReturnType<typeof scoringContext>,
): ScoreBonuses {
  return {
    isFirstSpeciesCatch: context.firstSpeciesCatches.has(itemId),
    isSpeciesRecord: context.speciesRecords.has(itemId),
    isAbsoluteRecord: context.absoluteRecords.has(itemId),
  };
}

export function scoreCatch(item: ScoredCatch, bonuses: ScoreBonuses = {}) {
  const base = [100, 175, 275, 425][levels.indexOf(item.species.rarity)];
  const multiplier = [1, 1.35, 1.75, 2.4][levels.indexOf(captureRarity(item))];
  const offSeason =
    item.species.activeMonths.length > 0 &&
    !item.species.activeMonths.includes(monthInAppTimeZone(item.caughtAt) + 1);
  return Math.round(
    base * multiplier +
      (bonuses.isFirstSpeciesCatch ? pointBonuses.firstSpeciesCatch : 0) +
      (bonuses.isSpeciesRecord ? pointBonuses.speciesRecord : 0) +
      (bonuses.isAbsoluteRecord ? pointBonuses.absoluteRecord : 0) +
      (offSeason ? 40 : 0),
  );
}

export function ranking(catches: ScoredCatch[], userIds: string[]) {
  const context = scoringContext(catches);
  return userIds
    .map((id) => ({
      id,
      points: catches
        .filter((c) => c.fisherId === id)
        .reduce(
          (sum, c) => sum + scoreCatch(c, scoreBonusesFor(c.id, context)),
          0,
        ),
    }))
    .sort((a, b) => b.points - a.points || a.id.localeCompare(b.id))
    .map((row, index) => ({ ...row, position: index + 1 }));
}

export function fisherRank(points: number) {
  return points >= 10000 ? "Maestro" : points >= 5000 ? "Alto" : "Bajo";
}

export function nextRankMessage(points: number) {
  if (points < 5000)
    return `Faltan ${(5000 - points).toLocaleString("es-ES")} RP para Rango Alto`;
  if (points < 10000)
    return `Faltan ${(10000 - points).toLocaleString("es-ES")} RP para Rango Maestro`;
  return "Has alcanzado el rango máximo";
}
