import { describe, expect, it } from "vitest";
import { catchEditSchema } from "@/lib/validation";
import { mostCaughtSpecies } from "@/lib/statistics";
import { imageErrorMessage } from "@/lib/upload-errors";

describe("edición del peso", () => {
  const input = {
    speciesId: "s",
    placeId: "p",
    caughtAt: new Date(),
    lengthCm: 30,
    mode: "RIVER",
    disposition: "RELEASED",
  };
  it.each(["", null, undefined])(
    "convierte el peso vacío %s en null para borrarlo",
    (weightG) => {
      expect(catchEditSchema.parse({ ...input, weightG }).weightG).toBeNull();
    },
  );
  it("conserva el peso introducido", () => {
    expect(catchEditSchema.parse({ ...input, weightG: "450" }).weightG).toBe(
      450,
    );
  });
});

describe("estadísticas de especies", () => {
  it("no inventa una especie cuando no hay capturas", () =>
    expect(mostCaughtSpecies([])).toBeUndefined());
  it("cuenta por identificador y elige la más pescada", () => {
    const species = { id: "bass", commonName: "Black bass" };
    expect(
      mostCaughtSpecies([
        { species },
        { species },
        { species: { id: "trout", commonName: "Trucha" } },
      ]),
    ).toEqual({ name: "Black bass", count: 2 });
  });
});

describe("errores de imagen", () => {
  it("no muestra rutas internas en errores desconocidos", () => {
    expect(
      imageErrorMessage(new Error("/private/photos/internal failure")),
    ).not.toContain("/private");
  });
  it("explica cuando no queda espacio", () => {
    expect(
      imageErrorMessage(
        Object.assign(new Error("write failed"), { code: "ENOSPC" }),
      ),
    ).toMatch(/espacio/i);
  });
});
