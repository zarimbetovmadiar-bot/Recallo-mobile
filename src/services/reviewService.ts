// reviewService.ts — the review session: which cards to show and what happens after a rating.
//
// This is the place where SM-2 and Exam Mode meet. They do not know about each
// other: this service calls SM-2 first and then passes its result to Exam Mode.

import type { CardWithContext, Rating, ReviewResult } from '../models/types';
import * as cards from '../repositories/cardRepository';
import * as logs from '../repositories/reviewLogRepository';
import { inTransaction } from '../db/database';
import { sm2Review } from '../scheduling/sm2';
import { qualityOf } from '../scheduling/ratings';
import { computeDueDate, isExamActive, sortForExam } from '../scheduling/examScheduler';
import { daysBetween } from '../utils/dates';
import { nowTimestamp, today } from '../utils/clock';

export interface SessionFilter {
  deckId?: number;
  subjectId?: number;
}

/**
 * Cards for a session, in the order they should be shown:
 * cards of subjects with an upcoming exam first (in Exam Mode priority order),
 * then all other due cards (oldest due date first).
 */
export async function getSessionCards(filter: SessionFilter = {}): Promise<CardWithContext[]> {
  const t = today();
  const due = await cards.getDue(t, filter);
  const examCards = due.filter(c => isExamActive(t, c.examDate));
  const otherCards = due.filter(c => !isExamActive(t, c.examDate));
  return [...sortForExam(examCards), ...otherCards];
}

/**
 * Adaptation A3: SM-2 multiplies the interval the card actually "survived".
 * If a card is reviewed earlier than planned (e.g. because Exam Mode moved it),
 * only the days that really passed count.
 */
export function previousIntervalFor(card: CardWithContext, onDay: string): number {
  if (card.lastReviewedDate === null) return card.intervalDays;
  const elapsed = daysBetween(card.lastReviewedDate, onDay);
  return Math.max(1, Math.min(card.intervalDays, elapsed));
}

/** Saves one rating: SM-2 -> Exam Mode -> card update + review log (one transaction). */
export async function rateCard(cardId: number, rating: Rating): Promise<ReviewResult> {
  const t = today();
  const card = await cards.getWithContext(cardId);
  if (!card) throw new Error(`Card ${cardId} was not found`);

  const quality = qualityOf(rating);
  const previousIntervalDays = previousIntervalFor(card, t);

  // 1. SM-2: the new EF, n and I.
  const next = sm2Review(card, quality, previousIntervalDays);

  // 2. Exam Mode: the real date (never later than the exam's eve).
  const schedule = computeDueDate(t, next.intervalDays, card.examDate);

  // 3. Save both changes together.
  await inTransaction(async () => {
    await cards.updateSchedule(card.id, next, schedule.dueDate, t);
    await logs.insert({
      cardId: card.id,
      reviewedDate: t,
      reviewedAt: nowTimestamp(),
      rating,
      quality,
      efBefore: card.easeFactor,
      efAfter: next.easeFactor,
      intervalBefore: card.intervalDays,
      sm2Interval: next.intervalDays,
      actualInterval: schedule.actualIntervalDays,
      dueDateAfter: schedule.dueDate,
      examCapped: schedule.capped,
    });
  });

  return {
    cardId: card.id,
    rating,
    sm2IntervalDays: next.intervalDays,
    actualIntervalDays: schedule.actualIntervalDays,
    dueDate: schedule.dueDate,
    capped: schedule.capped,
    examDate: card.examDate,
    easeFactorBefore: card.easeFactor,
    easeFactorAfter: next.easeFactor,
  };
}

export function getCardHistory(cardId: number) {
  return logs.getByCard(cardId);
}
