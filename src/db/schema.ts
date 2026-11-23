// schema.ts — the database tables and their versions (migrations).
//
// SQLite stores a number "user_version" inside the database file.
// MIGRATIONS[0] creates version 1, MIGRATIONS[1] would create version 2, and so on.
// On start we run only the migrations that are newer than the file's version,
// so the team's test data survives schema changes.
// NEVER edit an old migration that teammates already ran: add a new one instead.

import type { SQLiteDatabase } from 'expo-sqlite';

export const MIGRATIONS: string[] = [
  // ---------- version 1 ----------
  `
  CREATE TABLE IF NOT EXISTS subjects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    color       TEXT NOT NULL DEFAULT '#4F46E5',
    exam_date   TEXT NULL,                       -- 'YYYY-MM-DD' or NULL
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS decks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cards (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id             INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    question            TEXT NOT NULL,
    answer              TEXT NOT NULL,
    ease_factor         REAL NOT NULL DEFAULT 2.5,    -- SM-2: EF
    repetitions         INTEGER NOT NULL DEFAULT 0,   -- SM-2: n
    interval_days       INTEGER NOT NULL DEFAULT 0,   -- SM-2: I (before Exam Mode)
    due_date            TEXT NOT NULL,                -- real next review day (after Exam Mode)
    last_reviewed_date  TEXT NULL,
    created_at          TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS review_logs (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id          INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    reviewed_date    TEXT NOT NULL,     -- local day, used for statistics
    reviewed_at      TEXT NOT NULL,     -- exact time stamp
    rating           TEXT NOT NULL,     -- 'forgot' | 'hard' | 'easy'
    quality          INTEGER NOT NULL,  -- SM-2 q
    ef_before        REAL NOT NULL,
    ef_after         REAL NOT NULL,
    interval_before  INTEGER NOT NULL,
    sm2_interval     INTEGER NOT NULL,
    actual_interval  INTEGER NOT NULL,
    due_date_after   TEXT NOT NULL,
    exam_capped      INTEGER NOT NULL DEFAULT 0  -- 1 when Exam Mode shortened the interval
  );

  CREATE INDEX IF NOT EXISTS idx_decks_subject   ON decks(subject_id);
  CREATE INDEX IF NOT EXISTS idx_cards_deck      ON cards(deck_id);
  CREATE INDEX IF NOT EXISTS idx_cards_due       ON cards(due_date);
  CREATE INDEX IF NOT EXISTS idx_logs_card       ON review_logs(card_id);
  CREATE INDEX IF NOT EXISTS idx_logs_date       ON review_logs(reviewed_date);
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

/** Brings the database file up to SCHEMA_VERSION. Each step is one transaction. */
export async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let version = current; version < MIGRATIONS.length; version++) {
    // PRAGMA user_version cannot use '?' parameters, so the number is written into the text.
    try {
      await db.execAsync(`BEGIN; ${MIGRATIONS[version]} PRAGMA user_version = ${version + 1}; COMMIT;`);
    } catch (error) {
      await db.execAsync('ROLLBACK;').catch(() => undefined);
      throw error;
    }
  }
}
