import { describe, expect, it } from "vitest";
import {
  catalogCounts,
  gramsToKg,
  isDiscovered,
  kgToGrams,
  recordFor,
} from "@/lib/domain";
import { canEditCatch, catchSchema, placeSchema } from "@/lib/validation";
const data = [
  {
    speciesId: "trout",
    fisherId: "luis",
    caughtAt: new Date(),
    lengthCm: 31,
    weightG: 420,
  },
  {
    speciesId: "trout",
    fisherId: "dani",
    caughtAt: new Date(),
    lengthCm: 36,
    weightG: 500,
  },
  {
    speciesId: "bass",
    fisherId: "dani",
    caughtAt: new Date(),
    lengthCm: 20,
    weightG: null,
  },
];
describe("catálogos derivados", () => {
  it("separa el personal del conjunto", () => {
    expect(isDiscovered(data, "trout", ["luis"])).toBe(true);
    expect(isDiscovered(data, "bass", ["luis"])).toBe(false);
    expect(isDiscovered(data, "bass", ["luis", "dani"])).toBe(true);
    expect(catalogCounts(data, ["dani"]).get("trout")).toBe(1);
  });
  it("calcula récords", () =>
    expect(
      recordFor(data, "trout", ["luis", "dani"], "lengthCm")?.fisherId,
    ).toBe("dani"));
});
describe("capturas", () => {
  it("rechaza medidas imposibles", () =>
    expect(
      catchSchema.safeParse({
        speciesId: "s",
        placeId: "p",
        caughtAt: new Date(),
        lengthCm: 900,
        mode: "SHORE",
        disposition: "RELEASED",
        idempotencyKey: crypto.randomUUID(),
      }).success,
    ).toBe(false));
  it("convierte unidades", () => {
    expect(kgToGrams(1.25)).toBe(1250);
    expect(gramsToKg(750)).toBe(0.75);
  });
  it("permite omitir el peso", () =>
    expect(
      catchSchema.safeParse({
        speciesId: "s",
        placeId: "p",
        caughtAt: new Date(),
        lengthCm: 20,
        weightG: "",
        mode: "SHORE",
        disposition: "RELEASED",
        idempotencyKey: crypto.randomUUID(),
      }).success,
    ).toBe(true));
  it("valida coordenadas", () => {
    expect(
      placeSchema.safeParse({
        name: "Costa",
        latitude: 36.7,
        longitude: -3.5,
        waterType: "SALTWATER",
      }).success,
    ).toBe(true);
    expect(
      placeSchema.safeParse({
        name: "X",
        latitude: 120,
        longitude: -3.5,
        waterType: "SALTWATER",
      }).success,
    ).toBe(false);
  });
  it("aplica permisos", () => {
    expect(canEditCatch({ id: "luis", role: "MEMBER" }, "dani")).toBe(false);
    expect(canEditCatch({ id: "admin", role: "ADMIN" }, "dani")).toBe(true);
  });
});
