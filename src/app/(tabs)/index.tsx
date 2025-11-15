import { StyleSheet, Text, View, Pressable, ScrollView, Image } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/store';
import { todayYMD, getFiveMinuteInterval } from '../../utils/time';
import { colors, typography, spacing, borderRadius, shadows } from '../../config/theme';

type GoalCategory = 'main' | 'health' | 'financial' | 'personalGrowth' | 'relationship';

/**
 * Get task background color based on index
 * Uses bolder, whiter colors to distinguish tasks from habits
 */
function getTaskColor(index: number): string {
  const taskColors = [
    'rgba(255, 255, 255, 0.35)',   // Bright white
    'rgba(255, 240, 255, 0.4)',    // White with slight pink tint
    'rgba(240, 255, 255, 0.4)',    // White with slight blue tint
    'rgba(255, 255, 240, 0.4)',    // White with slight yellow tint
    'rgba(255, 250, 250, 0.4)',    // White with slight red tint
    'rgba(250, 250, 255, 0.4)',    // White with slight purple tint
  ];
  return taskColors[index % taskColors.length];
}

/**
 * Home Screen - Welcome screen with goals and daily quotes
 * Features a soft gradient background and calming design
 * Includes leaf icon (potential app logo) and inspirational quotes
 * Shows main goals first, then allows filtering by goal categories
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const weeklyGoal = useAppStore((s) => s.weeklyGoal);
  const threeMonthGoal = useAppStore((s) => s.threeMonthGoal);
  const yearlyGoal = useAppStore((s) => s.yearlyGoal);
  const healthWeeklyGoal = useAppStore((s) => s.healthWeeklyGoal);
  const healthMonthlyGoal = useAppStore((s) => s.healthMonthlyGoal);
  const healthYearlyGoal = useAppStore((s) => s.healthYearlyGoal);
  const financialWeeklyGoal = useAppStore((s) => s.financialWeeklyGoal);
  const financialMonthlyGoal = useAppStore((s) => s.financialMonthlyGoal);
  const financialYearlyGoal = useAppStore((s) => s.financialYearlyGoal);
  const personalGrowthWeeklyGoal = useAppStore((s) => s.personalGrowthWeeklyGoal);
  const personalGrowthMonthlyGoal = useAppStore((s) => s.personalGrowthMonthlyGoal);
  const personalGrowthYearlyGoal = useAppStore((s) => s.personalGrowthYearlyGoal);
  const relationshipWeeklyGoal = useAppStore((s) => s.relationshipWeeklyGoal);
  const relationshipMonthlyGoal = useAppStore((s) => s.relationshipMonthlyGoal);
  const relationshipYearlyGoal = useAppStore((s) => s.relationshipYearlyGoal);
  const dailyQuote = useAppStore((s) => s.dailyQuote);
  const habits = useAppStore((s) => s.habits);
  const tasks = useAppStore((s) => s.tasks);
  const logs = useAppStore((s) => s.logs);
  const getTodayHabitLog = useAppStore((s) => s.getTodayHabitLog);
  
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory>('main');
  const [quoteInterval, setQuoteInterval] = useState(getFiveMinuteInterval());
  
  // Update quote interval every 5 minutes
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    // Calculate milliseconds until next 5-minute interval
    const now = new Date();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();
    const currentMilliseconds = now.getMilliseconds();
    
    // Calculate minutes until next 5-minute mark
    const minutesUntilNext = 5 - (currentMinutes % 5);
    const secondsUntilNext = minutesUntilNext * 60 - currentSeconds;
    const millisecondsUntilNext = secondsUntilNext * 1000 - currentMilliseconds;
    
    // Set initial timeout to align with next 5-minute interval
    const initialTimeout = setTimeout(() => {
      setQuoteInterval(getFiveMinuteInterval());
      
      // Then set interval to update every 5 minutes (300,000 ms)
      interval = setInterval(() => {
        setQuoteInterval(getFiveMinuteInterval());
      }, 5 * 60 * 1000); // 5 minutes in milliseconds
    }, millisecondsUntilNext);
    
    return () => {
      clearTimeout(initialTimeout);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);
  
  // Get quote based on 5-minute interval
  const quote = useMemo(() => dailyQuote(quoteInterval), [dailyQuote, quoteInterval]);
  
  // Get goals for selected category - only show filled ones
  const categoryGoals = useMemo(() => {
    switch (selectedCategory) {
      case 'health':
        return {
          weekly: healthWeeklyGoal,
          monthly: healthMonthlyGoal,
          yearly: healthYearlyGoal,
        };
      case 'financial':
        return {
          weekly: financialWeeklyGoal,
          monthly: financialMonthlyGoal,
          yearly: financialYearlyGoal,
        };
      case 'personalGrowth':
        return {
          weekly: personalGrowthWeeklyGoal,
          monthly: personalGrowthMonthlyGoal,
          yearly: personalGrowthYearlyGoal,
        };
      case 'relationship':
        return {
          weekly: relationshipWeeklyGoal,
          monthly: relationshipMonthlyGoal,
          yearly: relationshipYearlyGoal,
        };
      default:
        return null;
    }
  }, [selectedCategory, healthWeeklyGoal, healthMonthlyGoal, healthYearlyGoal, financialWeeklyGoal, financialMonthlyGoal, financialYearlyGoal, personalGrowthWeeklyGoal, personalGrowthMonthlyGoal, personalGrowthYearlyGoal, relationshipWeeklyGoal, relationshipMonthlyGoal, relationshipYearlyGoal]);

  // Check if category has any goals
  const hasHealthGoals = healthWeeklyGoal || healthMonthlyGoal || healthYearlyGoal;
  const hasFinancialGoals = financialWeeklyGoal || financialMonthlyGoal || financialYearlyGoal;
  const hasPersonalGrowthGoals = personalGrowthWeeklyGoal || personalGrowthMonthlyGoal || personalGrowthYearlyGoal;
  const hasRelationshipGoals = relationshipWeeklyGoal || relationshipMonthlyGoal || relationshipYearlyGoal;

  // Calculate task completion percentage
  const taskCompletion = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.done).length;
    return (completed / tasks.length) * 100;
  }, [tasks]);

  // Get today's date for habit status checking - recalculate on each render to ensure it updates daily
  const today = todayYMD();
  
  return (
    <LinearGradient
      colors={[colors.background.gradient.start, colors.background.gradient.end]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, spacing.xl) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentInner}>
          {/* App Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/logo2.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.title}>Balance Seekr</Text>
          
          {/* Main Goals Section */}
          {selectedCategory === 'main' ? (
            <>
              {/* Intention for the Week - Separate Section */}
              {weeklyGoal && (
                <View style={styles.intentionBox}>
                  <Text style={styles.goalHeader}>Intention for the Week</Text>
                  <Text style={styles.goalText}>{weeklyGoal}</Text>
                </View>
              )}
              
              {/* 3 Month and Yearly Goals - Separate Section */}
              {(threeMonthGoal || yearlyGoal) && (
                <View style={styles.goalsBox}>
                  {threeMonthGoal && (
                    <>
                      <Text style={styles.goalHeader}>My 3-Month Goals</Text>
                      <Text style={styles.goalText}>{threeMonthGoal}</Text>
                    </>
                  )}
                  {yearlyGoal && (
                    <>
                      <Text style={styles.goalHeader}>My 1 Year Goals</Text>
                      <Text style={styles.goalText}>{yearlyGoal}</Text>
                    </>
                  )}
                </View>
              )}
              
              {!weeklyGoal && !threeMonthGoal && !yearlyGoal && (
                <View style={styles.goalsBox}>
                  <Text style={styles.goalText}>No main goals set yet. Add them in Habits & Goals.</Text>
                </View>
              )}
            </>
          ) : categoryGoals ? (
            <View style={styles.goalsBox}>
              <Text style={styles.goalHeader}>
                {selectedCategory === 'health' && 'Health Goals'}
                {selectedCategory === 'financial' && 'Financial Goals'}
                {selectedCategory === 'personalGrowth' && 'Personal Growth Goals'}
                {selectedCategory === 'relationship' && 'Relationship Goals'}
              </Text>
              {categoryGoals.weekly && (
                <>
                  <Text style={styles.goalSubHeader}>Weekly</Text>
                  <Text style={styles.goalText}>{categoryGoals.weekly}</Text>
                </>
              )}
              {categoryGoals.monthly && (
                <>
                  <Text style={styles.goalSubHeader}>Monthly</Text>
                  <Text style={styles.goalText}>{categoryGoals.monthly}</Text>
                </>
              )}
              {categoryGoals.yearly && (
                <>
                  <Text style={styles.goalSubHeader}>Yearly</Text>
                  <Text style={styles.goalText}>{categoryGoals.yearly}</Text>
                </>
              )}
              {!categoryGoals.weekly && !categoryGoals.monthly && !categoryGoals.yearly && (
                <Text style={styles.goalText}>No goals set for this category yet. Add them in Habits & Goals.</Text>
              )}
            </View>
          ) : null}

          {/* Goal Category Filter Buttons - Only show if category has goals */}
          <View style={styles.filterContainer}>
            <Pressable
              style={[styles.filterButton, selectedCategory === 'main' && styles.filterButtonActive]}
              onPress={() => setSelectedCategory('main')}
            >
              <Text style={[styles.filterButtonText, selectedCategory === 'main' && styles.filterButtonTextActive]}>
                Main
              </Text>
            </Pressable>
            {hasHealthGoals && (
              <Pressable
                style={[styles.filterButton, selectedCategory === 'health' && styles.filterButtonActive]}
                onPress={() => setSelectedCategory('health')}
              >
                <Ionicons name="fitness-outline" size={16} color={selectedCategory === 'health' ? colors.text.inverse : colors.text.secondary} />
                <Text style={[styles.filterButtonText, selectedCategory === 'health' && styles.filterButtonTextActive]}>
                  Health
                </Text>
              </Pressable>
            )}
            {hasFinancialGoals && (
              <Pressable
                style={[styles.filterButton, selectedCategory === 'financial' && styles.filterButtonActive]}
                onPress={() => setSelectedCategory('financial')}
              >
                <Ionicons name="cash-outline" size={16} color={selectedCategory === 'financial' ? colors.text.inverse : colors.text.secondary} />
                <Text style={[styles.filterButtonText, selectedCategory === 'financial' && styles.filterButtonTextActive]}>
                  Financial
                </Text>
              </Pressable>
            )}
            {hasPersonalGrowthGoals && (
              <Pressable
                style={[styles.filterButton, selectedCategory === 'personalGrowth' && styles.filterButtonActive]}
                onPress={() => setSelectedCategory('personalGrowth')}
              >
                <Ionicons name="trending-up-outline" size={16} color={selectedCategory === 'personalGrowth' ? colors.text.inverse : colors.text.secondary} />
                <Text style={[styles.filterButtonText, selectedCategory === 'personalGrowth' && styles.filterButtonTextActive]}>
                  Growth
                </Text>
              </Pressable>
            )}
            {hasRelationshipGoals && (
              <Pressable
                style={[styles.filterButton, selectedCategory === 'relationship' && styles.filterButtonActive]}
                onPress={() => setSelectedCategory('relationship')}
              >
                <Ionicons name="people-outline" size={16} color={selectedCategory === 'relationship' ? colors.text.inverse : colors.text.secondary} />
                <Text style={[styles.filterButtonText, selectedCategory === 'relationship' && styles.filterButtonTextActive]}>
                  Relationships
                </Text>
              </Pressable>
            )}
          </View>

          {/* Habits Section */}
          {habits.length > 0 && (
            <View style={styles.habitsSection}>
              <Text style={styles.habitsTitle}>Daily Habit Tracker:</Text>
              <View style={styles.habitsList}>
                {habits.map((habit, index) => {
                  // Get today's log for this habit
                  const todayLog = logs.find((l) => l.habitId === habit.id && l.date === today);
                  const isCompleted = todayLog?.completed === true;
                  const isMissed = todayLog?.completed === false;
                  const isNotLogged = todayLog === undefined;
                  
                  return (
                    <View 
                      key={habit.id} 
                      style={[
                        styles.habitItem,
                        { backgroundColor: getHabitColor(index) }
                      ]}
                    >
                      <Text style={styles.habitText}>{habit.name}</Text>
                      {/* Status indicator overlay in top right corner */}
                      <View style={styles.habitStatusIndicator}>
                        {isCompleted ? (
                          <Ionicons name="checkmark-circle" size={24} color={colors.success.main} />
                        ) : isMissed ? (
                          <Ionicons name="close-circle" size={24} color={colors.error.main} />
                        ) : (
                          <Ionicons name="ellipse" size={20} color={colors.text.tertiary} />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Tasks Progress Circle - Always visible to remind users to add tasks */}
          <View style={styles.tasksSection}>
            <Text style={styles.tasksTitle}>Tasks Progress</Text>
            <View style={styles.progressContainer}>
              {/* Circular progress indicator - fills from bottom like a container */}
              <View style={[
                styles.progressCircleWrapper,
                taskCompletion === 100 && tasks.length > 0 && { borderColor: colors.success.main }
              ]}>
                <View style={styles.progressCircleBackground} />
                {tasks.length > 0 && (
                  <LinearGradient
                    colors={taskCompletion === 100 
                      ? [colors.success.main, colors.success.dark] 
                      : ['#FF6B9D', '#C44569', '#8B4C89', '#6A4C93'] // Red to purple gradient
                    }
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[
                      styles.progressCircleFill,
                      { height: `${taskCompletion}%` }
                    ]}
                  />
                )}
                <View style={styles.progressTextContainer}>
                  <Text style={[
                    styles.progressPercentage,
                    taskCompletion === 100 && tasks.length > 0 && { color: colors.success.main }
                  ]}>
                    {tasks.length > 0 ? Math.round(taskCompletion) : 0}%
                  </Text>
                  <Text style={styles.progressLabel}>
                    {tasks.length > 0 
                      ? `${tasks.filter(t => t.done).length} / ${tasks.length}`
                      : 'No tasks yet'
                    }
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tasks List - Show all tasks (completed and open) until deleted */}
          {tasks.length > 0 && (
            <View style={styles.habitsSection}>
              <View style={styles.habitsList}>
                {tasks.map((task, index) => (
                  <View 
                    key={task.id} 
                    style={[
                      styles.taskItem,
                      { backgroundColor: getTaskColor(index) }
                    ]}
                  >
                    <Text style={styles.taskText}>{task.title}</Text>
                    {/* Status indicator overlay in top right corner */}
                    <View style={styles.habitStatusIndicator}>
                      {task.done ? (
                        <Ionicons name="checkmark-circle" size={24} color={colors.success.main} />
                      ) : (
                        <Ionicons name="ellipse" size={20} color={colors.text.tertiary} />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Daily Quote Section */}
          <View style={styles.quoteCard}>
            <Ionicons name="sparkles" size={20} color={colors.text.tertiary} style={styles.quoteIcon} />
            <Text style={styles.quoteText}>"{quote}"</Text>
          </View>

          {/* Settings Button */}
          <Link href="/settings" asChild>
            <Pressable style={styles.settingsBtn}>
              <Ionicons name="construct-outline" size={20} color={colors.text.secondary} />
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    width: '100%',
  },
  contentInner: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing['2xl'],
    gap: spacing.lg,
    width: '100%',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: spacing.lg,
    alignSelf: 'center',
    ...shadows.sm,
  },
  logoContainer: {
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  goalsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: spacing.md,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  intentionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: spacing.md,
    marginHorizontal: -spacing['2xl'], // Negative margin to touch screen edges
    gap: spacing.xs,
    overflow: 'hidden',
  },
  goalHeader: {
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  goalSubHeader: {
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  goalText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  quoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: spacing.md,
    ...shadows.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  quoteIcon: {
    marginBottom: spacing.sm,
    opacity: 0.6,
  },
  quoteText: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 480,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  filterButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  filterButtonTextActive: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
  habitsSection: {
    width: '100%',
    maxWidth: 480,
    marginTop: spacing.md,
  },
  habitsTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  habitsList: {
    gap: spacing.sm,
  },
  habitItem: {
    padding: spacing.md,
    paddingRight: spacing.xl + spacing.md, // Extra padding on right for icon
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'visible', // Changed to 'visible' so icon can show outside bounds if needed
    ...shadows.sm,
    position: 'relative',
    minHeight: 50, // Ensure enough height for icon
  },
  habitText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    flex: 1,
  },
  taskItem: {
    padding: spacing.md,
    paddingRight: spacing.xl + spacing.md, // Extra padding on right for icon
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)', // Bolder border for tasks
    overflow: 'visible',
    ...shadows.sm,
    position: 'relative',
    minHeight: 50,
  },
  taskText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold, // Bold text for tasks
    color: colors.text.primary,
    flex: 1,
  },
  habitStatusIndicator: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    zIndex: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    // Add subtle background for better visibility on colored backgrounds
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    // Add shadow for depth
    ...shadows.sm,
  },
  tasksSection: {
    width: '100%',
    maxWidth: 480,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  tasksTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressCircleBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: 'transparent',
  },
  progressCircleFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    opacity: 0.3,
  },
  progressTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  progressPercentage: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  progressLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});

/**
 * Get habit background color based on index
 * Creates a variety of glassy colors for visual distinction
 */
function getHabitColor(index: number): string {
  const colors = [
    'rgba(123, 163, 212, 0.25)',   // Soft blue
    'rgba(184, 169, 212, 0.25)',   // Soft lavender
    'rgba(127, 179, 168, 0.25)',   // Soft sage
    'rgba(232, 184, 154, 0.25)',   // Soft peach
    'rgba(168, 200, 232, 0.25)',   // Light sky blue
    'rgba(212, 200, 232, 0.25)',   // Light lavender
    'rgba(168, 212, 200, 0.25)',   // Light mint
    'rgba(245, 212, 196, 0.25)',   // Light peach
  ];
  return colors[index % colors.length];
}
