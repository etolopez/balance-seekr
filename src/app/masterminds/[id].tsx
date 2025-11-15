import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/store';
import { ApiService } from '../../services/api.service';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../config/theme';

export default function GroupChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const groups = useAppStore((s) => s.groups);
  const messages = useAppStore((s) => s.messages);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const verifiedAddress = useAppStore((s) => s.verifiedAddress);
  const username = useAppStore((s) => s.username);
  const publicGroups = useAppStore((s) => s.publicGroups);
  const group = useMemo(() => groups.find(g => g.id === id), [groups, id]);
  const publicGroup = useMemo(() => publicGroups.find(g => g.id === id || (g as any).apiGroupId === id), [publicGroups, id]);
  const groupData = publicGroup || group;
  
  // Resolve backend group ID: if it's a public group, use its id; if it's a local group, use apiGroupId or id
  const backendGroupId = useMemo(() => {
    if (publicGroup) {
      return publicGroup.id; // Public groups have backend IDs
    }
    if (group?.apiGroupId) {
      return group.apiGroupId; // Local group with backend ID
    }
    return id; // Fallback to the route ID
  }, [publicGroup, group, id]);
  
  const groupMsgs = useMemo(() => messages.filter(m => m.groupId === id || m.groupId === backendGroupId), [messages, id, backendGroupId]);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);
  const apiService = new ApiService();

  // Fetch messages from backend on mount and periodically
  useEffect(() => {
    if (!backendGroupId || !verifiedAddress) return;
    
    const fetchMessages = async () => {
      try {
        const backendMessages = await apiService.getGroupMessages(backendGroupId);
        // Update local messages with backend data (includes senderUsername)
        if (backendMessages.length > 0) {
          // Merge backend messages with local ones
          const existingIds = new Set(messages.map(m => m.id));
          const newMessages = backendMessages.filter(m => !existingIds.has(m.id));
          
          if (newMessages.length > 0) {
            useAppStore.setState((s) => ({
              messages: [...s.messages, ...newMessages.map(m => ({
                id: m.id,
                groupId: m.groupId,
                senderAddress: m.senderAddress,
                senderUsername: m.senderUsername,
                content: m.content,
                createdAt: m.createdAt,
              }))]
            }));
          }
        }
      } catch (error) {
        // Silently fail - backend might not be available
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [backendGroupId, verifiedAddress]);

  const onSend = async () => {
    if (!text.trim() || !backendGroupId || !verifiedAddress) return;
    
    try {
      // Send to backend first using backend group ID
      await apiService.sendMessage(backendGroupId, verifiedAddress, text.trim(), username || undefined);
      
      // Then add to local state using local group ID
      sendMessage(id, text.trim());
      setText('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (error) {
      // If backend fails, still send locally
      sendMessage(id, text.trim());
      setText('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <LinearGradient colors={[colors.background.gradient.start, colors.background.gradient.end]} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.content, { paddingTop: Math.max(insets.top, spacing.xl) + spacing.lg }]}>
          {/* Back Button */}
          <Pressable style={styles.topBackBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text.secondary} />
            <Text style={styles.topBackBtnText}>Back</Text>
          </Pressable>

          <Text style={styles.title}>{groupData?.name || group?.name || 'Masterminds'}</Text>
          <FlatList
            ref={listRef}
            data={groupMsgs}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => {
              const isMine = item.senderAddress === verifiedAddress;
              const isCreator = item.senderAddress === groupData?.ownerAddress || item.senderAddress === group?.ownerAddress;
              
              // Show username if available, otherwise show wallet address
              const displayName = (item as any).senderUsername 
                ? (item as any).senderUsername
                : isMine && username 
                  ? username 
                  : item.senderAddress 
                    ? `${item.senderAddress.slice(0,4)}…${item.senderAddress.slice(-4)}`
                    : 'Unknown';
              
              return (
                <View style={[
                  styles.msg, 
                  isMine ? styles.msgMine : styles.msgTheirs,
                  isCreator && styles.msgCreator
                ]}>
                  <Text style={styles.msgText}>{item.content}</Text>
                  <Text style={styles.msgMeta}>{displayName}</Text>
                </View>
              );
            }}
            contentContainerStyle={{ gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xl }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />
          <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message"
              placeholderTextColor={colors.text.tertiary}
              style={styles.input}
              onSubmitEditing={onSend}
              multiline
              textAlignVertical="top"
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
  msgCreator: {
    backgroundColor: 'rgba(255, 165, 0, 0.25)', // Orange tint for creator messages
    borderColor: 'rgba(255, 140, 0, 0.5)', // Orange border for creator
    borderWidth: 2,
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
    minHeight: 44,
    maxHeight: 100,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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

