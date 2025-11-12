/**
 * Database Cleanup Utility
 * 
 * Manages data retention policies for habit logs and other time-based data.
 * Helps prevent database bloat while preserving important historical data.
 * 
 * Best Practices:
 * - Keep recent data (last 30-90 days) for detailed tracking
 * - SQLite can handle millions of rows efficiently, but proactive cleanup is good practice
 * - User-configurable retention periods allow flexibility
 */

import { run, all } from './client';
import { todayYMD } from '../utils/time';

/**
 * Retention policy options (in days)
 * - 0 = Keep all data forever
 * - 30 = Keep last 30 days
 * - 90 = Keep last 90 days
 * - 180 = Keep last 180 days
 * - 365 = Keep last 365 days
 */
export type RetentionPolicy = 0 | 30 | 90 | 180 | 365;

/**
 * Cleanup statistics returned after cleanup operations
 */
export interface CleanupStats {
  habitLogsDeleted: number;
  oldTasksDeleted: number;
  oldJournalEntriesDeleted: number;
  totalDeleted: number;
}

/**
 * Calculate the cutoff date based on retention policy
 * @param retentionDays Number of days to retain (0 = keep all)
 * @returns Cutoff date in YYYY-MM-DD format, or null if keeping all
 */
function getCutoffDate(retentionDays: number): string | null {
  if (retentionDays === 0) {
    return null; // Keep all data
  }
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const yyyy = cutoffDate.getFullYear();
  const mm = String(cutoffDate.getMonth() + 1).padStart(2, '0');
  const dd = String(cutoffDate.getDate()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Clean up old habit logs based on retention policy
 * @param retentionDays Number of days to retain (0 = keep all)
 * @returns Number of logs deleted
 */
export async function cleanupHabitLogs(retentionDays: number): Promise<number> {
  const cutoffDate = getCutoffDate(retentionDays);
  
  if (!cutoffDate) {
    return 0; // Keep all data
  }
  
  try {
    // Get count of rows to delete first
    const logsToDelete = await all<{ count: number }>(
      'SELECT COUNT(*) as count FROM habit_logs WHERE date < ?',
      [cutoffDate]
    );
    
    const count = logsToDelete[0]?.count || 0;
    
    // Delete habit logs older than cutoff date
    if (count > 0) {
      await run('DELETE FROM habit_logs WHERE date < ?', [cutoffDate]);
    }
    
    return count;
  } catch (error) {
    // Error during cleanup (non-critical, app continues)
    return 0;
  }
}

/**
 * Clean up old completed tasks (keep incomplete tasks)
 * Tasks older than retention period that are completed can be removed
 * @param retentionDays Number of days to retain (0 = keep all)
 * @returns Number of tasks deleted
 */
export async function cleanupOldTasks(retentionDays: number): Promise<number> {
  const cutoffDate = getCutoffDate(retentionDays);
  
  if (!cutoffDate) {
    return 0; // Keep all data
  }
  
  try {
    // Only delete completed tasks older than cutoff
    // Keep incomplete tasks regardless of age
    const tasksToDelete = await all<{ count: number }>(
      'SELECT COUNT(*) as count FROM tasks WHERE done = 1 AND completedAt IS NOT NULL AND date(completedAt) < ?',
      [cutoffDate]
    );
    
    const count = tasksToDelete[0]?.count || 0;
    
    if (count > 0) {
      await run(
        'DELETE FROM tasks WHERE done = 1 AND completedAt IS NOT NULL AND date(completedAt) < ?',
        [cutoffDate]
      );
    }
    
    return count;
  } catch (error) {
    // Error during cleanup (non-critical, app continues)
    return 0;
  }
}

/**
 * Clean up old journal entries based on retention policy
 * @param retentionDays Number of days to retain (0 = keep all)
 * @returns Number of journal entries deleted
 */
export async function cleanupOldJournalEntries(retentionDays: number): Promise<number> {
  const cutoffDate = getCutoffDate(retentionDays);
  
  if (!cutoffDate) {
    return 0; // Keep all data
  }
  
  try {
    // Delete journal entries older than cutoff date
    const entriesToDelete = await all<{ count: number }>(
      'SELECT COUNT(*) as count FROM journal_entries WHERE date(createdAt) < ?',
      [cutoffDate]
    );
    
    const count = entriesToDelete[0]?.count || 0;
    
    if (count > 0) {
      await run(
        'DELETE FROM journal_entries WHERE date(createdAt) < ?',
        [cutoffDate]
      );
    }
    
    return count;
  } catch (error) {
    // Error during cleanup (non-critical, app continues)
    return 0;
  }
}

/**
 * Get statistics about data that would be deleted with current retention policy
 * @param retentionDays Number of days to retain (0 = keep all)
 * @returns Statistics about data that would be deleted
 */
export async function getCleanupPreview(retentionDays: number): Promise<CleanupStats> {
  const cutoffDate = getCutoffDate(retentionDays);
  
  if (!cutoffDate) {
    return {
      habitLogsDeleted: 0,
      oldTasksDeleted: 0,
      oldJournalEntriesDeleted: 0,
      totalDeleted: 0,
    };
  }
  
  try {
    const [habitLogs, tasks, journal] = await Promise.all([
      all<{ count: number }>(
        'SELECT COUNT(*) as count FROM habit_logs WHERE date < ?',
        [cutoffDate]
      ),
      all<{ count: number }>(
        'SELECT COUNT(*) as count FROM tasks WHERE done = 1 AND completedAt IS NOT NULL AND date(completedAt) < ?',
        [cutoffDate]
      ),
      all<{ count: number }>(
        'SELECT COUNT(*) as count FROM journal_entries WHERE date(createdAt) < ?',
        [cutoffDate]
      ),
    ]);
    
    const habitLogsDeleted = habitLogs[0]?.count || 0;
    const oldTasksDeleted = tasks[0]?.count || 0;
    const oldJournalEntriesDeleted = journal[0]?.count || 0;
    
    return {
      habitLogsDeleted,
      oldTasksDeleted,
      oldJournalEntriesDeleted,
      totalDeleted: habitLogsDeleted + oldTasksDeleted + oldJournalEntriesDeleted,
    };
  } catch (error) {
    // Error getting preview (non-critical)
    return {
      habitLogsDeleted: 0,
      oldTasksDeleted: 0,
      oldJournalEntriesDeleted: 0,
      totalDeleted: 0,
    };
  }
}

/**
 * Perform comprehensive cleanup based on retention policy
 * @param retentionDays Number of days to retain (0 = keep all)
 * @param includeJournal Whether to clean up journal entries (default: false, as users may want to keep all journal entries)
 * @returns Statistics about what was deleted
 */
export async function performCleanup(
  retentionDays: number,
  includeJournal: boolean = false
): Promise<CleanupStats> {
  const [habitLogsDeleted, oldTasksDeleted, oldJournalEntriesDeleted] = await Promise.all([
    cleanupHabitLogs(retentionDays),
    cleanupOldTasks(retentionDays),
    includeJournal ? cleanupOldJournalEntries(retentionDays) : Promise.resolve(0),
  ]);
  
  return {
    habitLogsDeleted,
    oldTasksDeleted,
    oldJournalEntriesDeleted,
    totalDeleted: habitLogsDeleted + oldTasksDeleted + oldJournalEntriesDeleted,
  };
}

/**
 * Get total database size statistics
 * @returns Object with counts of various data types
 */
export async function getDatabaseStats(): Promise<{
  totalHabits: number;
  totalHabitLogs: number;
  totalTasks: number;
  totalJournalEntries: number;
  oldestHabitLog: string | null;
  newestHabitLog: string | null;
}> {
  try {
    const [habits, logs, tasks, journal, oldestLog, newestLog] = await Promise.all([
      all<{ count: number }>('SELECT COUNT(*) as count FROM habits'),
      all<{ count: number }>('SELECT COUNT(*) as count FROM habit_logs'),
      all<{ count: number }>('SELECT COUNT(*) as count FROM tasks'),
      all<{ count: number }>('SELECT COUNT(*) as count FROM journal_entries'),
      all<{ date: string }>('SELECT MIN(date) as date FROM habit_logs'),
      all<{ date: string }>('SELECT MAX(date) as date FROM habit_logs'),
    ]);
    
    return {
      totalHabits: habits[0]?.count || 0,
      totalHabitLogs: logs[0]?.count || 0,
      totalTasks: tasks[0]?.count || 0,
      totalJournalEntries: journal[0]?.count || 0,
      oldestHabitLog: oldestLog[0]?.date || null,
      newestHabitLog: newestLog[0]?.date || null,
    };
  } catch (error) {
    // Error getting stats (non-critical)
    return {
      totalHabits: 0,
      totalHabitLogs: 0,
      totalTasks: 0,
      totalJournalEntries: 0,
      oldestHabitLog: null,
      newestHabitLog: null,
    };
  }
}

