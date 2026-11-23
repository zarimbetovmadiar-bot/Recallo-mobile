// seed.ts — writes demo data into the database, or deletes everything.
// Used from the Settings screen ("Load demo data", "Delete all data").

import { getDb, inTransaction } from './database';
import { buildDemoData } from './demoData';
import { nowTimestamp, today } from '../utils/clock';

/** Deletes all subjects, decks, cards and review history. */
export async function deleteAllData(): Promise<void> {
  const db = await getDb();
  await inTransaction(async () => {
    await db.runAsync('DELETE FROM review_logs');
    await db.runAsync('DELETE FROM cards');
    await db.runAsync('DELETE FROM decks');
    await db.runAsync('DELETE FROM subjects');
  });
}

/** Replaces all data with the demo data (see demoData.ts). */
export async function loadDemoData(): Promise<void> {
  const db = await getDb();
  const t = today();
  const created = nowTimestamp();
  const subjects = buildDemoData(t);

  await inTransaction(async () => {
    await db.runAsync('DELETE FROM review_logs');
    await db.runAsync('DELETE FROM cards');
    await db.runAsync('DELETE FROM decks');
    await db.runAsync('DELETE FROM subjects');

    for (const subject of subjects) {
      const s = await db.runAsync('INSERT INTO subjects (name, color, created_at) VALUES (?, ?, ?)', [
        subject.name,
        subject.color,
        created,
      ]);
      for (const deck of subject.decks) {
        const d = await db.runAsync('INSERT INTO decks (subject_id, name, created_at) VALUES (?, ?, ?)', [
          s.lastInsertRowId,
          deck.name,
          created,
        ]);
        for (const card of deck.cards) {
          const c = await db.runAsync(
            `INSERT INTO cards (deck_id, question, answer, ease_factor, repetitions, interval_days,
                                due_date, last_reviewed_date, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              d.lastInsertRowId,
              card.question,
              card.answer,
              card.state.easeFactor,
              card.state.repetitions,
              card.state.intervalDays,
              card.dueDate,
              card.lastReviewedDate,
              created,
            ],
          );
          for (const log of card.logs) {
            await db.runAsync(
              `INSERT INTO review_logs (card_id, reviewed_date, reviewed_at, rating, quality, ef_before, ef_after,
                                        interval_before, sm2_interval, actual_interval, due_date_after, exam_capped)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
              [
                c.lastInsertRowId,
                log.reviewedDate,
                `${log.reviewedDate}T12:00:00.000Z`,
                log.rating,
                log.quality,
                log.efBefore,
                log.efAfter,
                log.intervalBefore,
                log.sm2Interval,
                log.actualInterval,
                log.dueDateAfter,
              ],
            );
          }
        }
      }
    }
  });
}
