export type CatalogCatch = {
  speciesId: string;
  fisherId: string;
  caughtAt: Date;
  lengthCm: number;
  weightG?: number | null;
};

export function isDiscovered(
  catches: CatalogCatch[],
  speciesId: string,
  userIds: string[],
) {
  const viewers = new Set(userIds);
  return catches.some(
    (item) => item.speciesId === speciesId && viewers.has(item.fisherId),
  );
}

export function catalogCounts(catches: CatalogCatch[], userIds: string[]) {
  const viewers = new Set(userIds);
  const counts = new Map<string, number>();
  for (const item of catches) {
    if (viewers.has(item.fisherId))
      counts.set(item.speciesId, (counts.get(item.speciesId) ?? 0) + 1);
  }
  return counts;
}

export function recordFor(
  catches: CatalogCatch[],
  speciesId: string,
  userIds: string[],
  measure: "lengthCm" | "weightG",
) {
  const viewers = new Set(userIds);
  return catches
    .filter(
      (item) => item.speciesId === speciesId && viewers.has(item.fisherId),
    )
    .reduce<CatalogCatch | null>((best, item) => {
      const value = item[measure];
      if (value == null) return best;
      return !best || value > (best[measure] ?? -Infinity) ? item : best;
    }, null);
}

export const kgToGrams = (kg: number) => Math.round(kg * 1000);
export const gramsToKg = (grams: number) => grams / 1000;
