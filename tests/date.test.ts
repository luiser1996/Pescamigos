import { describe, expect, it } from "vitest";
import { catchSchema } from "@/lib/validation";
import { dateFromLocalForm, formatDateTime } from "@/lib/date";

describe("capture dates", () => {
  it("converts the browser local time to UTC with its offset", () => {
    const formData = new FormData();
    formData.set("caughtAt", "2026-08-29T11:24");
    formData.set("caughtAtTimezoneOffset", "-120");
    const date = dateFromLocalForm(formData);
    expect(date).toBeInstanceOf(Date);
    expect((date as Date).toISOString()).toBe("2026-08-29T09:24:00.000Z");
    expect(formatDateTime(date as Date)).toContain("11:24");
  });

  it("allows future capture dates", () => {
    const parsed = catchSchema.safeParse({
      speciesId: "species",
      placeId: "place",
      caughtAt: new Date("2030-01-01T12:00:00.000Z"),
      lengthCm: "20",
      weightG: "",
      mode: "RIVER",
      disposition: "RELEASED",
      notes: "",
      idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(parsed.success).toBe(true);
  });
});
