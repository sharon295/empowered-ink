// Every month boundary in the app is America/Denver time. Months are passed
// around as "YYYY-MM" keys, which also sort correctly as plain strings.

export const TIME_ZONE = "America/Denver";

const monthKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

export function monthKeyOf(date: Date = new Date()): string {
  const parts = monthKeyFormat.formatToParts(date);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return `${year}-${month}`;
}

export function currentMonthKey(): string {
  return monthKeyOf(new Date());
}

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function shiftMonth(key: string, by: number): string {
  const [y, m] = key.split("-").map(Number);
  const index = y * 12 + (m - 1) + by;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Offset (ms) between Denver wall-clock time and UTC at the given instant.
function denverOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

// The UTC instant of midnight on the 1st of the month, Denver time.
export function startOfMonth(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, 1));
  return new Date(guess.getTime() - denverOffsetMs(new Date(guess.getTime() + 12 * 3600 * 1000)));
}

// The last moment of the month, Denver time (one millisecond before the 1st
// of the next month).
export function endOfMonth(key: string): Date {
  return new Date(startOfMonth(shiftMonth(key, 1)).getTime() - 1);
}
