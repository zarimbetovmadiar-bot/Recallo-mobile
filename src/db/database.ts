// database.ts — opens the SQLite file once and shares it with all repositories.
// The file lives inside the app on the phone, so everything works without internet.

import * as SQLite from 'expo-sqlite';
import { migrate } from './schema';

const DATABASE_NAME = 'recallo.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  // SQLite switches foreign keys OFF by default. Without this line
  // "ON DELETE CASCADE" does nothing and deleting a deck leaves orphan cards.
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  await migrate(db);
  return db;
}

/** Returns the one shared database connection (opens it on first use). */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = open().catch(error => {
      dbPromise = null; // allow a retry on the next call
      throw error;
    });
  }
  return dbPromise;
}

/**
 * Runs several writes as ONE transaction: either all of them are saved or none.
 * Example: a rating updates the card AND writes the review log.
 */
export async function inTransaction(task: () => Promise<void>): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(task);
}
