import type { Rarity } from "@prisma/client";
import { monthInAppTimeZone } from "@/lib/date";

export const rarityLabels: Record<Rarity, string> = {
  COMMON: "Común",
  RARE: "Raro",
  VERY_RARE: "Muy raro",
  LEGENDARY: "Legendario",
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

export function captureRarity(item: ScoredCatch): Rarity {
  const length = number(item.lengthCm) ?? 0;
  const weight = number(item.weightG);
  const usualLength = number(item.species.usualSizeCm);
  const maxLength = number(item.species.documentedMaxSizeCm);
  const usualWeight = number(item.species.usualWeightG);
  const ratios = [
    usualLength ? length / usualLength : 0,
    usualWeight && weight ? weight / usualWeight : 0,
  ];
  const ratio = Math.max(...ratios);
  if ((maxLength && length >= maxLength * 0.9) || ratio >= 1.6)
    return "LEGENDARY";
  if (ratio >= 1.25) return "VERY_RARE";
  if (ratio >= 1) return "RARE";
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

export function scoreCatch(item: ScoredCatch, isRecord: boolean) {
  const base = [100, 175, 275, 425][levels.indexOf(item.species.rarity)];
  const multiplier = [1, 1.35, 1.75, 2.4][levels.indexOf(captureRarity(item))];
  const offSeason =
    item.species.activeMonths.length > 0 &&
    !item.species.activeMonths.includes(monthInAppTimeZone(item.caughtAt) + 1);
  return Math.round(
    base * multiplier + (isRecord ? 150 : 0) + (offSeason ? 40 : 0),
  );
}

export function ranking(catches: ScoredCatch[], userIds: string[]) {
  const records = recordIds(catches);
  return userIds
    .map((id) => ({
      id,
      points: catches
        .filter((c) => c.fisherId === id)
        .reduce((sum, c) => sum + scoreCatch(c, records.has(c.id)), 0),
    }))
    .sort((a, b) => b.points - a.points || a.id.localeCompare(b.id))
    .map((row, index) => ({ ...row, position: index + 1 }));
}

export function fisherRank(points: number) {
  return points >= 3000 ? "Maestro" : points >= 1000 ? "Alto" : "Bajo";
}
