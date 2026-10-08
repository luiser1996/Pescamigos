import { describe, expect, it } from "vitest";
import {
  captureRarity,
  fisherRank,
  ranking,
  recordIds,
  scoreCatch,
  type ScoredCatch,
} from "@/lib/ranking";
const base = (overrides: Partial<ScoredCatch> = {}): ScoredCatch => ({
  id: "one",
  fisherId: "luis",
  speciesId: "carpa",
  caughtAt: new Date("2026-10-08T10:00:00Z"),
  lengthCm: 30,
  weightG: 500,
  species: {
    rarity: "COMMON",
    usualSizeCm: 50,
    documentedMaxSizeCm: 100,
    usualWeightG: 1000,
    activeMonths: [10],
  },
  ...overrides,
});
describe("rareza y puntos", () => {
  it("clasifica por proporción y máximo documentado", () => {
    expect(captureRarity(base())).toBe("COMMON");
    expect(captureRarity(base({ lengthCm: 65 }))).toBe("VERY_RARE");
    expect(captureRarity(base({ lengthCm: 91 }))).toBe("LEGENDARY");
  });
  it("premia el récord", () =>
    expect(scoreCatch(base(), true) - scoreCatch(base(), false)).toBe(150));
  it("marca empates de récord", () =>
    expect(recordIds([base(), base({ id: "two", fisherId: "dani" })])).toEqual(
      new Set(["one", "two"]),
    ));
  it("ordena el ranking por puntos", () =>
    expect(
      ranking(
        [base(), base({ id: "two", fisherId: "dani", lengthCm: 90 })],
        ["luis", "dani"],
      )[0].id,
    ).toBe("dani"));
  it("aplica los tres rangos", () => {
    expect(fisherRank(999)).toBe("Bajo");
    expect(fisherRank(1000)).toBe("Alto");
    expect(fisherRank(3000)).toBe("Maestro");
  });
});
