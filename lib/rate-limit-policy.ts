export const LOGIN_WINDOW_MS = 15 * 60_000;
export const LOGIN_MAX_ATTEMPTS = 8;

export function nextThrottleState(
  current: { attempts: number; resetAt: Date } | null,
  now: Date,
) {
  if (!current || current.resetAt <= now)
    return {
      attempts: 1,
      resetAt: new Date(now.getTime() + LOGIN_WINDOW_MS),
      blocked: false,
    };
  const attempts = current.attempts + 1;
  return {
    attempts,
    resetAt: current.resetAt,
    blocked: current.attempts >= LOGIN_MAX_ATTEMPTS,
  };
}
