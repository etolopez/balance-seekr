import { StyleSheet, Text, View, TextInput, Pressable, FlatList } from 'react-native';
import { useState, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../state/store';
import { playBeep } from '../../audio/sounds';
import { colors, typography, spacing, borderRadius, shadows, components, getBackgroundGradient } from '../../config/theme';


export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const tasks = useAppStore((s) => s.tasks);
  const addTask = useAppStore((s) => s.addTask);
  const toggleTask = useAppStore((s) => s.toggleTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const backgroundHue = useAppStore((s) => s.backgroundHue);
  const [title, setTitle] = useState('');
  
  // Get adjusted gradient colors based on hue setting
  const gradientColors = getBackgroundGradient(backgroundHue);

  // Handle task completion with haptics and sound
  const handleToggleTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const willBeCompleted = task && !task.done;
    toggleTask(taskId);
    
    // If task is being completed (not uncompleted), trigger haptics and sound
    if (willBeCompleted) {
      // Small vibration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
      // Success sound (bundled asset with fallback)
      playBeep().catch(()=>{});
    }
  };

  const open = useMemo(() => tasks.filter(t => !t.done), [tasks]);
  const done = useMemo(() => tasks.filter(t => t.done), [tasks]);

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={[styles.content, { paddingTop: Math.max(insets.top, spacing.xl) + spacing.lg }]}>
        <Text style={styles.title}>Tasks</Text>
        <View style={styles.row}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Add a task"
            placeholderTextColor={colors.text.tertiary}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={() => { if (title.trim()) { addTask(title.trim()); setTitle(''); } }}
          />
          <Pressable
            style={styles.addBtn}
            onPress={() => { if (title.trim()) { addTask(title.trim()); setTitle(''); } }}
          >
            <LinearGradient
              colors={[colors.primary.gradient.start, colors.primary.gradient.end]}
              style={styles.addBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.addBtnText}>Add</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <Text style={styles.section}>Open</Text>
        <FlatList
          data={open}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable onPress={() => handleToggleTask(item.id)} style={styles.checkbox(item.done)}>
                {item.done ? (
                  <LinearGradient
                    colors={[colors.success.gradient.start, colors.success.gradient.end]}
                    style={styles.checkboxGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.checkmark}>✓</Text>
                  </LinearGradient>
                ) : (
                  <View style={{ width: '100%', height: '100%' }} />
                )}
              </Pressable>
              <Text style={[styles.cardTitle, item.done && { textDecorationLine: 'line-through', opacity: 0.6 }]}>
                {item.title}
              </Text>
              <Pressable onPress={() => deleteTask(item.id)} style={styles.del}>
                <Text style={styles.delText}>Delete</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No open tasks</Text>}
        />

        <Text style={styles.section}>Completed</Text>
        <FlatList
          data={done}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable onPress={() => handleToggleTask(item.id)} style={styles.checkbox(item.done)}>
                {item.done ? (
                  <LinearGradient
                    colors={[colors.success.gradient.start, colors.success.gradient.end]}
                    style={styles.checkboxGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.checkmark}>✓</Text>
                  </LinearGradient>
                ) : (
                  <View style={{ width: '100%', height: '100%' }} />
                )}
              </Pressable>
              <Text style={[styles.cardTitle, { textDecorationLine: 'line-through', opacity: 0.6 }]}>
                {item.title}
              </Text>
              <Pressable onPress={() => deleteTask(item.id)} style={styles.del}>
                <Text style={styles.delText}>Delete</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No completed tasks</Text>}
        />
      </View>
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    ...components.input,
    flex: 1,
  },
  addBtn: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  addBtnGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  addBtnText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
  section: {
    fontWeight: typography.weights.bold,
    marginVertical: spacing.sm,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  checkbox: (done: boolean) => {
    const baseStyle = {
      width: 28,
      height: 28,
      borderRadius: borderRadius.sm,
      borderWidth: 2,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      overflow: 'hidden' as const,
    };
    return {
      ...baseStyle,
      borderColor: done ? colors.success.main : colors.border.medium,
      backgroundColor: done ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
    };
  },
  checkboxGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.text.inverse,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  cardTitle: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  del: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  delText: {
    color: colors.error.main,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  emptyText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
