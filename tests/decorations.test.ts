import { describe, expect, it } from "vitest";
import {
  chestsForPoints,
  decorationOdds,
  decorations,
  remainingChests,
} from "@/lib/decorations";

describe("cofres y decoraciones", () => {
  it("entrega un cofre base y uno adicional por cada 300 RP", () => {
    expect(chestsForPoints(0)).toBe(1);
    expect(chestsForPoints(299)).toBe(1);
    expect(chestsForPoints(350)).toBe(2);
    expect(chestsForPoints(630)).toBe(3);
  });

  it("calcula los cofres pendientes con un contador permanente de aperturas", () => {
    expect(remainingChests(7, 4)).toBe(3);
    expect(remainingChests(7, 7)).toBe(0);
    expect(remainingChests(7, 9)).toBe(0);
  });

  it("contiene toda la pool y probabilidades completas", () => {
    expect(decorations.filter((item) => item.rarity === "COMMON")).toHaveLength(
      17,
    );
    expect(decorations.filter((item) => item.rarity === "RARE")).toHaveLength(
      12,
    );
    expect(
      decorations.filter((item) => item.rarity === "VERY_RARE"),
    ).toHaveLength(6);
    expect(
      decorations.filter((item) => item.rarity === "LEGENDARY"),
    ).toHaveLength(2);
    expect(
      Object.values(decorationOdds).reduce((sum, value) => sum + value, 0),
    ).toBe(100);
  });
});
