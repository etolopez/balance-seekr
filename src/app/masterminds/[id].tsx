import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useState, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/store';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../config/theme';

export default function GroupChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const groups = useAppStore((s) => s.groups);
  const messages = useAppStore((s) => s.messages);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const verifiedAddress = useAppStore((s) => s.verifiedAddress);
  const username = useAppStore((s) => s.username);
  const group = useMemo(() => groups.find(g => g.id === id), [groups, id]);
  const groupMsgs = useMemo(() => messages.filter(m => m.groupId === id), [messages, id]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const onSend = () => {
    if (!text.trim()) return;
    sendMessage(id!, text.trim());
    setText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <LinearGradient colors={[colors.background.gradient.start, colors.background.gradient.end]} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.content, { paddingTop: Math.max(insets.top, spacing.xl) + spacing.lg }]}>
          {/* Back Button */}
          <Pressable style={styles.topBackBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text.secondary} />
            <Text style={styles.topBackBtnText}>Back</Text>
          </Pressable>

          <Text style={styles.title}>{group?.name || 'Masterminds'}</Text>
          <FlatList
            ref={listRef}
            data={groupMsgs}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => {
              // Show username if it's the current user, otherwise show wallet address
              const isMine = item.senderAddress === verifiedAddress;
              const displayName = isMine && username 
                ? username 
                : item.senderAddress 
                  ? `${item.senderAddress.slice(0,4)}…${item.senderAddress.slice(-4)}`
                  : 'Unknown';
              return (
                <View style={[styles.msg, isMine ? styles.msgMine : styles.msgTheirs]}>
                  <Text style={styles.msgText}>{item.content}</Text>
                  <Text style={styles.msgMeta}>{displayName}</Text>
                </View>
              );
            }}
            contentContainerStyle={{ gap: spacing.sm, padding: spacing.lg }}
          />
          <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message"
              placeholderTextColor={colors.text.tertiary}
              style={styles.input}
              onSubmitEditing={onSend}
            />
            <Pressable style={styles.sendBtn} onPress={onSend}>
              <Text style={styles.sendBtnText}>Send</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  title: {
    textAlign: 'center',
    padding: spacing.md,
    paddingTop: spacing.lg,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  msg: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  msgMine: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(123, 163, 212, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(123, 163, 212, 0.5)',
  },
  msgTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  msgText: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
  },
  msgMeta: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    ...components.input,
    flex: 1,
  },
  sendBtn: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  sendBtnText: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
  topBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  topBackBtnText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
});

