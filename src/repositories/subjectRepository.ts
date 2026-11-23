// subjectRepository.ts — SQL for the "subjects" table (like a DAO class in Java).

import type { DateString, Subject, SubjectWithCounts } from '../models/types';
import { getDb } from '../db/database';
import { nowTimestamp } from '../utils/clock';

interface SubjectRow {
  id: number;
  name: string;
  color: string;
  exam_date: string | null;
  created_at: string;
}

interface SubjectCountsRow extends SubjectRow {
  deck_count: number;
  card_count: number;
  due_count: number;
}

function toSubject(row: SubjectRow): Subject {
  return { id: row.id, name: row.name, color: row.color, examDate: row.exam_date, createdAt: row.created_at };
}

/** All subjects with the number of decks, cards and cards due today. */
export async function getAllWithCounts(today: DateString): Promise<SubjectWithCounts[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SubjectCountsRow>(
    `SELECT s.*,
            (SELECT COUNT(*) FROM decks d WHERE d.subject_id = s.id) AS deck_count,
            (SELECT COUNT(*) FROM cards c JOIN decks d ON d.id = c.deck_id WHERE d.subject_id = s.id) AS card_count,
            (SELECT COUNT(*) FROM cards c JOIN decks d ON d.id = c.deck_id
              WHERE d.subject_id = s.id AND c.due_date <= ?) AS due_count
       FROM subjects s
      ORDER BY s.name COLLATE NOCASE`,
    [today],
  );
  return rows.map(r => ({ ...toSubject(r), deckCount: r.deck_count, cardCount: r.card_count, dueCount: r.due_count }));
}

export async function getById(id: number): Promise<Subject | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SubjectRow>('SELECT * FROM subjects WHERE id = ?', [id]);
  return row ? toSubject(row) : null;
}

/** Subjects whose exam date is set (used for exam badges on the Today screen). */
export async function getWithExam(): Promise<Subject[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SubjectRow>('SELECT * FROM subjects WHERE exam_date IS NOT NULL ORDER BY exam_date');
  return rows.map(toSubject);
}

export async function create(name: string, color: string): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync('INSERT INTO subjects (name, color, created_at) VALUES (?, ?, ?)', [
    name,
    color,
    nowTimestamp(),
  ]);
  return result.lastInsertRowId;
}

export async function update(id: number, name: string, color: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE subjects SET name = ?, color = ? WHERE id = ?', [name, color, id]);
}

export async function setExamDate(id: number, examDate: DateString | null): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE subjects SET exam_date = ? WHERE id = ?', [examDate, id]);
}

/** Deletes the subject. CASCADE also deletes its decks, cards and review logs. */
export async function remove(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM subjects WHERE id = ?', [id]);
}
