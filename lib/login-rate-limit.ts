import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { nextThrottleState } from "@/lib/rate-limit-policy";

function digest(scope: string, value: string) {
  const secret =
    process.env.LOGIN_RATE_LIMIT_SECRET ??
    process.env.POSTGRES_PASSWORD ??
    (process.env.NODE_ENV === "production" ? "" : "development-only");
  if (!secret)
    throw new Error("LOGIN_RATE_LIMIT_SECRET es obligatorio en producción");
  return createHmac("sha256", secret).update(`${scope}:${value}`).digest("hex");
}

export async function registerLoginAttempt(ip: string, username: string) {
  const now = new Date();
  const keys = [
    { scope: "ip", keyHash: digest("ip", ip) },
    { scope: "username", keyHash: digest("username", username.toLowerCase()) },
  ];
  let blocked = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      blocked = await prisma.$transaction(
        async (tx) => {
          await tx.loginThrottle.deleteMany({
            where: { resetAt: { lte: now } },
          });
          let denied = false;
          for (const key of keys) {
            const current = await tx.loginThrottle.findUnique({
              where: { scope_keyHash: key },
            });
            const next = nextThrottleState(current, now);
            denied ||= next.blocked;
            await tx.loginThrottle.upsert({
              where: { scope_keyHash: key },
              create: { ...key, attempts: next.attempts, resetAt: next.resetAt },
              update: { attempts: next.attempts, resetAt: next.resetAt },
            });
          }
          return denied;
        },
        { isolationLevel: "Serializable" },
      );
      break;
    } catch (error) {
      if (
        attempt === 2 ||
        typeof error !== "object" ||
        error === null ||
        !("code" in error) ||
        error.code !== "P2034"
      )
        throw error;
    }
  }
  if (blocked)
    console.warn(
      JSON.stringify({
        event: "login_rate_limited",
        ipKey: keys[0].keyHash.slice(0, 12),
        usernameKey: keys[1].keyHash.slice(0, 12),
      }),
    );
  return { blocked, keys };
}

export async function clearLoginThrottle(
  keys: { scope: string; keyHash: string }[],
) {
  await prisma.loginThrottle.deleteMany({
    where: {
      OR: keys.map((key) => ({ scope: key.scope, keyHash: key.keyHash })),
    },
  });
}
