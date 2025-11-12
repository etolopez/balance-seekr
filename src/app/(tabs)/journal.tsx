import { StyleSheet, Text, View, TextInput, Pressable, ScrollView } from "react-native";
import { useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/store';
import { todayYMD, isoToLocalYMD } from '../../utils/time';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../config/theme';
import * as Haptics from 'expo-haptics';
import { playBeep2 } from '../../audio/sounds';

/**
 * Journal Writing Prompts - A comprehensive list of prompts to inspire journaling
 * Covers gratitude, reflection, growth, emotions, relationships, and daily experiences
 */
const JOURNAL_PROMPTS = [
  "I'm so grateful for...",
  "Yesterday didn't work out as I wanted because...",
  "Today I learned that...",
  "What made me smile today?",
  "A challenge I'm facing right now is...",
  "I feel proud of myself because...",
  "Something I want to let go of is...",
  "A person who made my day better is...",
  "If I could tell my past self one thing, it would be...",
  "What I need more of in my life is...",
  "A moment today that I want to remember is...",
  "I'm feeling... and here's why:",
  "Something that surprised me today was...",
  "A goal I'm working towards is...",
  "What I love about myself is...",
  "A difficult conversation I need to have is...",
  "I'm excited about...",
  "Something I'm worried about is...",
  "A small win I had today was...",
  "What I wish others understood about me is...",
  "A habit I want to build is...",
  "I feel most like myself when...",
  "Something I'm curious about is...",
  "A memory that brings me joy is...",
  "What I need to forgive myself for is...",
  "I feel supported when...",
  "A boundary I need to set is...",
  "What I'm looking forward to is...",
  "I feel overwhelmed by...",
  "A skill I want to develop is...",
  "What brings me peace is...",
  "I feel disconnected from...",
  "A dream I have is...",
  "What I appreciate about my life right now is...",
  "I feel anxious about...",
  "A relationship I want to nurture is...",
  "What I need to accept is...",
  "I feel inspired by...",
  "A change I want to make is...",
  "What I'm grateful for in my relationships is...",
  "I feel stuck because...",
  "A place that makes me happy is...",
  "What I want to remember about this time is...",
  "I feel confident when...",
  "A fear I want to overcome is...",
  "What I love doing is...",
  "I feel uncertain about...",
  "A lesson I learned recently is...",
  "What I need to say to someone is...",
  "I feel content when...",
  "A hope I have for the future is...",
  "What I'm struggling with is...",
  "I feel energized by...",
  "A decision I need to make is...",
  "What I want to create is...",
  "I feel grateful for my body because...",
  "A question I'm pondering is...",
  "What I need to release is...",
  "I feel loved when...",
  "A mistake I learned from is...",
  "What I want to explore is...",
  "I feel peaceful when...",
  "A value that's important to me is...",
  "What I need to celebrate is...",
  "I feel motivated by...",
  "A truth I need to acknowledge is...",
  "What I want to improve is...",
  "I feel connected to...",
  "A wish I have is...",
  "What I'm discovering about myself is...",
  "I feel strong when...",
  "A moment of clarity I had was...",
  "What I want to express is...",
  "I feel hopeful about...",
  "A pattern I notice in my life is...",
  "What I need to be kinder to myself about is...",
  "I feel creative when...",
  "A conversation that impacted me was...",
  "What I want to understand better is...",
  "I feel at home when...",
  "A choice I made that I'm proud of is...",
  "What I'm letting go of is...",
  "I feel seen when...",
  "A way I want to grow is...",
  "What I need to remember is...",
  "I feel free when...",
  "A connection I made today was...",
  "What I want to honor is...",
  "I feel balanced when...",
  "A reflection on this week:",
  "What I'm learning to accept is...",
  "I feel whole when...",
  "A moment I want to savor is...",
  "What I need to trust is...",
  "I feel alive when...",
  "A way I showed myself compassion today was...",
  "What I want to embrace is...",
  "I feel grounded when...",
  "A realization I had is...",
  "What I'm opening myself up to is...",
];

/**
 * Journal Screen - Create, view, and manage journal entries
 * Features a form to create entries, recent entries list, and calendar view
 */
export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const journal = useAppStore((s) => s.journal);
  const addJournal = useAppStore((s) => s.addJournal);
  const updateJournal = useAppStore((s) => s.updateJournal);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // YYYY-MM-DD
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * JOURNAL_PROMPTS.length));

  const journalByDate = useMemo(() => {
    const map = new Map<string, typeof journal>();
    for (const j of journal) {
      // Convert UTC timestamp to local date for accurate grouping
      const d = isoToLocalYMD(j.createdAt);
      if (!map.has(d)) map.set(d, [] as any);
      (map.get(d) as any).push(j);
    }
    return map;
  }, [journal]);

  const monthMeta = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const first = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0).getDate();
    const startOffset = first.getDay();
    const days = Array.from({ length: lastDay }, (_, i) => i + 1);
    const ym = `${y}-${String(m + 1).padStart(2, '0')}`;
    const hasEntry = (day: number) => journalByDate.has(`${ym}-${String(day).padStart(2, '0')}`);
    return { y, m, startOffset, days, ym, hasEntry };
  }, [currentMonth, journalByDate]);

  // Filter and sort entries for the selected date (or today if no date selected)
  const selectedDateForEntries = selectedDate || todayYMD();
  const todaysEntries = useMemo(() => {
    return [...journal]
      .filter((entry) => {
        // Convert UTC timestamp to local date for accurate comparison
        const entryLocalDate = isoToLocalYMD(entry.createdAt);
        return entryLocalDate === selectedDateForEntries;
      })
      .sort((a, b) => {
        // Sort by createdAt descending (most recent first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [journal, selectedDateForEntries]);

  // Get section title based on selected date
  const entriesSectionTitle = useMemo(() => {
    if (selectedDate) {
      const date = new Date(selectedDate + 'T00:00:00');
      const today = new Date(todayYMD() + 'T00:00:00');
      const isToday = date.getTime() === today.getTime();
      
      if (isToday) {
        return "Today's entries";
      } else {
        return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      }
    }
    return "Today's entries";
  }, [selectedDate]);

  return (
    <LinearGradient
      colors={[colors.background.gradient.start, colors.background.gradient.end]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, spacing.xl) + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Journal</Text>
        <View style={styles.form}>
          <View style={styles.formHeader}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.formNote}>New entries are created for today ({todayYMD()})</Text>
          </View>
          <TextInput
            placeholder="Title"
            placeholderTextColor={colors.text.tertiary}
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <TextInput
            placeholder="Write something..."
            placeholderTextColor={colors.text.tertiary}
            value={content}
            onChangeText={setContent}
            style={[styles.input, styles.textArea]}
            multiline
            textAlignVertical="top"
          />
          <Pressable
            style={styles.save}
            disabled={!(title.trim().length > 0 || content.trim().length > 0)}
            onPress={() => {
              const t = title.trim();
              const c = content.trim();
              if (!(t || c)) return; // guarded by disabled, but double-check
              console.log('[Journal] Creating new entry:', { title: t || 'Untitled', contentLength: c.length });
              addJournal(t || 'Untitled', c);
              // cues: audio + haptics (same as task completion)
              playBeep2().catch(()=>{});
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
              setTitle('');
              setContent('');
              // Clear selected date so new entry appears in today's section
              setSelectedDate(null);
              console.log('[Journal] Entry creation initiated, UI updated');
            }}
          >
            <LinearGradient
              colors={[colors.secondary.gradient.start, colors.secondary.gradient.end]}
              style={[styles.saveGradient, !(title.trim().length > 0 || content.trim().length > 0) && { opacity: 0.5 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.saveText}>Save</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Journal Prompt Box */}
        <View style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <Ionicons name="bulb-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.promptLabel}>Writing idea prompt</Text>
          </View>
          <Text style={styles.promptText}>{JOURNAL_PROMPTS[promptIndex]}</Text>
          <Pressable 
            style={styles.promptButton}
            onPress={() => {
              // Cycle to next prompt, ensuring we don't repeat the same one immediately
              let nextIndex;
              do {
                nextIndex = Math.floor(Math.random() * JOURNAL_PROMPTS.length);
              } while (nextIndex === promptIndex && JOURNAL_PROMPTS.length > 1);
              setPromptIndex(nextIndex);
            }}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.promptButtonText}>New Prompt</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Calendar</Text>
        <View style={styles.calendarHeader}>
          <Pressable onPress={() => setCurrentMonth(new Date(monthMeta.y, monthMeta.m - 1, 1))} style={styles.calNav}><Text style={styles.calNavText}>{'<'}</Text></Pressable>
          <Text style={styles.calTitle}>{currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</Text>
          <Pressable onPress={() => setCurrentMonth(new Date(monthMeta.y, monthMeta.m + 1, 1))} style={styles.calNav}><Text style={styles.calNavText}>{'>'}</Text></Pressable>
        </View>
        <View style={styles.weekRow}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <Text key={d} style={styles.weekCell}>{d}</Text>)}
        </View>
        <View style={styles.grid}>
          {Array.from({ length: monthMeta.startOffset }).map((_, i) => <View key={`pad-${i}`} style={styles.dayCell} />)}
          {monthMeta.days.map((d) => {
            const dateStr = `${monthMeta.ym}-${String(d).padStart(2, '0')}`;
            const date = new Date(dateStr + 'T00:00:00');
            const today = new Date(todayYMD() + 'T00:00:00');
            const isFuture = date.getTime() > today.getTime();
            const selected = selectedDate === dateStr;
            const marked = monthMeta.hasEntry(d);
            return (
              <Pressable 
                key={d} 
                style={[
                  styles.dayCell, 
                  selected && styles.daySelected,
                  isFuture && styles.dayCellFuture
                ]} 
                onPress={() => !isFuture && setSelectedDate(dateStr)}
                disabled={isFuture}
              >
                <Text style={[styles.dayText, isFuture && styles.dayTextFuture]}>{d}</Text>
                {marked && !isFuture && <View style={styles.dot} />}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>{entriesSectionTitle}</Text>
        {todaysEntries.length === 0 ? (
          <Text style={styles.emptyText}>
            {selectedDate ? `No entries for this date.` : `No entries for today yet.`}
          </Text>
        ) : (
          todaysEntries.map((item, index) => (
            <View key={item.id}>
              {index > 0 && <View style={{ height: spacing.sm }} />}
              <Link href={`/journal/${item.id}`} asChild>
                <Pressable style={styles.card}>
                  <Text style={styles.cardTitle}>{item.title || 'Untitled'}</Text>
                  <Text style={styles.cardContent} numberOfLines={3}>{item.content}</Text>
                </Pressable>
              </Link>
            </View>
          ))
        )}
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
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xl,
    textAlign: 'center',
    color: colors.text.primary,
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing['2xl'],
    overflow: 'hidden',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  formNote: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  input: {
    ...components.input,
  },
  textArea: {
    height: 100,
  },
  save: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    ...shadows.sm,
  },
  saveGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardTitle: {
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardContent: {
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  section: {
    fontWeight: typography.weights.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
  },
  promptCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  promptLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptText: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  promptButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  tile: {
    flex: 1,
    minHeight: 120,
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  tileTitle: {
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  tileExcerpt: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  calTitle: { fontWeight: typography.weights.bold, color: colors.text.primary },
  calNav: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)', borderRadius: borderRadius.md, backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  calNavText: { color: colors.text.primary },
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekCell: { flex: 1, textAlign: 'center', fontWeight: typography.weights.semibold, color: colors.text.secondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  dayCell: { width: '13.2%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', borderRadius: borderRadius.md, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  daySelected: { borderColor: colors.primary.main },
  dayCellFuture: { backgroundColor: colors.background.tertiary, opacity: 0.5 },
  dayText: { fontSize: typography.sizes.sm, color: colors.text.primary },
  dayTextFuture: { color: colors.text.tertiary },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary.main, marginTop: 2 },
  emptyText: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
