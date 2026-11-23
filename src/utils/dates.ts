// dates.ts — all date math of the app lives here.
//
// Rule: we store days as text 'YYYY-MM-DD' in the phone's LOCAL time zone.
// We never use date.toISOString() for a day: it uses UTC, and in Almaty (UTC+5)
// it returns yesterday's date between 00:00 and 05:00.

import type { DateString } from '../models/types';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local calendar day of a Date object, e.g. 2026-12-01. */
export function toLocalDateString(date: Date): DateString {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** True for a real calendar date like '2026-02-28' (false for '2026-02-30'). */
export function isValidDateString(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const check = new Date(Date.UTC(y, mo - 1, d));
  return check.getUTCFullYear() === y && check.getUTCMonth() === mo - 1 && check.getUTCDate() === d;
}

/** Day number since 1970-01-01. We count in UTC so daylight saving time never breaks it. */
function toDayNumber(value: DateString): number {
  const m = DATE_RE.exec(value);
  if (!m) throw new RangeError(`Not a date: ${value}`);
  return Math.round(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_PER_DAY);
}

function fromDayNumber(day: number): DateString {
  const d = new Date(day * MS_PER_DAY);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** addDays('2026-12-29', 6) === '2027-01-04'. Negative numbers go back in time. */
export function addDays(value: DateString, days: number): DateString {
  return fromDayNumber(toDayNumber(value) + days);
}

/** Number of days from `from` to `to`: daysBetween('2026-12-01', '2026-12-11') === 10. */
export function daysBetween(from: DateString, to: DateString): number {
  return toDayNumber(to) - toDayNumber(from);
}

/** All days from `from` to `to`, both included. Empty if `to` is before `from`. */
export function dateRange(from: DateString, to: DateString): DateString[] {
  const result: DateString[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) result.push(d);
  return result;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** '2026-12-01' -> 'Tue, 1 Dec' */
export function formatDay(value: DateString): string {
  const day = toDayNumber(value);
  const d = new Date(day * MS_PER_DAY);
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** '2026-12-01' -> '1 Dec' (short label for charts). */
export function formatShortDay(value: DateString): string {
  const d = new Date(toDayNumber(value) * MS_PER_DAY);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Text like 'today', 'tomorrow', 'in 6 days', '2 days ago'. */
export function relativeDays(today: DateString, value: DateString): string {
  const n = daysBetween(today, value);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}
