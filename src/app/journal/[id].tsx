import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/store';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../config/theme';
import * as Haptics from 'expo-haptics';
import { playBeep2 } from '../../audio/sounds';

/**
 * Calculate word count for a text string
 */
function getWordCount(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate character count for a text string
 */
function getCharacterCount(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().length;
}

/**
 * Journal Detail Screen - Edit and delete journal entries
 * Allows users to edit title and content, and delete entries with confirmation
 */
export default function JournalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const journal = useAppStore((s) => s.journal);
  const updateJournal = useAppStore((s) => s.updateJournal);
  const deleteJournal = useAppStore((s) => s.deleteJournal);
  const entry = useMemo(() => journal.find(j => j.id === id), [journal, id]);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(entry?.title ?? '');
  const [content, setContent] = useState(entry?.content ?? '');

  // Update state when entry changes
  useEffect(() => {
    if (entry) {
      setTitle(entry.title ?? '');
      setContent(entry.content ?? '');
      setIsEditing(false);
    }
  }, [entry?.id]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (id) {
              deleteJournal(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (!entry) {
    return (
      <LinearGradient colors={[colors.background.gradient.start, colors.background.gradient.end]} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={[styles.content, { alignItems: 'center', justifyContent: 'center', paddingTop: Math.max(insets.top, spacing.xl) + spacing.lg }]}>
          <Text style={[styles.titleInput, { textAlign: 'center' }]}>Entry not found</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.background.gradient.start, colors.background.gradient.end]} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, spacing.xl) + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <Pressable style={styles.topBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text.secondary} />
          <Text style={styles.topBackBtnText}>Back</Text>
        </Pressable>

        {/* Entry Title as Page Title */}
        {isEditing ? (
          <TextInput 
            value={title} 
            onChangeText={setTitle} 
            placeholder="Untitled Entry" 
            placeholderTextColor={colors.text.tertiary} 
            style={styles.titleInput}
          />
        ) : (
          <Text style={styles.titleDisplay}>{title || 'Untitled Entry'}</Text>
        )}
        
        {/* Meta Information */}
        <View style={styles.metaContainer}>
          <Text style={styles.meta}>{new Date(entry.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          {!isEditing && (
            <Text style={styles.wordCountText}>
              {getWordCount(content)} {getWordCount(content) === 1 ? 'word' : 'words'} • {getCharacterCount(content)} characters
            </Text>
          )}
        </View>
        
        {/* Content */}
        {isEditing ? (
          <>
            <TextInput 
              value={content} 
              onChangeText={setContent} 
              placeholder="Write something..." 
              placeholderTextColor={colors.text.tertiary} 
              style={styles.contentInput} 
              multiline 
              textAlignVertical="top"
            />
            <View style={styles.wordCountContainer}>
              <Text style={styles.wordCountText}>
                {getWordCount(content)} {getWordCount(content) === 1 ? 'word' : 'words'} • {getCharacterCount(content)} characters
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.contentDisplay}>{content || 'No content'}</Text>
        )}
        
        {/* Action Buttons - Secondary */}
        <View style={styles.actionsContainer}>
          {isEditing ? (
            <>
              <View style={styles.actionsRow}>
                <Pressable style={styles.secondaryBtn} onPress={() => { 
                  updateJournal(entry.id, { title: title.trim(), content: content.trim() }); 
                  playBeep2().catch(()=>{});
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
                  setIsEditing(false);
                }}>
                  <Text style={styles.secondaryBtnText}>Save</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={() => {
                  setTitle(entry?.title ?? '');
                  setContent(entry?.content ?? '');
                  setIsEditing(false);
                }}>
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </Pressable>
              </View>
              
              {/* Delete Button */}
              <Pressable style={styles.deleteBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.secondaryBtn} onPress={() => setIsEditing(true)}>
                <Ionicons name="create-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.secondaryBtnText}>Edit</Text>
              </Pressable>
              
              {/* Delete Button */}
              <Pressable style={styles.deleteBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={16} color={colors.text.secondary} />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  titleInput: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    padding: 0,
    textAlign: 'left',
  },
  titleDisplay: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  metaContainer: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  meta: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  wordCountContainer: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  wordCountText: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  contentInput: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 24,
    minHeight: 200,
    padding: 0,
    marginBottom: spacing.xl,
  },
  contentDisplay: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  actionsContainer: {
    marginTop: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryBtnText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  deleteBtnText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  topBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  topBackBtnText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  backBtn: { marginTop: spacing.md, borderWidth: 2, borderColor: colors.primary.main, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtnText: { color: colors.primary.main, fontWeight: typography.weights.semibold },
});
