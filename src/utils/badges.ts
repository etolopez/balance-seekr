/**
 * Badge System Utilities
 * 
 * Calculates badges based on user activity:
 * - Task badges: Daily (3+ tasks), 7-day streak
 * - Journal badges: 7 days, 2 weeks, 1 month, 2 months, 6 months, 1 year
 * - Habit badges: Daily (all habits), 7 days, 1 month, 2 months, 3 months, 66 days
 */

import { todayYMD, yesterdayYMD, isoToLocalYMD } from './time';
import { all } from '../db/client';
import { dbApi } from '../state/dbApi';

export type BadgeType = 
  | 'task_daily' 
  | 'task_streak_7'
  | 'task_streak_14'
  | 'task_streak_30'
  | 'task_streak_180'
  | 'task_streak_365'
  | 'journal_first_500'
  | 'journal_streak_7' 
  | 'journal_streak_14' 
  | 'journal_streak_30' 
  | 'journal_streak_60' 
  | 'journal_streak_180' 
  | 'journal_streak_365'
  | 'habit_daily'
  | 'habit_streak_7'
  | 'habit_streak_30'
  | 'habit_streak_60'
  | 'habit_streak_90'
  | 'habit_streak_66';

export interface Badge {
  id: BadgeType;
  name: string;
  description: string;
  icon: string;
  category: 'task' | 'journal' | 'habit';
  isStreak: boolean;
  daysRequired: number;
  earnedAt?: string; // YYYY-MM-DD when badge was earned
}

/**
 * Get all badge definitions
 */
export function getAllBadges(): Badge[] {
  return [
    // Task badges
    {
      id: 'task_daily',
      name: 'Task Starter',
      description: 'Complete at least 3 tasks in a day',
      icon: 'checkmark-circle',
      category: 'task',
      isStreak: false,
      daysRequired: 1,
    },
    {
      id: 'task_streak_7',
      name: 'Multi-Tasker',
      description: 'Complete at least 3 tasks daily for 7 days',
      icon: 'trophy',
      category: 'task',
      isStreak: true,
      daysRequired: 7,
    },
    {
      id: 'task_streak_14',
      name: 'Task Keeper',
      description: 'Complete at least 3 tasks daily for 2 weeks',
      icon: 'calendar',
      category: 'task',
      isStreak: true,
      daysRequired: 14,
    },
    {
      id: 'task_streak_30',
      name: 'Task Master',
      description: 'Complete at least 3 tasks daily for 1 month',
      icon: 'calendar-outline',
      category: 'task',
      isStreak: true,
      daysRequired: 30,
    },
    {
      id: 'task_streak_180',
      name: 'Task Hero',
      description: 'Complete at least 3 tasks daily for 6 months',
      icon: 'time',
      category: 'task',
      isStreak: true,
      daysRequired: 180,
    },
    {
      id: 'task_streak_365',
      name: 'Task Legend',
      description: 'Complete at least 3 tasks daily for 1 year',
      icon: 'star',
      category: 'task',
      isStreak: true,
      daysRequired: 365,
    },
    // Journal badges
    {
      id: 'journal_first_500',
      name: 'Deep Reflection',
      description: 'Write your first journal entry with 500+ words',
      icon: 'document-text',
      category: 'journal',
      isStreak: false,
      daysRequired: 1,
    },
    {
      id: 'journal_streak_7',
      name: 'Journal Week',
      description: 'Write 350+ words in your journal every day for 7 days',
      icon: 'book',
      category: 'journal',
      isStreak: true,
      daysRequired: 7,
    },
    {
      id: 'journal_streak_14',
      name: 'Journal Fortnight',
      description: 'Write 350+ words in your journal every day for 2 weeks',
      icon: 'book-outline',
      category: 'journal',
      isStreak: true,
      daysRequired: 14,
    },
    {
      id: 'journal_streak_30',
      name: 'Journal Month',
      description: 'Write 350+ words in your journal every day for 1 month',
      icon: 'calendar',
      category: 'journal',
      isStreak: true,
      daysRequired: 30,
    },
    {
      id: 'journal_streak_60',
      name: 'Journal Two Months',
      description: 'Write 350+ words in your journal every day for 2 months',
      icon: 'calendar-outline',
      category: 'journal',
      isStreak: true,
      daysRequired: 60,
    },
    {
      id: 'journal_streak_180',
      name: 'Journal Half Year',
      description: 'Write 350+ words in your journal every day for 6 months',
      icon: 'time',
      category: 'journal',
      isStreak: true,
      daysRequired: 180,
    },
    {
      id: 'journal_streak_365',
      name: 'Journal Year',
      description: 'Write 350+ words in your journal every day for 1 year',
      icon: 'star',
      category: 'journal',
      isStreak: true,
      daysRequired: 365,
    },
    // Habit badges
    {
      id: 'habit_daily',
      name: 'Habit Starter',
      description: 'Complete all your habits in a day',
      icon: 'flame',
      category: 'habit',
      isStreak: false,
      daysRequired: 1,
    },
    {
      id: 'habit_streak_7',
      name: 'Habit Week',
      description: 'Complete all habits every day for 7 days',
      icon: 'flame-outline',
      category: 'habit',
      isStreak: true,
      daysRequired: 7,
    },
    {
      id: 'habit_streak_30',
      name: 'Habit Hero',
      description: 'Complete all habits every day for 1 month',
      icon: 'calendar',
      category: 'habit',
      isStreak: true,
      daysRequired: 30,
    },
    {
      id: 'habit_streak_60',
      name: 'Epic Habits',
      description: 'Complete all habits every day for 2 months',
      icon: 'calendar-outline',
      category: 'habit',
      isStreak: true,
      daysRequired: 60,
    },
    {
      id: 'habit_streak_90',
      name: 'Legendary Habit Keeper',
      description: 'Complete all habits every day for 3 months',
      icon: 'trophy',
      category: 'habit',
      isStreak: true,
      daysRequired: 90,
    },
    {
      id: 'habit_streak_66',
      name: 'Habit Master',
      description: 'Complete all habits for 66 days - the time it takes to form a lifetime habit',
      icon: 'star',
      category: 'habit',
      isStreak: true,
      daysRequired: 66,
    },
  ];
}

