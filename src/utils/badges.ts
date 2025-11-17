/**
 * Badge System Utilities
 * 
 * Calculates badges based on user activity:
 * - Task badges: Daily (3+ tasks), 7-day streak
 * - Journal badges: 7 days, 2 weeks, 1 month, 2 months, 6 months, 1 year
 * - Habit badges: Daily (all habits), 7 days, 1 month, 2 months, 3 months, 66 days
 */

import { todayYMD, yesterdayYMD, isoToLocalYMD } from './time';

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
      name: 'Task Master',
      description: 'Complete at least 3 tasks in a day',
      icon: 'checkmark-circle',
      category: 'task',
      isStreak: false,
      daysRequired: 1,
    },
    {
      id: 'task_streak_7',
      name: 'Task Champion',
      description: 'Complete at least 3 tasks daily for 7 days',
      icon: 'trophy',
      category: 'task',
      isStreak: true,
      daysRequired: 7,
    },
    {
      id: 'task_streak_14',
      name: 'Task Two Weeks',
      description: 'Complete at least 3 tasks daily for 2 weeks',
      icon: 'calendar',
      category: 'task',
      isStreak: true,
      daysRequired: 14,
    },
    {
      id: 'task_streak_30',
      name: 'Task Month',
      description: 'Complete at least 3 tasks daily for 1 month',
      icon: 'calendar-outline',
      category: 'task',
      isStreak: true,
      daysRequired: 30,
    },
    {
      id: 'task_streak_180',
      name: 'Task Half Year',
      description: 'Complete at least 3 tasks daily for 6 months',
      icon: 'time',
      category: 'task',
      isStreak: true,
      daysRequired: 180,
    },
    {
      id: 'task_streak_365',
      name: 'Task Year',
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
      description: 'Write in your journal every day for 7 days',
      icon: 'book',
      category: 'journal',
      isStreak: true,
      daysRequired: 7,
    },
    {
      id: 'journal_streak_14',
      name: 'Journal Fortnight',
      description: 'Write in your journal every day for 2 weeks',
      icon: 'book-outline',
      category: 'journal',
      isStreak: true,
      daysRequired: 14,
    },
    {
      id: 'journal_streak_30',
      name: 'Journal Month',
      description: 'Write in your journal every day for 1 month',
      icon: 'calendar',
      category: 'journal',
      isStreak: true,
      daysRequired: 30,
    },
    {
      id: 'journal_streak_60',
      name: 'Journal Two Months',
      description: 'Write in your journal every day for 2 months',
      icon: 'calendar-outline',
      category: 'journal',
      isStreak: true,
      daysRequired: 60,
    },
    {
      id: 'journal_streak_180',
      name: 'Journal Half Year',
      description: 'Write in your journal every day for 6 months',
      icon: 'time',
      category: 'journal',
      isStreak: true,
      daysRequired: 180,
    },
    {
      id: 'journal_streak_365',
      name: 'Journal Year',
      description: 'Write in your journal every day for 1 year',
      icon: 'star',
      category: 'journal',
      isStreak: true,
      daysRequired: 365,
    },
    // Habit badges
    {
      id: 'habit_daily',
      name: 'Habit Hero',
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
      name: 'Habit Month',
      description: 'Complete all habits every day for 1 month',
      icon: 'calendar',
      category: 'habit',
      isStreak: true,
      daysRequired: 30,
    },
    {
      id: 'habit_streak_60',
      name: 'Habit Two Months',
      description: 'Complete all habits every day for 2 months',
      icon: 'calendar-outline',
      category: 'habit',
      isStreak: true,
      daysRequired: 60,
    },
    {
      id: 'habit_streak_90',
      name: 'Habit Three Months',
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
 */
export function calculateTaskStreak(
  tasks: { done: boolean; completedAt?: string | null }[]
): number {
  const today = todayYMD();
  const completedTasksByDate = new Map<string, number>();
  
  // Count completed tasks per day
  tasks.forEach(task => {
    if (task.done && task.completedAt) {
      const date = isoToLocalYMD(task.completedAt);
      completedTasksByDate.set(date, (completedTasksByDate.get(date) || 0) + 1);
    }
  });
  
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
 */
export function hasCompletedThreeTasksToday(
  tasks: { done: boolean; completedAt?: string | null }[]
): boolean {
  const today = todayYMD();
  let completedToday = 0;
  
  tasks.forEach(task => {
    if (task.done && task.completedAt) {
      const date = isoToLocalYMD(task.completedAt);
      if (date === today) {
        completedToday++;
      }
    }
  });
  
  return completedToday >= 3;
}

/**
 * Calculate journal streak (consecutive days with at least 1 journal entry)
 */
export function calculateJournalStreak(
  journal: { createdAt: string }[]
): number {
  const today = todayYMD();
  const journalDates = new Set<string>();
  
  // Get all dates with journal entries
  journal.forEach(entry => {
    const date = isoToLocalYMD(entry.createdAt);
    journalDates.add(date);
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
 */
export function calculateEarnedBadges(
  tasks: { done: boolean; completedAt?: string | null }[],
  journal: { createdAt: string }[],
  habits: { id: string }[],
  logs: { habitId: string; date: string; completed: boolean }[]
): Badge[] {
  const allBadges = getAllBadges();
  const earned: Badge[] = [];
  const today = todayYMD();
  
  // Calculate streaks
  const taskStreak = calculateTaskStreak(tasks);
  const journalStreak = calculateJournalStreak(journal);
  const habitStreak = calculateHabitStreak(habits, logs);
  
  // Check daily badges
  if (hasCompletedThreeTasksToday(tasks)) {
    const badge = allBadges.find(b => b.id === 'task_daily');
    if (badge) earned.push({ ...badge, earnedAt: today });
  }
  
  if (hasCompletedAllHabitsToday(habits, logs)) {
    const badge = allBadges.find(b => b.id === 'habit_daily');
    if (badge) earned.push({ ...badge, earnedAt: today });
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
        earned.push({ ...badge, earnedAt: today });
        break; // Only add highest badge
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
        earned.push({ ...badge, earnedAt: today });
        break; // Only add highest badge
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
        earned.push({ ...badge, earnedAt: today });
        break; // Only add highest badge
      }
    }
  }
  
  return earned;
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

