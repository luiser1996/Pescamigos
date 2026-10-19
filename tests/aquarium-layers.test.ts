import { describe, expect, it } from "vitest";
import { reorderDecorations } from "@/lib/aquarium-layers";

const items = [
  { id: "a", layer: 0 },
  { id: "b", layer: 1 },
  { id: "c", layer: 2 },
];

describe("reorderDecorations", () => {
  it("moves decorations one layer at a time", () => {
    expect(
      reorderDecorations(items, "b", "raise").map((item) => item.id),
    ).toEqual(["a", "c", "b"]);
    expect(
      reorderDecorations(items, "b", "lower").map((item) => item.id),
    ).toEqual(["b", "a", "c"]);
  });

  it("sends decorations to either extreme", () => {
    expect(
      reorderDecorations(items, "b", "front").map((item) => item.id),
    ).toEqual(["a", "c", "b"]);
    expect(
      reorderDecorations(items, "b", "back").map((item) => item.id),
    ).toEqual(["b", "a", "c"]);
  });
});
