// clock.ts — the ONLY place where the app asks "what day is it today?".
//
// Why a separate module (like java.time.Clock)?
// 1. Tests can pass any date they want instead of the real one.
// 2. Demo mode: on the defense we cannot wait 6 days, so Settings can move
//    "today" forward. Only the app's idea of today changes, not the phone.
//
// The demo offset is kept in memory only: restarting the app resets it to 0.

import type { DateString } from '../models/types';
import { addDays, toLocalDateString } from './dates';

let demoOffsetDays = 0;

/** Today's date in the phone's time zone, plus the demo offset. */
export function today(): DateString {
  return addDays(toLocalDateString(new Date()), demoOffsetDays);
}

/** Exact time stamp for the review log. */
export function nowTimestamp(): string {
  return new Date().toISOString();
}

export function getDemoOffset(): number {
  return demoOffsetDays;
}

export function setDemoOffset(days: number): void {
  if (!Number.isInteger(days)) throw new RangeError('Demo offset must be a whole number of days');
  demoOffsetDays = days;
}
