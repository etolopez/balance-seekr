import * as SQLite from 'expo-sqlite';

export type DB = SQLite.SQLiteDatabase;

let dbPromise: Promise<DB> | null = null;

export async function getDbAsync(): Promise<DB> {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('solana_seeker.db');
  return dbPromise;
}

export async function initDb(): Promise<void> {
  const db = await getDbAsync();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT,
      createdAt TEXT NOT NULL,
      goalPerDay INTEGER DEFAULT 1,
      archived INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY NOT NULL,
      habitId TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL,
      note TEXT
    );
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      iv TEXT,
      mood TEXT,
      tags TEXT
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      done INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      completedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS goals (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prefs (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS breath_presets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      goal TEXT NOT NULL,
      inhale INTEGER NOT NULL,
      hold INTEGER NOT NULL,
      exhale INTEGER NOT NULL,
      hold2 INTEGER,
      shape TEXT NOT NULL,
      grad0 TEXT NOT NULL,
      grad1 TEXT NOT NULL,
      cycles INTEGER NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS mastermind_groups (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      ownerAddress TEXT,
      createdAt TEXT NOT NULL,
      isPublic INTEGER DEFAULT 0,
      joinPrice REAL,
      paymentAddress TEXT,
      description TEXT,
      apiGroupId TEXT
    );
    CREATE TABLE IF NOT EXISTS mastermind_messages (
      id TEXT PRIMARY KEY NOT NULL,
      groupId TEXT NOT NULL,
      senderAddress TEXT,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS mastermind_members (
      id TEXT PRIMARY KEY NOT NULL,
      groupId TEXT NOT NULL,
      userAddress TEXT NOT NULL,
      joinedAt TEXT NOT NULL,
      joinPricePaid REAL NOT NULL,
      UNIQUE(groupId, userAddress)
    );
  `);
}

export async function all<T = any>(sql: string, params: any = []): Promise<T[]> {
  const db = await getDbAsync();
  // getAllAsync supports arrays, objects, or variadic params
  return db.getAllAsync<T>(sql, params as any);
}

export async function run(sql: string, params: any = []): Promise<void> {
  const db = await getDbAsync();
  await db.runAsync(sql, params as any);
}
