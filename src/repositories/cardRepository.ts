// cardRepository.ts — SQL for the "cards" table.

import type { Card, CardWithContext, DateString, Sm2State } from '../models/types';
import { getDb } from '../db/database';
import { nowTimestamp } from '../utils/clock';
import { NEW_CARD_STATE } from '../scheduling/sm2';

interface CardRow {
  id: number;
  deck_id: number;
  question: string;
  answer: string;
  ease_factor: number;
  repetitions: number;
  interval_days: number;
  due_date: string;
  last_reviewed_date: string | null;
  created_at: string;
}

interface CardContextRow extends CardRow {
  deck_name: string;
  subject_id: number;
  subject_name: string;
  subject_color: string;
  exam_date: string | null;
}

function toCard(row: CardRow): Card {
  return {
    id: row.id,
    deckId: row.deck_id,
    question: row.question,
    answer: row.answer,
    easeFactor: row.ease_factor,
    repetitions: row.repetitions,
    intervalDays: row.interval_days,
    dueDate: row.due_date,
    lastReviewedDate: row.last_reviewed_date,
    createdAt: row.created_at,
  };
}

function toCardWithContext(row: CardContextRow): CardWithContext {
  return {
    ...toCard(row),
    deckName: row.deck_name,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    subjectColor: row.subject_color,
    examDate: row.exam_date,
  };
}

const SELECT_WITH_CONTEXT = `
  SELECT c.*, d.name AS deck_name, s.id AS subject_id, s.name AS subject_name,
         s.color AS subject_color, s.exam_date AS exam_date
    FROM cards c
    JOIN decks d ON d.id = c.deck_id
    JOIN subjects s ON s.id = d.subject_id`;

export async function getByDeck(deckId: number): Promise<Card[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CardRow>('SELECT * FROM cards WHERE deck_id = ? ORDER BY id', [deckId]);
  return rows.map(toCard);
}

export async function getBySubject(subjectId: number): Promise<Card[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CardRow>(
    `SELECT c.* FROM cards c JOIN decks d ON d.id = c.deck_id WHERE d.subject_id = ? ORDER BY c.id`,
    [subjectId],
  );
  return rows.map(toCard);
}

export async function getWithContext(id: number): Promise<CardWithContext | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CardContextRow>(`${SELECT_WITH_CONTEXT} WHERE c.id = ?`, [id]);
  return row ? toCardWithContext(row) : null;
}

export interface DueFilter {
  deckId?: number;
  subjectId?: number;
}

/** Cards due on or before `today`, optionally only one deck or one subject. */
export async function getDue(today: DateString, filter: DueFilter = {}): Promise<CardWithContext[]> {
  const db = await getDb();
  const where = ['c.due_date <= ?'];
  const params: (string | number)[] = [today];
  if (filter.deckId !== undefined) {
    where.push('c.deck_id = ?');
    params.push(filter.deckId);
  }
  if (filter.subjectId !== undefined) {
    where.push('s.id = ?');
    params.push(filter.subjectId);
  }
  const rows = await db.getAllAsync<CardContextRow>(
    `${SELECT_WITH_CONTEXT} WHERE ${where.join(' AND ')} ORDER BY c.due_date, c.id`,
    params,
  );
  return rows.map(toCardWithContext);
}

/** Only the columns statistics need, for every card. */
export async function getAllForStats(): Promise<{ intervalDays: number; lastReviewedDate: DateString | null }[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ interval_days: number; last_reviewed_date: string | null }>(
    'SELECT interval_days, last_reviewed_date FROM cards',
  );
  return rows.map(r => ({ intervalDays: r.interval_days, lastReviewedDate: r.last_reviewed_date }));
}

export async function countDue(today: DateString): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM cards WHERE due_date <= ?', [today]);
  return row?.n ?? 0;
}

/** A new card is due today and has the starting SM-2 state. */
export async function create(deckId: number, question: string, answer: string, today: DateString): Promise<number> {
  const db = await getDb();
  const s = NEW_CARD_STATE;
  const result = await db.runAsync(
    `INSERT INTO cards (deck_id, question, answer, ease_factor, repetitions, interval_days, due_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [deckId, question, answer, s.easeFactor, s.repetitions, s.intervalDays, today, nowTimestamp()],
  );
  return result.lastInsertRowId;
}

/** Changes only the text. The SM-2 state is kept (plan test T1.4). */
export async function updateText(id: number, question: string, answer: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE cards SET question = ?, answer = ? WHERE id = ?', [question, answer, id]);
}

/** Saves the result of a review: new SM-2 state and the next due date. */
export async function updateSchedule(id: number, state: Sm2State, dueDate: DateString, reviewedDate: DateString): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE cards SET ease_factor = ?, repetitions = ?, interval_days = ?, due_date = ?, last_reviewed_date = ?
      WHERE id = ?`,
    [state.easeFactor, state.repetitions, state.intervalDays, dueDate, reviewedDate, id],
  );
}

/** Moves due dates only (used by Exam Mode). Call it inside a transaction for many cards. */
export async function setDueDate(id: number, dueDate: DateString): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE cards SET due_date = ? WHERE id = ?', [dueDate, id]);
}

/** Deletes the card. CASCADE also deletes its review logs. */
export async function remove(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
}