/**
 * Calculate task streak (consecutive days with 3+ completed tasks)
 * Queries database directly to include deleted tasks that were completed
 */
export async function calculateTaskStreak(
  tasks: { done: boolean; completedAt?: string | null }[]
): Promise<number> {
  const today = todayYMD();
  const completedTasksByDate = new Map<string, number>();
  
  try {
    // Query database for all completed tasks (including deleted ones)
    // This ensures tasks completed and deleted on the same day still count
    const dbTasks = await all<{ completedAt: string | null }>(
      'SELECT completedAt FROM tasks WHERE done = 1 AND completedAt IS NOT NULL'
    );
    
    // Count completed tasks per day from database
    if (dbTasks && Array.isArray(dbTasks)) {
      dbTasks.forEach(task => {
        if (task.completedAt) {
          const date = isoToLocalYMD(task.completedAt);
          completedTasksByDate.set(date, (completedTasksByDate.get(date) || 0) + 1);
        }
      });
    }
  } catch (error) {
    // Fallback to in-memory tasks if database query fails
    tasks.forEach(task => {
      if (task.done && task.completedAt) {
        const date = isoToLocalYMD(task.completedAt);
        completedTasksByDate.set(date, (completedTasksByDate.get(date) || 0) + 1);
      }
    });
  }
  
  // Calculate streak backwards from today
  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const completedCount = completedTasksByDate.get(dateStr) || 0;
    
    if (completedCount >= 3) {
      streak++;
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Check if user completed 3+ tasks today
 * Queries database directly to include deleted tasks that were completed today
 */
export async function hasCompletedThreeTasksToday(
  tasks: { done: boolean; completedAt?: string | null }[]
): Promise<boolean> {
  const today = todayYMD();
  let completedToday = 0;
  
  try {
    // Query database for all completed tasks (including deleted ones)
    // Filter by date in JavaScript to ensure accurate date comparison
    const dbTasks = await all<{ completedAt: string }>(
      'SELECT completedAt FROM tasks WHERE done = 1 AND completedAt IS NOT NULL'
    );
    
    if (dbTasks && Array.isArray(dbTasks)) {
      // Filter tasks completed today using JavaScript date comparison
      dbTasks.forEach(task => {
        if (task.completedAt) {
          const date = isoToLocalYMD(task.completedAt);
          if (date === today) {
            completedToday++;
          }
        }
      });
    }
  } catch (error) {
    // Fallback to in-memory tasks if database query fails
    tasks.forEach(task => {
      if (task.done && task.completedAt) {
        const date = isoToLocalYMD(task.completedAt);
        if (date === today) {
          completedToday++;
        }
      }
    });
  }
  
  return completedToday >= 3;
}

/**
 * Calculate word count for a journal entry
 */
function getWordCount(content: string): number {
  if (!content || typeof content !== 'string') return 0;
  return content.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate journal streak (consecutive days with at least 1 journal entry of 350+ words)
 */
export function calculateJournalStreak(
  journal: { createdAt: string; content: string }[]
): number {
  const today = todayYMD();
  const journalDates = new Set<string>();
  
  // Get all dates with journal entries that are 350+ words
  journal.forEach(entry => {
    const wordCount = getWordCount(entry.content || '');
    if (wordCount >= 350) {
      const date = isoToLocalYMD(entry.createdAt);
      journalDates.add(date);
    }
  });
  
  // Calculate streak backwards from today
  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    if (journalDates.has(dateStr)) {
      streak++;
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Calculate habit streak (consecutive days where all habits are completed)
 */
export function calculateHabitStreak(
  habits: { id: string }[],
  logs: { habitId: string; date: string; completed: boolean }[]
): number {
  if (habits.length === 0) return 0;
  
  const today = todayYMD();
  const habitIds = new Set(habits.map(h => h.id));
  
  // Group logs by date
  const logsByDate = new Map<string, Map<string, boolean>>();
  logs.forEach(log => {
    if (!logsByDate.has(log.date)) {
      logsByDate.set(log.date, new Map());
    }
    logsByDate.get(log.date)!.set(log.habitId, log.completed);
  });
  
  // Calculate streak backwards from today
  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayLogs = logsByDate.get(dateStr) || new Map();
    
    // Check if all habits were completed on this day
    let allCompleted = true;
    for (const habitId of habitIds) {
      const completed = dayLogs.get(habitId);
      if (completed !== true) {
        allCompleted = false;
        break;
      }
    }
    
    if (allCompleted) {
      streak++;
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Check if user completed all habits today
 */
export function hasCompletedAllHabitsToday(
  habits: { id: string }[],
  logs: { habitId: string; date: string; completed: boolean }[]
): boolean {
  if (habits.length === 0) return false;
  
  const today = todayYMD();
  const habitIds = new Set(habits.map(h => h.id));
  const todayLogs = logs.filter(log => log.date === today);
  
  // Check if all habits have completed logs for today
  for (const habitId of habitIds) {
    const log = todayLogs.find(l => l.habitId === habitId);
    if (!log || !log.completed) {
      return false;
    }
  }
  
  return true;
}

/**
 * Calculate all earned badges
 * Merges stored badges (persistent) with newly calculated badges
 */
export async function calculateEarnedBadges(
  tasks: { done: boolean; completedAt?: string | null }[],
  journal: { createdAt: string; content: string }[],
  habits: { id: string }[],
  logs: { habitId: string; date: string; completed: boolean }[]
): Promise<Badge[]> {
  const allBadges = getAllBadges();
  const today = todayYMD();
  
  // Load previously earned badges from database (persistent)
  let storedBadges: Badge[] = [];
  try {
    storedBadges = await dbApi.getEarnedBadges();
  } catch (error) {
    // If database query fails, continue with empty stored badges
  }
  
  // Create a map of stored badges by badgeType for quick lookup
  const storedBadgesMap = new Map<string, Badge>();
  storedBadges.forEach(badge => {
    storedBadgesMap.set(badge.id, badge);
  });
  
  const newlyEarned: Badge[] = [];
  
  // Calculate streaks (task streak now queries database directly)
  const [taskStreak, journalStreak, habitStreak] = await Promise.all([
    calculateTaskStreak(tasks),
    Promise.resolve(calculateJournalStreak(journal)),
    Promise.resolve(calculateHabitStreak(habits, logs)),
  ]);
  
  // Check daily badges
  const hasThreeTasksToday = await hasCompletedThreeTasksToday(tasks);
  if (hasThreeTasksToday) {
    const badge = allBadges.find(b => b.id === 'task_daily');
    if (badge && !storedBadgesMap.has('task_daily')) {
      const earnedBadge = { ...badge, earnedAt: today };
      newlyEarned.push(earnedBadge);
      // Save to database
      try {
        await dbApi.saveBadge({ ...earnedBadge, badgeType: earnedBadge.id });
      } catch (error) {
        // If save fails, continue (badge will be recalculated next time)
      }
    }
  }
  
  if (hasCompletedAllHabitsToday(habits, logs)) {
    const badge = allBadges.find(b => b.id === 'habit_daily');
    if (badge && !storedBadgesMap.has('habit_daily')) {
      const earnedBadge = { ...badge, earnedAt: today };
      newlyEarned.push(earnedBadge);
      try {
        await dbApi.saveBadge({ ...earnedBadge, badgeType: earnedBadge.id });
      } catch (error) {
        // If save fails, continue
      }
    }
  }
  
  // Check journal first 500+ words badge (Deep Reflection)
  // Query database directly to ensure we check all entries, including encrypted ones
  let hasLongJournalEntry = false;
  let firstLongEntry: { createdAt: string; content: string } | null = null;
  
  try {
    // Query all journal entries from database
    const dbJournal = await all<{ id: string; createdAt: string; content: string; iv: string | null }>(
      'SELECT id, createdAt, content, iv FROM journal_entries ORDER BY createdAt ASC'
    );
    
    console.log('[Badges] Checking journal entries for 500+ words. Total entries:', dbJournal.length);
    
    // Decrypt entries if needed (check if encryption is enabled by checking for iv field)
    const { decryptString, isWebCryptoAvailable } = await import('../crypto/crypto');
    const { getOrCreateKey } = await import('../crypto/keystore');
    const encryptionEnabled = isWebCryptoAvailable();
    
    for (const entry of dbJournal) {
      let content = entry.content;
      
      // Decrypt if encrypted
      if (entry.iv && encryptionEnabled) {
        try {
          const key = await getOrCreateKey();
          content = await decryptString(entry.content, entry.iv, key);
        } catch (error) {
          console.error('[Badges] Failed to decrypt journal entry:', entry.id, error);
          // If decryption fails, skip this entry
          continue;
        }
      }
      
      const wordCount = getWordCount(content || '');
      console.log('[Badges] Journal entry word count:', wordCount, 'Content length:', content?.length);
      
      if (wordCount >= 500) {
        console.log('[Badges] Found 500+ word journal entry! Word count:', wordCount);
        hasLongJournalEntry = true;
        if (!firstLongEntry) {
          firstLongEntry = { createdAt: entry.createdAt, content };
        }
        break; // Found first long entry
      }
    }
  } catch (error) {
    // Log error for debugging
    console.error('[Badges] Error checking journal entries:', error);
    // Fallback to in-memory journal if database query fails
    hasLongJournalEntry = journal.some(entry => {
      const wordCount = getWordCount(entry.content || '');
      return wordCount >= 500;
    });
    if (hasLongJournalEntry) {
      firstLongEntry = journal.find(entry => {
        const wordCount = getWordCount(entry.content || '');
        return wordCount >= 500;
      }) || null;
    }
  }
  
  console.log('[Badges] Has long journal entry:', hasLongJournalEntry, 'Already stored:', storedBadgesMap.has('journal_first_500'));
  
  if (hasLongJournalEntry) {
    const badge = allBadges.find(b => b.id === 'journal_first_500');
    if (badge && !storedBadgesMap.has('journal_first_500')) {
      console.log('[Badges] Awarding journal_first_500 badge');
      const earnedBadge = { 
        ...badge, 
        earnedAt: firstLongEntry ? isoToLocalYMD(firstLongEntry.createdAt) : today 
      };
      newlyEarned.push(earnedBadge);
      try {
        await dbApi.saveBadge({ ...earnedBadge, badgeType: earnedBadge.id });
        console.log('[Badges] Saved journal_first_500 badge to database');
      } catch (error) {
        console.error('[Badges] Failed to save journal_first_500 badge:', error);
      }
    } else if (storedBadgesMap.has('journal_first_500')) {
      console.log('[Badges] journal_first_500 badge already stored, skipping');
    }
  }
  
  // Check task streak badges (only highest - sorted by days descending)
  const taskStreakBadges = [
    { id: 'task_streak_365' as BadgeType, days: 365 },
    { id: 'task_streak_180' as BadgeType, days: 180 },
    { id: 'task_streak_30' as BadgeType, days: 30 },
    { id: 'task_streak_14' as BadgeType, days: 14 },
    { id: 'task_streak_7' as BadgeType, days: 7 },
  ];
  
  // Find the highest badge the user qualifies for
  for (const { id, days } of taskStreakBadges) {
    if (taskStreak >= days) {
      const badge = allBadges.find(b => b.id === id);
      if (badge) {
        // For streak badges, check if we already have a higher one stored
        const hasHigherStreak = taskStreakBadges.some(({ id: higherId, days: higherDays }) => {
          if (higherDays <= days) return false;
          return storedBadgesMap.has(higherId);
        });
        
        // Only add if we don't have this badge or a higher one
        if (!storedBadgesMap.has(id) && !hasHigherStreak) {
          const earnedBadge = { ...badge, earnedAt: today };
          newlyEarned.push(earnedBadge);
          try {
            await dbApi.saveBadge({ ...earnedBadge, badgeType: earnedBadge.id });
          } catch (error) {
            // If save fails, continue
          }
        }
        break; // Only process highest badge
      }
    }
  }
  
  // Check journal streak badges (only highest)
  const journalStreakBadges = [
    { id: 'journal_streak_365' as BadgeType, days: 365 },
    { id: 'journal_streak_180' as BadgeType, days: 180 },
    { id: 'journal_streak_60' as BadgeType, days: 60 },
    { id: 'journal_streak_30' as BadgeType, days: 30 },
    { id: 'journal_streak_14' as BadgeType, days: 14 },
    { id: 'journal_streak_7' as BadgeType, days: 7 },
  ];
  
  for (const { id, days } of journalStreakBadges) {
    if (journalStreak >= days) {
      const badge = allBadges.find(b => b.id === id);
      if (badge) {
        const hasHigherStreak = journalStreakBadges.some(({ id: higherId, days: higherDays }) => {
          if (higherDays <= days) return false;
          return storedBadgesMap.has(higherId);
        });
        
        if (!storedBadgesMap.has(id) && !hasHigherStreak) {
          const earnedBadge = { ...badge, earnedAt: today };
          newlyEarned.push(earnedBadge);
          try {
            await dbApi.saveBadge({ ...earnedBadge, badgeType: earnedBadge.id });
          } catch (error) {
            // If save fails, continue
          }
        }
        break; // Only process highest badge
      }
    }
  }
  
  // Check habit streak badges (only highest)
  const habitStreakBadges = [
    { id: 'habit_streak_90' as BadgeType, days: 90 },
    { id: 'habit_streak_66' as BadgeType, days: 66 },
    { id: 'habit_streak_60' as BadgeType, days: 60 },
    { id: 'habit_streak_30' as BadgeType, days: 30 },
    { id: 'habit_streak_7' as BadgeType, days: 7 },
  ];
  
  for (const { id, days } of habitStreakBadges) {
    if (habitStreak >= days) {
      const badge = allBadges.find(b => b.id === id);
      if (badge) {
        const hasHigherStreak = habitStreakBadges.some(({ id: higherId, days: higherDays }) => {
          if (higherDays <= days) return false;
          return storedBadgesMap.has(higherId);
        });
        
        if (!storedBadgesMap.has(id) && !hasHigherStreak) {
          const earnedBadge = { ...badge, earnedAt: today };
          newlyEarned.push(earnedBadge);
          try {
            await dbApi.saveBadge({ ...earnedBadge, badgeType: earnedBadge.id });
          } catch (error) {
            // If save fails, continue
          }
        }
        break; // Only process highest badge
      }
    }
  }
  
  // Merge stored badges with newly earned badges
  // Stored badges take precedence (they persist even if data is deleted)
  const allEarnedBadges = [...storedBadges, ...newlyEarned];
  
  // Remove duplicates (in case a badge was both stored and newly earned)
  const uniqueBadges = Array.from(
    new Map(allEarnedBadges.map(badge => [badge.id, badge])).values()
  );
  
  return uniqueBadges;
}

/**
 * Get the highest streak badge for each category (for display)
 */
export function getHighestStreakBadges(earnedBadges: Badge[]): {
  task?: Badge;
  journal?: Badge;
  habit?: Badge;
} {
  const result: { task?: Badge; journal?: Badge; habit?: Badge } = {};
  
  // Sort badges by days required (highest first)
  const taskStreaks = earnedBadges
    .filter(b => b.category === 'task' && b.isStreak)
    .sort((a, b) => b.daysRequired - a.daysRequired);
  if (taskStreaks.length > 0) result.task = taskStreaks[0];
  
  const journalStreaks = earnedBadges
    .filter(b => b.category === 'journal' && b.isStreak)
    .sort((a, b) => b.daysRequired - a.daysRequired);
  if (journalStreaks.length > 0) result.journal = journalStreaks[0];
  
  const habitStreaks = earnedBadges
    .filter(b => b.category === 'habit' && b.isStreak)
    .sort((a, b) => b.daysRequired - a.daysRequired);
  if (habitStreaks.length > 0) result.habit = habitStreaks[0];
  
  return result;
}

