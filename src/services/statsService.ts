// statsService.ts — collects raw numbers from the database and lets the
// pure functions in statsCalculator.ts turn them into statistics.

import * as cards from '../repositories/cardRepository';
import * as logs from '../repositories/reviewLogRepository';
import * as decks from '../repositories/deckRepository';
import { activityByDay, currentStreak, DayCount, progressBreakdown, ProgressBreakdown } from '../stats/statsCalculator';
import { addDays } from '../utils/dates';
import { today } from '../utils/clock';

export const ACTIVITY_DAYS = 14;

export interface Dashboard {
  today: string;
  totalCards: number;
  dueToday: number;
  reviewedToday: number;
  totalReviews: number;
  streak: number;
  progress: ProgressBreakdown;
  activity: DayCount[];
}

export async function getDashboard(): Promise<Dashboard> {
  const t = today();
  const [allCards, dueToday, reviewedToday, totalReviews, days, counts] = await Promise.all([
    cards.getAllForStats(),
    cards.countDue(t),
    logs.countCardsReviewedOn(t),
    logs.countAll(),
    logs.distinctDays(),
    logs.countsByDay(addDays(t, -(ACTIVITY_DAYS - 1))),
  ]);
  return {
    today: t,
    totalCards: allCards.length,
    dueToday,
    reviewedToday,
    totalReviews,
    streak: currentStreak(days, t),
    progress: progressBreakdown(allCards),
    activity: activityByDay(counts, t, ACTIVITY_DAYS),
  };
}

/** Data for the Today screen. */
export async function getTodaySummary() {
  const t = today();
  const [dueDecks, reviewedToday, days] = await Promise.all([
    decks.getDueDecks(t),
    logs.countCardsReviewedOn(t),
    logs.distinctDays(),
  ]);
  return {
    today: t,
    dueDecks,
    dueTotal: dueDecks.reduce((sum, d) => sum + d.dueCount, 0),
    reviewedToday,
    streak: currentStreak(days, t),
  };
}
