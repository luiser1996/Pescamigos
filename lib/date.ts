export const APP_TIME_ZONE = "Europe/Madrid";

export function dateFromLocalForm(formData: FormData) {
  const value = String(formData.get("caughtAt") ?? "");
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value,
  );
  const offset = Number(formData.get("caughtAtTimezoneOffset"));
  if (!match || !Number.isFinite(offset) || Math.abs(offset) > 14 * 60)
    return value;
  const [, year, month, day, hour, minute, second = "0"] = match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ) +
      offset * 60_000,
  );
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("es-ES", { timeZone: APP_TIME_ZONE });
}

export function formatDateTime(date: Date) {
  return date.toLocaleString("es-ES", { timeZone: APP_TIME_ZONE });
}

export function monthInAppTimeZone(date: Date) {
  return (
    Number(
      new Intl.DateTimeFormat("en", {
        month: "numeric",
        timeZone: APP_TIME_ZONE,
      }).format(date),
    ) - 1
  );
}
