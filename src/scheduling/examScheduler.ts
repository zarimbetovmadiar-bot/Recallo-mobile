// examScheduler.ts — Exam Mode, our own addition on top of SM-2.
//
// The idea: SM-2 does not know when your exam is. It may plan the next review
// for a day AFTER the exam. Exam Mode moves such reviews earlier, so every card
// is seen again before the exam.
//
// Important rules (see docs/EXAM_MODE.md):
// - Exam Mode NEVER changes the SM-2 state (EF, n, I). It only changes the date.
// - It never moves a card later, only earlier.
// - D = days from today to the exam. Exam Mode is active when D >= 1.
//
// Rule 1 (cap):        actualInterval = min(sm2Interval, max(1, D - 1))
// Rule 2 (pull):       when an exam is set, cards due after the exam's eve move earlier
// Rule 3 (priority):   most overdue first, then lowest EF, then fewest repetitions
// Rule 4 (daily plan): dailyTarget = ceil(N / D)
//
// All functions here are pure: no database, no screen.

import type { DateString } from '../models/types';
import { addDays, dateRange, daysBetween } from '../utils/dates';

/** The fields of a card that Exam Mode needs. */
export interface SchedulableCard {
  id: number;
  dueDate: DateString;
  easeFactor: number;
  repetitions: number;
}

export interface DueDateResult {
  dueDate: DateString;
  actualIntervalDays: number;
  /** True when Exam Mode made the interval shorter than SM-2 wanted. */
  capped: boolean;
}

export interface DueDateChange {
  id: number;
  dueDate: DateString;
}

export interface ForecastDay {
  date: DateString;
  count: number;
}

export interface ExamPlan {
  examDate: DateString;
  daysLeft: number;
  /** Last day for reviews before the exam (the exam's eve). */
  lastReviewDay: DateString;
  /** N: cards that must be reviewed before the exam. */
  cardsToReview: number;
  /** ceil(N / D): how many cards to review per day. */
  dailyTarget: number;
  /** Cards due on each day from today to the exam's eve. Overdue cards count for today. */
  forecast: ForecastDay[];
}

/** D: number of days from today to the exam (negative after the exam). */
export function daysUntilExam(today: DateString, examDate: DateString): number {
  return daysBetween(today, examDate);
}

/** Exam Mode works only while the exam is in the future (D >= 1). */
export function isExamActive(today: DateString, examDate: DateString | null): examDate is DateString {
  return examDate !== null && daysUntilExam(today, examDate) >= 1;
}

/** The longest interval allowed by Exam Mode, or null when Exam Mode is off. */
export function intervalCap(today: DateString, examDate: DateString | null): number | null {
  if (!isExamActive(today, examDate)) return null;
  return Math.max(1, daysUntilExam(today, examDate) - 1);
}

/** Rule 1: turns the SM-2 interval into a real due date. */
export function computeDueDate(today: DateString, sm2IntervalDays: number, examDate: DateString | null): DueDateResult {
  const cap = intervalCap(today, examDate);
  const actualIntervalDays = cap === null ? sm2IntervalDays : Math.min(sm2IntervalDays, cap);
  return {
    dueDate: addDays(today, actualIntervalDays),
    actualIntervalDays,
    capped: actualIntervalDays < sm2IntervalDays,
  };
}

/** Rule 3: order of cards in a review session while an exam is coming. Returns a new array. */
export function sortForExam<T extends SchedulableCard>(cards: readonly T[]): T[] {
  return [...cards].sort((a, b) => {
    if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1; // earlier due date = more overdue
    if (a.easeFactor !== b.easeFactor) return a.easeFactor - b.easeFactor; // harder first
    if (a.repetitions !== b.repetitions) return a.repetitions - b.repetitions; // less practised first
    return a.id - b.id;
  });
}

/**
 * Rule 2: when an exam date is set, cards due after the exam's eve must move earlier.
 * Returns only the cards that change.
 *
 * spread = false: all of them move to the exam's eve (simple version).
 * spread = true:  they are spread evenly from tomorrow to the exam's eve,
 *                 hardest cards (lowest EF) first, so no single day gets overloaded.
 */
export function pullForwardForExam<T extends SchedulableCard>(
  cards: readonly T[],
  today: DateString,
  examDate: DateString | null,
  spread = true,
): DueDateChange[] {
  if (!isExamActive(today, examDate)) return [];
  const lastDay = addDays(examDate, -1);
  const late = cards.filter(c => c.dueDate > lastDay);
  if (late.length === 0) return [];
  if (!spread) return late.map(c => ({ id: c.id, dueDate: lastDay }));

  let firstDay = addDays(today, 1);
  if (firstDay > lastDay) firstDay = lastDay; // exam is tomorrow: only today is left
  const dayCount = daysBetween(firstDay, lastDay) + 1;
  const ordered = [...late].sort((a, b) => a.easeFactor - b.easeFactor || a.id - b.id);
  return ordered.map((c, i) => ({
    id: c.id,
    dueDate: addDays(firstDay, Math.floor((i * dayCount) / ordered.length)),
  }));
}

/** Rule 4: the study plan shown on the exam screen. Null when Exam Mode is off. */
export function planForExam(
  cards: readonly SchedulableCard[],
  today: DateString,
  examDate: DateString | null,
): ExamPlan | null {
  if (!isExamActive(today, examDate)) return null;
  const daysLeft = daysUntilExam(today, examDate);
  const lastReviewDay = addDays(examDate, -1);
  const mustReview = cards.filter(c => c.dueDate <= lastReviewDay);
  const forecast = dateRange(today, lastReviewDay).map(date => ({
    date,
    count: mustReview.filter(c => (date === today ? c.dueDate <= today : c.dueDate === date)).length,
  }));
  return {
    examDate,
    daysLeft,
    lastReviewDay,
    cardsToReview: mustReview.length,
    dailyTarget: Math.ceil(mustReview.length / daysLeft),
    forecast,
  };
}
