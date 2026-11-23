// deckRepository.ts — SQL for the "decks" table.

import type { DateString, Deck, DeckWithCounts } from '../models/types';
import { getDb } from '../db/database';
import { nowTimestamp } from '../utils/clock';

interface DeckRow {
  id: number;
  subject_id: number;
  name: string;
  created_at: string;
}

interface DeckCountsRow extends DeckRow {
  card_count: number;
  due_count: number;
}

function toDeck(row: DeckRow): Deck {
  return { id: row.id, subjectId: row.subject_id, name: row.name, createdAt: row.created_at };
}

/** Decks of one subject with the number of cards and cards due today. */
export async function getBySubject(subjectId: number, today: DateString): Promise<DeckWithCounts[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DeckCountsRow>(
    `SELECT d.*,
            COUNT(c.id) AS card_count,
            COALESCE(SUM(CASE WHEN c.due_date <= ? THEN 1 ELSE 0 END), 0) AS due_count
       FROM decks d
       LEFT JOIN cards c ON c.deck_id = d.id
      WHERE d.subject_id = ?
      GROUP BY d.id
      ORDER BY d.name COLLATE NOCASE`,
    [today, subjectId],
  );
  return rows.map(r => ({ ...toDeck(r), cardCount: r.card_count, dueCount: r.due_count }));
}

export interface DueDeck {
  deckId: number;
  deckName: string;
  subjectId: number;
  subjectName: string;
  subjectColor: string;
  examDate: DateString | null;
  dueCount: number;
}

/** All decks that have cards due today (for the Today screen). */
export async function getDueDecks(today: DateString): Promise<DueDeck[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    deck_id: number;
    deck_name: string;
    subject_id: number;
    subject_name: string;
    subject_color: string;
    exam_date: string | null;
    due_count: number;
  }>(
    `SELECT d.id AS deck_id, d.name AS deck_name, s.id AS subject_id, s.name AS subject_name,
            s.color AS subject_color, s.exam_date AS exam_date, COUNT(c.id) AS due_count
       FROM cards c
       JOIN decks d ON d.id = c.deck_id
       JOIN subjects s ON s.id = d.subject_id
      WHERE c.due_date <= ?
      GROUP BY d.id
      ORDER BY s.name COLLATE NOCASE, d.name COLLATE NOCASE`,
    [today],
  );
  return rows.map(r => ({
    deckId: r.deck_id,
    deckName: r.deck_name,
    subjectId: r.subject_id,
    subjectName: r.subject_name,
    subjectColor: r.subject_color,
    examDate: r.exam_date,
    dueCount: r.due_count,
  }));
}

export async function getById(id: number): Promise<Deck | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DeckRow>('SELECT * FROM decks WHERE id = ?', [id]);
  return row ? toDeck(row) : null;
}

export async function create(subjectId: number, name: string): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync('INSERT INTO decks (subject_id, name, created_at) VALUES (?, ?, ?)', [
    subjectId,
    name,
    nowTimestamp(),
  ]);
  return result.lastInsertRowId;
}

export async function rename(id: number, name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE decks SET name = ? WHERE id = ?', [name, id]);
}

/** Deletes the deck. CASCADE also deletes its cards and their review logs. */
export async function remove(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM decks WHERE id = ?', [id]);
}
