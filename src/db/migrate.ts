/**
 * Database Migration Script
 * Adds new columns to existing tables for public Masterminds feature
 * Run this once to update existing databases
 */
import { run, all } from './client';

/**
 * Add mastermind_members table if it doesn't exist
 */
async function addMembersTable(): Promise<void> {
  try {
    // Check if table exists using all() function
    const tables = await all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='mastermind_members'"
    );
    
    if (tables.length === 0) {
      // Table doesn't exist, create it using execAsync via getDbAsync
      const { getDbAsync } = await import('./client');
      const db = await getDbAsync();
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS mastermind_members (
          id TEXT PRIMARY KEY NOT NULL,
          groupId TEXT NOT NULL,
          userAddress TEXT NOT NULL,
          joinedAt TEXT NOT NULL,
          joinPricePaid REAL NOT NULL,
          UNIQUE(groupId, userAddress)
        );
      `);
      // Table created successfully
    } else {
      // Table already exists, skipping
    }
  } catch (error) {
    // Error adding table (non-critical, migration continues)
    // Don't throw - allow migration to continue
  }
}

export async function migrateDatabase(): Promise<void> {
  try {
    // Add mastermind_members table first
    try {
      await addMembersTable();
    } catch (error) {
      // Error adding members table (non-critical, migration continues)
    }

    // Check which columns exist by querying table info
    const tableInfo = await all<any>('PRAGMA table_info(mastermind_groups)');
    const existingColumns = new Set(tableInfo.map((col: any) => col.name.toLowerCase()));
    
    const columnsToAdd = [
      { name: 'isPublic', sql: 'ALTER TABLE mastermind_groups ADD COLUMN isPublic INTEGER DEFAULT 0' },
      { name: 'joinPrice', sql: 'ALTER TABLE mastermind_groups ADD COLUMN joinPrice REAL' },
      { name: 'paymentAddress', sql: 'ALTER TABLE mastermind_groups ADD COLUMN paymentAddress TEXT' },
      { name: 'description', sql: 'ALTER TABLE mastermind_groups ADD COLUMN description TEXT' },
      { name: 'apiGroupId', sql: 'ALTER TABLE mastermind_groups ADD COLUMN apiGroupId TEXT' },
    ];

    for (const column of columnsToAdd) {
      if (!existingColumns.has(column.name.toLowerCase())) {
        try {
          await run(column.sql);
          // Column added successfully
        } catch (error: any) {
          // Error adding column (may already exist)
        }
      } else {
        // Column already exists, skipping
      }
    }

    // Database migration completed
  } catch (error) {
    // Migration error (non-critical, app continues)
    // Don't throw - allow app to continue even if migration fails
  }
}

