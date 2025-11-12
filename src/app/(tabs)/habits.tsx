import { StyleSheet, Text, View, TextInput, Pressable, Modal, ScrollView } from "react-native";
import { useState, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/store';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../config/theme';
import { yesterdayYMD, todayYMD } from '../../utils/time';

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const habits = useAppStore((s) => s.habits);
  const logs = useAppStore((s) => s.logs);
  const addHabit = useAppStore((s) => s.addHabit);
  const updateHabit = useAppStore((s) => s.updateHabit);
  const deleteHabit = useAppStore((s) => s.deleteHabit);
  const setTodayHabitLog = useAppStore((s) => s.setTodayHabitLog);
  const getTodayHabitLog = useAppStore((s) => s.getTodayHabitLog);
  const [name, setName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalHabitId, setModalHabitId] = useState<string | null>(null);
  const [modalCompleted, setModalCompleted] = useState<boolean>(true);
  const [modalNote, setModalNote] = useState('');
  const [editVisible, setEditVisible] = useState(false);
  const [editHabitId, setEditHabitId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Goals
  const weeklyGoal = useAppStore((s) => s.weeklyGoal);
  const threeMonthGoal = useAppStore((s) => s.threeMonthGoal);
  const yearlyGoal = useAppStore((s) => s.yearlyGoal);
  const setWeeklyGoal = useAppStore((s) => s.setWeeklyGoal);
  const setThreeMonthGoal = useAppStore((s) => s.setThreeMonthGoal);
  const setYearlyGoal = useAppStore((s) => s.setYearlyGoal);
  
  // Goal Categories - Weekly, Monthly, Yearly
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
  const setHealthWeeklyGoal = useAppStore((s) => s.setHealthWeeklyGoal);
  const setHealthMonthlyGoal = useAppStore((s) => s.setHealthMonthlyGoal);
  const setHealthYearlyGoal = useAppStore((s) => s.setHealthYearlyGoal);
  const setFinancialWeeklyGoal = useAppStore((s) => s.setFinancialWeeklyGoal);
  const setFinancialMonthlyGoal = useAppStore((s) => s.setFinancialMonthlyGoal);
  const setFinancialYearlyGoal = useAppStore((s) => s.setFinancialYearlyGoal);
  const setPersonalGrowthWeeklyGoal = useAppStore((s) => s.setPersonalGrowthWeeklyGoal);
  const setPersonalGrowthMonthlyGoal = useAppStore((s) => s.setPersonalGrowthMonthlyGoal);
  const setPersonalGrowthYearlyGoal = useAppStore((s) => s.setPersonalGrowthYearlyGoal);
  const setRelationshipWeeklyGoal = useAppStore((s) => s.setRelationshipWeeklyGoal);
  const setRelationshipMonthlyGoal = useAppStore((s) => s.setRelationshipMonthlyGoal);
  const setRelationshipYearlyGoal = useAppStore((s) => s.setRelationshipYearlyGoal);
  
  // Note modal state
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<{ habitName: string; note: string; date: string } | null>(null);

  const openModal = (habitId: string, completed: boolean) => {
    // Get existing log for today to pre-populate note
    const existingLog = getTodayHabitLog(habitId);
    setModalHabitId(habitId);
    setModalCompleted(completed);
    // Pre-populate note if it exists, otherwise use the existing log's completion status
    setModalNote(existingLog?.note || '');
    // If there's an existing log, use its completion status instead of the parameter
    if (existingLog) {
      setModalCompleted(existingLog.completed);
    }
    setModalVisible(true);
  };
  const saveModal = async () => {
    if (!modalHabitId) return;
    await setTodayHabitLog(modalHabitId, modalCompleted, modalNote.trim() || undefined);
    setModalVisible(false);
  };

  return (
    <LinearGradient
      colors={[colors.background.gradient.start, colors.background.gradient.end]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingTop: Math.max(insets.top, spacing.xl) }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Habits & Goals</Text>
        
        {/* Add Habit Section */}
        <View style={styles.addSection}>
          <View style={styles.inputContainer}>
            <Ionicons name="add-circle-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Add a new habit..."
              placeholderTextColor={colors.text.tertiary}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (name.trim()) { addHabit(name.trim()); setName(''); }
              }}
            />
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => { if (name.trim()) { addHabit(name.trim()); setName(''); } }}
          >
            <LinearGradient
              colors={[colors.primary.gradient.start, colors.primary.gradient.end]}
              style={styles.addBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add" size={20} color={colors.text.inverse} />
            </LinearGradient>
          </Pressable>
        </View>

        {/* Habits List */}
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="repeat-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No habits yet</Text>
            <Text style={styles.emptySubtext}>Start building your routine by adding your first habit above</Text>
          </View>
        ) : (
          <View style={styles.habitsList}>
            {habits.map((item) => {
              const log = getTodayHabitLog(item.id);
              const isCompleted = log?.completed === true;
              const isLogged = log !== undefined;
              
              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.statusIndicator, isCompleted && styles.statusIndicatorCompleted, !isLogged && styles.statusIndicatorPending]}>
                        {isCompleted && <Ionicons name="checkmark" size={16} color={colors.text.inverse} />}
                        {!isLogged && <Ionicons name="ellipse-outline" size={16} color={colors.text.tertiary} />}
                      </View>
                      <View style={styles.cardTitleContainer}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.statusText}>
                          {isCompleted ? 'Completed today' : isLogged ? 'Not completed' : 'Not logged yet'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <Pressable
                        onPress={() => { setEditHabitId(item.id); setEditName(item.name); setEditVisible(true); }}
                        style={styles.editBtn}
                      >
                        <Ionicons name="create-outline" size={20} color={colors.primary.main} />
                      </Pressable>
                      <Pressable
                        onPress={() => deleteHabit(item.id)}
                        style={styles.iconBtn}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.error.main} />
                      </Pressable>
                    </View>
                  </View>
                  
                  <View style={styles.actionButtons}>
                    <Pressable
                      onPress={() => openModal(item.id, true)}
                      style={styles.actionBtn}
                    >
                      <LinearGradient
                        colors={[colors.success.gradient.start, colors.success.gradient.end]}
                        style={styles.actionBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="checkmark-circle" size={18} color={colors.text.inverse} />
                        <Text style={styles.actionBtnText}>Completed</Text>
                      </LinearGradient>
                    </Pressable>
                    <Pressable
                      onPress={() => openModal(item.id, false)}
                      style={styles.actionBtn}
                    >
                      <LinearGradient
                        colors={[colors.error.light, colors.error.main]}
                        style={styles.actionBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="close-circle" size={18} color={colors.text.inverse} />
                        <Text style={styles.actionBtnText}>Not Completed</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {modalCompleted ? 'How did you feel after?' : 'What did you do instead?'}
              </Text>
              <TextInput
                placeholder={modalCompleted ? 'e.g., Calm, focused...' : 'e.g., Took a walk, meetings...'}
                placeholderTextColor={colors.text.tertiary}
                value={modalNote}
                onChangeText={setModalNote}
                style={styles.modalInput}
                multiline
              />
              <View style={styles.modalButtonRow}>
                <Pressable style={styles.modalPrimaryBtn} onPress={saveModal}>
                  <LinearGradient
                    colors={[colors.primary.gradient.start, colors.primary.gradient.end]}
                    style={styles.modalPrimaryBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Save</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable style={styles.modalSecondaryBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Habit Modal */}
        <Modal visible={editVisible} animationType="slide" transparent>
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Ionicons name="create" size={24} color={colors.primary.main} />
                <Text style={styles.modalTitle}>Edit Habit</Text>
              </View>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Habit name"
                placeholderTextColor={colors.text.tertiary}
                style={styles.modalInput}
                autoFocus
              />
              <View style={styles.modalButtonRow}>
                <Pressable
                  style={styles.modalSecondaryBtn}
                  onPress={() => setEditVisible(false)}
                >
                  <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    if (editHabitId && editName.trim()) {
                      updateHabit(editHabitId, { name: editName.trim() });
                      setEditVisible(false);
                    }
                  }}
                >
                  <LinearGradient
                    colors={[colors.primary.gradient.start, colors.primary.gradient.end]}
                    style={styles.modalPrimaryBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Save</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Goals Section */}
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag-outline" size={20} color={colors.text.primary} />
            <Text style={styles.section}>Goals</Text>
          </View>
          
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary.main} />
              <Text style={styles.goalTitle}>My Week's Main Goal</Text>
            </View>
            <TextInput
              placeholder="What do you want to focus on this week?"
              placeholderTextColor={colors.text.tertiary}
              value={weeklyGoal}
              onChangeText={setWeeklyGoal}
              style={styles.goalInput}
              multiline
            />
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="calendar" size={18} color={colors.secondary.main} />
              <Text style={styles.goalTitle}>My 3-Month Goals</Text>
            </View>
            <TextInput
              placeholder="What's your three-month intention?"
              placeholderTextColor={colors.text.tertiary}
              value={threeMonthGoal}
              onChangeText={setThreeMonthGoal}
              style={styles.goalInput}
              multiline
            />
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="star-outline" size={18} color={colors.warning.main} />
              <Text style={styles.goalTitle}>My 1 Year Goals</Text>
            </View>
            <TextInput
              placeholder="Where do you want to be in a year?"
              placeholderTextColor={colors.text.tertiary}
              value={yearlyGoal}
              onChangeText={setYearlyGoal}
              style={styles.goalInput}
              multiline
            />
          </View>
        </View>

        {/* Goal Categories Section */}
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={20} color={colors.text.primary} />
            <Text style={styles.section}>Goal Categories</Text>
          </View>
          
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="fitness-outline" size={18} color={colors.success.main} />
              <Text style={styles.goalTitle}>Health Goals</Text>
            </View>
            <Text style={styles.goalSubtitle}>Weekly</Text>
            <TextInput
              placeholder="What do you want to focus on this week?"
              placeholderTextColor={colors.text.tertiary}
              value={healthWeeklyGoal}
              onChangeText={setHealthWeeklyGoal}
              style={styles.goalInput}
              multiline
            />
            <Text style={styles.goalSubtitle}>Monthly</Text>
            <TextInput
              placeholder="What's your monthly intention?"
              placeholderTextColor={colors.text.tertiary}
              value={healthMonthlyGoal}
              onChangeText={setHealthMonthlyGoal}
              style={styles.goalInput}
              multiline
            />
            <Text style={styles.goalSubtitle}>Yearly</Text>
            <TextInput
              placeholder="Where do you want to be in a year?"
              placeholderTextColor={colors.text.tertiary}
              value={healthYearlyGoal}
              onChangeText={setHealthYearlyGoal}
              style={styles.goalInput}
              multiline
            />
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="cash-outline" size={18} color={colors.warning.main} />
              <Text style={styles.goalTitle}>Financial Goals</Text>
            </View>
            <Text style={styles.goalSubtitle}>Weekly</Text>
            <TextInput
              placeholder="What do you want to focus on this week?"
              placeholderTextColor={colors.text.tertiary}
              value={financialWeeklyGoal}
              onChangeText={setFinancialWeeklyGoal}
              style={styles.goalInput}
              multiline
            />
            <Text style={styles.goalSubtitle}>Monthly</Text>
            <TextInput
              placeholder="What's your monthly intention?"
              placeholderTextColor={colors.text.tertiary}
              value={financialMonthlyGoal}
              onChangeText={setFinancialMonthlyGoal}
              style={styles.goalInput}
              multiline
            />
            <Text style={styles.goalSubtitle}>Yearly</Text>
            <TextInput
              placeholder="Where do you want to be in a year?"
              placeholderTextColor={colors.text.tertiary}
              value={financialYearlyGoal}
              onChangeText={setFinancialYearlyGoal}
              style={styles.goalInput}
              multiline
            />
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="trending-up-outline" size={18} color={colors.primary.main} />
              <Text style={styles.goalTitle}>Personal Growth Goals</Text>
            </View>
            <Text style={styles.goalSubtitle}>Weekly</Text>
            <TextInput
              placeholder="What do you want to focus on this week?"
              placeholderTextColor={colors.text.tertiary}
              value={personalGrowthWeeklyGoal}
              onChangeText={setPersonalGrowthWeeklyGoal}
              style={styles.goalInput}
              multiline
            />
            <Text style={styles.goalSubtitle}>Monthly</Text>
            <TextInput
              placeholder="What's your monthly intention?"
              placeholderTextColor={colors.text.tertiary}
              value={personalGrowthMonthlyGoal}
              onChangeText={setPersonalGrowthMonthlyGoal}
              style={styles.goalInput}
              multiline
            />
            <Text style={styles.goalSubtitle}>Yearly</Text>
            <TextInput
              placeholder="Where do you want to be in a year?"
              placeholderTextColor={colors.text.tertiary}
              value={personalGrowthYearlyGoal}
              onChangeText={setPersonalGrowthYearlyGoal}
              style={styles.goalInput}
              multiline
            />
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Ionicons name="people-outline" size={18} color={colors.secondary.main} />
              <Text style={styles.goalTitle}>Relationship Goals</Text>
            </View>
            <Text style={styles.goalSubtitle}>Weekly</Text>
            <TextInput
              placeholder="What do you want to focus on this week?"
              placeholderTextColor={colors.text.tertiary}
              value={relationshipWeeklyGoal}
              onChangeText={setRelationshipWeeklyGoal}
              style={styles.goalInput}
              multiline
            />
            <Text style={styles.goalSubtitle}>Monthly</Text>
            <TextInput
              placeholder="What's your monthly intention?"
              placeholderTextColor={colors.text.tertiary}
              value={relationshipMonthlyGoal}
              onChangeText={setRelationshipMonthlyGoal}
              style={styles.goalInput}
              multiline
            />
            <Text style={styles.goalSubtitle}>Yearly</Text>
            <TextInput
              placeholder="Where do you want to be in a year?"
              placeholderTextColor={colors.text.tertiary}
              value={relationshipYearlyGoal}
              onChangeText={setRelationshipYearlyGoal}
              style={styles.goalInput}
              multiline
            />
          </View>
        </View>

        {/* Recent Habit Log Section - Shows most recent habit log (today or yesterday) */}
        {useMemo(() => {
          const today = todayYMD();
          const yesterday = yesterdayYMD();
          
          // Get the most recent log (prefer today, then yesterday)
          // Sort by date descending, then by habit name for consistency
          const sortedLogs = [...logs]
            .filter(log => log.date === today || log.date === yesterday)
            .sort((a, b) => {
              // First sort by date (today first)
              if (a.date !== b.date) {
                return a.date === today ? -1 : 1;
              }
              // Then by habit name for consistency
              const habitA = habits.find(h => h.id === a.habitId)?.name || '';
              const habitB = habits.find(h => h.id === b.habitId)?.name || '';
              return habitA.localeCompare(habitB);
            });
          
          // Get the most recent unique habit log (one per habit, most recent date)
          const recentLogs = new Map<string, typeof sortedLogs[0]>();
          for (const log of sortedLogs) {
            const existing = recentLogs.get(log.habitId);
            if (!existing || log.date === today) {
              recentLogs.set(log.habitId, log);
            }
          }
          
          const recentLogsArray = Array.from(recentLogs.values())
            .sort((a, b) => {
              // Sort by date (today first), then by completion status, then by habit name
              if (a.date !== b.date) {
                return a.date === today ? -1 : 1;
              }
              if (a.completed !== b.completed) {
                return a.completed ? -1 : 1; // Completed first
              }
              const habitA = habits.find(h => h.id === a.habitId)?.name || '';
              const habitB = habits.find(h => h.id === b.habitId)?.name || '';
              return habitA.localeCompare(habitB);
            });
          
          return recentLogsArray.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={20} color={colors.text.primary} />
                <Text style={styles.section}>Recent</Text>
              </View>
              <View style={styles.historyContainer}>
                {recentLogsArray.map((item) => {
                  const h = habits.find(h => h.id === item.habitId);
                  const isToday = item.date === today;
                  return (
                    <Pressable
                      key={item.id}
                      style={styles.logRow}
                      onPress={() => {
                        if (item.note) {
                          setSelectedNote({ habitName: h?.name ?? 'Habit', note: item.note, date: item.date });
                          setNoteModalVisible(true);
                        }
                      }}
                      disabled={!item.note}
                    >
                      <View style={styles.logLeft}>
                        <View style={[styles.logDot, item.completed && styles.logDotCompleted]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.logName}>{h?.name ?? 'Habit'}</Text>
                          <Text style={styles.logDate}>
                            {isToday ? 'Today' : 'Yesterday'}
                          </Text>
                          {item.note && (
                            <Text style={styles.logNotePreview} numberOfLines={1}>
                              {item.note}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={[styles.logBadge, item.completed && styles.logBadgeCompleted]}>
                        <Ionicons
                          name={item.completed ? "checkmark-circle" : "close-circle"}
                          size={14}
                          color={item.completed ? colors.success.main : colors.error.main}
                        />
                        <Text style={[styles.logStatus, { color: item.completed ? colors.success.main : colors.error.main }]}>
                          {item.completed ? 'Done' : 'Missed'}
                        </Text>
                      </View>
                      {item.note && (
                        <Ionicons name="document-text-outline" size={16} color={colors.text.tertiary} style={{ marginLeft: spacing.sm }} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null;
        }, [logs, habits])}

        {/* Note View Modal */}
        <Modal visible={noteModalVisible} animationType="slide" transparent>
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Ionicons name="document-text" size={24} color={colors.primary.main} />
                <Text style={styles.modalTitle}>Note</Text>
              </View>
              {selectedNote && (
                <>
                  <Text style={styles.noteHabitName}>{selectedNote.habitName}</Text>
                  <Text style={styles.noteDate}>{selectedNote.date}</Text>
                  <Text style={styles.noteContent}>{selectedNote.note}</Text>
                </>
              )}
              <View style={styles.modalButtonRow}>
                <Pressable style={styles.modalPrimaryBtn} onPress={() => setNoteModalVisible(false)}>
                  <LinearGradient
                    colors={[colors.primary.gradient.start, colors.primary.gradient.end]}
                    style={styles.modalPrimaryBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Close</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xl,
    textAlign: 'center',
    color: colors.text.primary,
  },
  // Add Habit Section
  addSection: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },
  addBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
    width: 56,
    height: 56,
  },
  addBtnGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Habits List
  habitsList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    ...components.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border.medium,
  },
  statusIndicatorCompleted: {
    backgroundColor: colors.success.main,
    borderColor: colors.success.main,
  },
  statusIndicatorPending: {
    backgroundColor: 'transparent',
    borderColor: colors.border.medium,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
  },
  editBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(123, 163, 212, 0.2)', // Light blue background for contrast
    borderWidth: 1.5,
    borderColor: colors.primary.main, // Primary blue border for visibility
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  actionBtnGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionBtnText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Goals Section
  goalsSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  section: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  goalCard: {
    ...components.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  goalTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  goalSubtitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  goalInput: {
    ...components.input,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  // History Section
  historyContainer: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.medium,
  },
  logDotCompleted: {
    backgroundColor: colors.success.main,
  },
  logName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  logDate: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  logBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  logBadgeCompleted: {
    backgroundColor: colors.success.light + '20',
  },
  logStatus: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  logNotePreview: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  // Modals
  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1A2A3A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
    padding: spacing.xl,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  modalInput: {
    ...components.input,
    fontSize: typography.sizes.base,
    marginBottom: spacing.md,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalPrimaryBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    flex: 1,
    ...shadows.sm,
  },
  modalPrimaryBtnGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  modalSecondaryBtn: {
    borderWidth: 2,
    borderColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  modalSecondaryBtnText: {
    color: colors.primary.main,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  noteHabitName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  noteDate: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  noteContent: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
});
