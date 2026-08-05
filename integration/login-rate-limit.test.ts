import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl =
  process.env.E2E_DATABASE_URL ??
  "postgresql://pescamigos:pescamigos_e2e@127.0.0.1:5433/pescamigos_e2e?schema=public";
process.env.DATABASE_URL = databaseUrl;
process.env.LOGIN_RATE_LIMIT_SECRET = "integration-only-secret";

let prisma: typeof import("@/lib/prisma").prisma;
let registerLoginAttempt: typeof import("@/lib/login-rate-limit").registerLoginAttempt;
let clearLoginThrottle: typeof import("@/lib/login-rate-limit").clearLoginThrottle;

beforeAll(async () => {
  ({ prisma } = await import("@/lib/prisma"));
  ({ registerLoginAttempt, clearLoginThrottle } =
    await import("@/lib/login-rate-limit"));
  await prisma.loginThrottle.deleteMany();
});

afterAll(async () => {
  await prisma.loginThrottle.deleteMany();
  await prisma.$disconnect();
});

describe("rate limit persistente", () => {
  it("persiste y bloquea por IP después de ocho intentos", async () => {
    let result = await registerLoginAttempt("198.51.100.20", "luis");
    for (let index = 0; index < 8; index++)
      result = await registerLoginAttempt("198.51.100.20", `otro-${index}`);
    expect(result.blocked).toBe(true);
    expect(await prisma.loginThrottle.count({ where: { scope: "ip" } })).toBe(
      1,
    );
    await clearLoginThrottle(result.keys);
  });

  it("bloquea por usuario aunque cambie la IP", async () => {
    let result = await registerLoginAttempt("198.51.100.1", "dani");
    for (let index = 0; index < 8; index++)
      result = await registerLoginAttempt(`198.51.100.${index + 2}`, "dani");
    expect(result.blocked).toBe(true);
    expect(
      await prisma.loginThrottle.count({ where: { scope: "username" } }),
    ).toBeGreaterThan(0);
  });
});
