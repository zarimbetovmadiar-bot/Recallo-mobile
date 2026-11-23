// statsCalculator.ts — pure functions for the statistics screen.
// The database gives raw rows; these functions turn them into numbers for the UI.

import type { DateString } from '../models/types';
import { addDays, dateRange } from '../utils/dates';

/** A card counts as "learned" (mature) when SM-2 plans it 21 or more days ahead. */
export const MATURE_INTERVAL_DAYS = 21;

export interface CardProgressInput {
  intervalDays: number;
  lastReviewedDate: DateString | null;
}

export interface ProgressBreakdown {
  total: number;
  /** Never reviewed. */
  newCount: number;
  /** Reviewed, interval < 21 days. */
  learningCount: number;
  /** Interval >= 21 days. */
  matureCount: number;
  /** Share of cards that were reviewed at least once, 0..100. */
  startedPercent: number;
  /** Share of mature cards, 0..100. */
  maturePercent: number;
}

function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

export function progressBreakdown(cards: readonly CardProgressInput[]): ProgressBreakdown {
  let newCount = 0;
  let learningCount = 0;
  let matureCount = 0;
  for (const c of cards) {
    if (c.lastReviewedDate === null) newCount++;
    else if (c.intervalDays >= MATURE_INTERVAL_DAYS) matureCount++;
    else learningCount++;
  }
  const total = cards.length;
  return {
    total,
    newCount,
    learningCount,
    matureCount,
    startedPercent: percent(learningCount + matureCount, total),
    maturePercent: percent(matureCount, total),
  };
}

export interface DayCount {
  date: DateString;
  count: number;
}

/**
 * Activity for the last `days` days (oldest first, today last).
 * Days without reviews are filled with 0, so the chart always has `days` bars.
 */
export function activityByDay(rows: readonly DayCount[], today: DateString, days = 14): DayCount[] {
  const byDate = new Map<DateString, number>();
  for (const r of rows) byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.count);
  return dateRange(addDays(today, -(days - 1)), today).map(date => ({ date, count: byDate.get(date) ?? 0 }));
}

/**
 * Study streak: days in a row with at least one review, counting back from today.
 * If there is no review today yet, we start from yesterday: the streak is not
 * lost until the day is over.
 */
export function currentStreak(reviewDates: readonly DateString[], today: DateString): number {
  const days = new Set(reviewDates);
  let day = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}
