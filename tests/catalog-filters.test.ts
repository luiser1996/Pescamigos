import { expect, it } from "vitest";
import { sortCatalog } from "@/lib/catalog-filters";
const species = [
  { commonName: "Trucha", difficulty: 2 },
  { commonName: "Bass", difficulty: 4 },
  { commonName: "Lucio", difficulty: null },
];
it("ordena alfabéticamente por defecto", () =>
  expect(sortCatalog(species).map((s) => s.commonName)).toEqual([
    "Bass",
    "Lucio",
    "Trucha",
  ]));
it("ordena dificultad ascendente y deja desconocidas al final", () =>
  expect(
    sortCatalog(species, "difficulty-asc").map((s) => s.commonName),
  ).toEqual(["Trucha", "Bass", "Lucio"]));
it("ordena dificultad descendente y deja desconocidas al final", () =>
  expect(
    sortCatalog(species, "difficulty-desc").map((s) => s.commonName),
  ).toEqual(["Bass", "Trucha", "Lucio"]));
