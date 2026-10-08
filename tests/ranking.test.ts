import { describe, expect, it } from "vitest";
import {
  absoluteRecordIds,
  captureRarity,
  firstSpeciesCatchIds,
  fisherRank,
  nextRankMessage,
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
    expect(captureRarity(base({ lengthCm: 45 }))).toBe("RARE");
    expect(captureRarity(base({ lengthCm: 60 }))).toBe("VERY_RARE");
    expect(captureRarity(base({ lengthCm: 91 }))).toBe("LEGENDARY");
    expect(captureRarity(base({ lengthCm: 30, weightG: 5000 }))).toBe("COMMON");
  });
  it("premia el récord de especie", () =>
    expect(
      scoreCatch(base(), { isSpeciesRecord: true }) - scoreCatch(base()),
    ).toBe(150));
  it("premia la primera captura de una especie", () => {
    const later = base({ id: "later", caughtAt: new Date("2026-10-09") });
    expect(firstSpeciesCatchIds([later, base()])).toEqual(new Set(["one"]));
    expect(
      scoreCatch(base(), { isFirstSpeciesCatch: true }) - scoreCatch(base()),
    ).toBe(100);
  });
  it("premia el récord absoluto y lo cambia cuando se supera", () => {
    const former = base({ id: "former", lengthCm: 80, weightG: 2000 });
    const current = base({ id: "current", lengthCm: 90, weightG: 3000 });
    expect(absoluteRecordIds([former, current])).toEqual(new Set(["current"]));
    expect(
      scoreCatch(current, { isAbsoluteRecord: true }) - scoreCatch(current),
    ).toBe(250);
  });
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
    expect(fisherRank(4999)).toBe("Bajo");
    expect(fisherRank(5000)).toBe("Alto");
    expect(fisherRank(10000)).toBe("Maestro");
    expect(nextRankMessage(4900)).toContain("100 RP");
    expect(nextRankMessage(10000)).toContain("máximo");
  });
});
