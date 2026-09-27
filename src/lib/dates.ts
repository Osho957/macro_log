/** Returns today's date as YYYY-MM-DD in the browser's local timezone. */
export function todayLocalDate(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

/**
 * Returns today's date as YYYY-MM-DD in an IANA timezone (e.g. from
 * user_settings.timezone). Use this on the server, where the process clock
 * is not necessarily the user's own timezone.
 */
export function todayInTimezone(timeZone: string): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone });
  } catch {
    return todayLocalDate();
  }
}

export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
