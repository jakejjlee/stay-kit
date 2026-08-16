/**
 * Every date in this kit goes through here.
 *
 * A bare `new Date("2026-08-21")` parses as UTC midnight and renders as the
 * 20th anywhere west of Greenwich, which is how a lease end date silently
 * moves by a day. Nothing here builds a date from a string without a zone.
 */

/** The calendar date at a given instant in a given zone, as YYYY-MM-DD. */
export function zonedDateStamp(at: Date, tz: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/**
 * The soonest a stay can begin, given an approval runway.
 * Counted from today in the property's zone, so someone browsing at 10pm
 * Eastern is not quoted tomorrow's runway.
 */
export function earliestStart(from: Date, leadDays: number, tz: string): string {
  const [y, m, d] = zonedDateStamp(from, tz).split("-").map(Number);
  // Arithmetic runs on a UTC instant built from already-zoned parts, so it
  // cannot drift across a daylight-saving boundary.
  return new Date(Date.UTC(y, m - 1, d) + leadDays * 86_400_000).toISOString().slice(0, 10);
}

/**
 * An ISO calendar date as long form.
 *
 * Takes no timezone on purpose. "2026-08-21" is a lease end date, not an
 * instant: it means the 21st everywhere, and converting it through a zone is
 * how it renders as the 22nd in Auckland and the 20th in Los Angeles. Built at
 * UTC midnight and formatted in UTC, so it cannot move.
 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}
