import { describe, expect, it } from "vitest";
import {
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
  nextThrottleState,
} from "@/lib/rate-limit-policy";

describe("rate limit de inicio de sesión", () => {
  it("crea una ventana temporal para el primer intento", () => {
    const now = new Date("2026-08-05T10:00:00Z");
    expect(nextThrottleState(null, now)).toEqual({
      attempts: 1,
      resetAt: new Date(now.getTime() + LOGIN_WINDOW_MS),
      blocked: false,
    });
  });

  it("bloquea después del máximo sin ampliar la ventana", () => {
    const now = new Date("2026-08-05T10:00:00Z");
    const resetAt = new Date(now.getTime() + LOGIN_WINDOW_MS);
    expect(
      nextThrottleState({ attempts: LOGIN_MAX_ATTEMPTS, resetAt }, now),
    ).toEqual({ attempts: LOGIN_MAX_ATTEMPTS + 1, resetAt, blocked: true });
  });

  it("reinicia un contador cuya ventana ha caducado", () => {
    const now = new Date("2026-08-05T10:30:00Z");
    const result = nextThrottleState(
      { attempts: 100, resetAt: new Date("2026-08-05T10:20:00Z") },
      now,
    );
    expect(result.attempts).toBe(1);
    expect(result.blocked).toBe(false);
  });
});
