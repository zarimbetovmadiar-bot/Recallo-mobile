// reviewLogRepository.ts — SQL for the "review_logs" table (the history of every rating).

import type { DateString, Rating, ReviewLog } from '../models/types';
import { getDb } from '../db/database';

interface ReviewLogRow {
  id: number;
  card_id: number;
  reviewed_date: string;
  reviewed_at: string;
  rating: Rating;
  quality: number;
  ef_before: number;
  ef_after: number;
  interval_before: number;
  sm2_interval: number;
  actual_interval: number;
  due_date_after: string;
  exam_capped: number;
}

function toLog(r: ReviewLogRow): ReviewLog {
  return {
    id: r.id,
    cardId: r.card_id,
    reviewedDate: r.reviewed_date,
    reviewedAt: r.reviewed_at,
    rating: r.rating,
    quality: r.quality,
    efBefore: r.ef_before,
    efAfter: r.ef_after,
    intervalBefore: r.interval_before,
    sm2Interval: r.sm2_interval,
    actualInterval: r.actual_interval,
    dueDateAfter: r.due_date_after,
    examCapped: r.exam_capped === 1,
  };
}

export async function insert(log: Omit<ReviewLog, 'id'>): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO review_logs (card_id, reviewed_date, reviewed_at, rating, quality, ef_before, ef_after,
                              interval_before, sm2_interval, actual_interval, due_date_after, exam_capped)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      log.cardId,
      log.reviewedDate,
      log.reviewedAt,
      log.rating,
      log.quality,
      log.efBefore,
      log.efAfter,
      log.intervalBefore,
      log.sm2Interval,
      log.actualInterval,
      log.dueDateAfter,
      log.examCapped ? 1 : 0,
    ],
  );
}

/** History of one card, newest first. */
export async function getByCard(cardId: number): Promise<ReviewLog[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ReviewLogRow>(
    'SELECT * FROM review_logs WHERE card_id = ? ORDER BY id DESC',
    [cardId],
  );
  return rows.map(toLog);
}

/** How many different cards were reviewed on that day. */
export async function countCardsReviewedOn(day: DateString): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(DISTINCT card_id) AS n FROM review_logs WHERE reviewed_date = ?',
    [day],
  );
  return row?.n ?? 0;
}

/** Number of ratings per day since `fromDay`. */
export async function countsByDay(fromDay: DateString): Promise<{ date: DateString; count: number }[]> {
  const db = await getDb();
  return db.getAllAsync<{ date: string; count: number }>(
    `SELECT reviewed_date AS date, COUNT(*) AS count
       FROM review_logs
      WHERE reviewed_date >= ?
      GROUP BY reviewed_date
      ORDER BY reviewed_date`,
    [fromDay],
  );
}

/** Every day that has at least one review (for the streak). */
export async function distinctDays(): Promise<DateString[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ d: string }>('SELECT DISTINCT reviewed_date AS d FROM review_logs');
  return rows.map(r => r.d);
}

export async function countAll(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM review_logs');
  return row?.n ?? 0;
}
