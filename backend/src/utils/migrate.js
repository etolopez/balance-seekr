import { initializeDatabase } from '../models/database.js';
import { pool } from '../config/database.js';

/**
 * Run database migrations
 * This will create all necessary tables
 */
async function migrate() {
  try {
    console.log('[Migration] Starting database migration...');
    await initializeDatabase();
    console.log('[Migration] Migration completed successfully');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();

