import { StyleSheet, Text, View, Pressable, FlatList, ScrollView, Modal, TextInput, Alert } from "react-native";
import { useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { playChange } from '../../audio/sounds';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/store';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows, components } from '../../config/theme';

// Breath screen uses playBeep() for phase audio cues

type Phase = 'inhale' | 'hold' | 'exhale' | 'hold2' | 'done';

export default function BreathScreen() {
  const insets = useSafeAreaInsets();
  const protocols = useAppStore((s) => s.protocols);
  const selectedId = useAppStore((s) => s.selectedBreathPresetId);
  const setSelectedId = useAppStore((s) => s.setSelectedBreathPreset);
  const storedCycles = useAppStore((s) => s.breathCycles);
  const setStoredCycles = useAppStore((s) => s.setBreathCycles);
  const customBreath = useAppStore((s) => s.customBreath);
  const setCustomBreath = useAppStore((s) => s.setCustomBreath);
  const cuesHaptics = useAppStore((s) => s.cuesHaptics);
  const cuesAudio = useAppStore((s) => s.cuesAudio);
  const breathPresets = useAppStore((s) => s.breathPresets);
  const savePreset = useAppStore((s) => s.saveCurrentCustomAsPreset);
  const removePreset = useAppStore((s) => s.deleteBreathPreset);
  const [saveVisible, setSaveVisible] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetGoal, setPresetGoal] = useState('Your rhythm');

  const listWithCustom = useMemo(() => {
    const custom = customBreath ? [{ id: 'custom', name: 'Custom', goal: customBreath.goal || 'Your rhythm', inhale: customBreath.inhale, hold: customBreath.hold, exhale: customBreath.exhale, hold2: customBreath.hold2, cycles: storedCycles, gradient: customBreath.gradient, shape: customBreath.shape }] : [{ id: 'custom', name: 'Custom', goal: 'Your rhythm', inhale: 4, hold: 4, exhale: 4, hold2: 0, cycles: storedCycles, gradient: ['#7BA3D4','#9BB8D9'], shape: 'circle' as const }];
    return [...protocols, ...breathPresets, ...custom];
  }, [protocols, breathPresets, customBreath, storedCycles]);
  const selectedIndex = Math.max(0, listWithCustom.findIndex(p => p.id === selectedId));
  const proto = useMemo(() => ({ ...listWithCustom[selectedIndex]!, cycles: storedCycles }), [listWithCustom, selectedIndex, storedCycles]);
  const [phase, setPhase] = useState<Phase>('done');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [cycle, setCycle] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lowMotion = useAppStore((s) => s.lowMotion);

  // Visual: animated pulse circle integrated here
  // The circle will pulse with breathing phases using soft, calming colors
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.6);
  const circleStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: proto.shape === 'diamond' ? '45deg' : '0deg' },
      { scale: scale.value },
    ],
    opacity: 0.3 + opacity.value * 0.5,
  }));
  const shapeStyle = useMemo(() => {
    switch (proto.shape) {
      case 'rounded':
        return { borderRadius: 24 };
      case 'diamond':
        return { borderRadius: 12 };
      default:
        return { borderRadius: 100 };
    }
  }, [proto.shape]);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setPhase('done');
    setSecondsLeft(0);
    setCycle(0);
    // settle visuals
    scale.value = withTiming(0.9, { duration: 500 });
    opacity.value = withTiming(0.6, { duration: 500 });
  };

  const start = () => {
    stop();
    let remainingCycles = proto.cycles;
    let schedule: { p: Phase; s: number }[] = [
      { p: 'inhale', s: proto.inhale },
      { p: 'hold', s: proto.hold },
      { p: 'exhale', s: proto.exhale },
    ];
    if (proto.hold2 && proto.hold2 > 0) schedule.push({ p: 'hold2', s: proto.hold2 });

    let idx = 0;
    let current = schedule[idx];
    setCycle(1);
    setPhase(current.p);
    setSecondsLeft(current.s);
    // kick off first phase animation
    animatePhase(current.p, current.s);

    timer.current = setInterval(() => {
      setSecondsLeft((n) => {
        if (n > 1) return n - 1;
        // advance phase
        idx++;
        if (idx >= schedule.length) {
          remainingCycles--;
          if (remainingCycles <= 0) {
            stop();
            return 0;
          }
          idx = 0;
          setCycle((c) => c + 1);
        }
        const next = schedule[idx];
        setPhase(next.p);
        // Use same haptic as task completion when inhale -> exhale
        const prevPhase = schedule[(idx - 1 + schedule.length) % schedule.length]?.p;
        if (cuesHaptics && prevPhase === 'inhale' && next.p === 'exhale') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
        }
        // animate visual for next phase
        animatePhase(next.p, next.s);
        return next.s;
      });
    }, 1000);
  };

  useEffect(() => () => stop(), []);

  /**
   * Animate the breathing circle based on the current phase
   * Uses gentle easing for a calming, natural breathing rhythm
   */
  const animatePhase = (p: Phase, secs: number) => {
    const dur = Math.max(800, (lowMotion ? 1.2 : 1.0) * secs * 1000);
    // No generic haptic here; targeted haptic is triggered only on inhale -> exhale
      if (cuesAudio) {
      // Use change sound for all phases (inhale, exhale, and holds)
      if (p === 'inhale' || p === 'exhale' || p === 'hold' || p === 'hold2') {
        playChange().catch(() => {});
      }
    }
    if (p === 'inhale') {
      // Expand gently on inhale - like taking a deep, calming breath
      scale.value = withTiming(1.2, { duration: dur, easing: Easing.inOut(Easing.quad) });
      opacity.value = withTiming(0.8, { duration: dur, easing: Easing.inOut(Easing.quad) });
    } else if (p === 'exhale') {
      // Contract gently on exhale - releasing tension
      scale.value = withTiming(0.8, { duration: dur, easing: Easing.inOut(Easing.quad) });
      opacity.value = withTiming(0.5, { duration: dur, easing: Easing.inOut(Easing.quad) });
    } else if (p === 'hold' || p === 'hold2') {
      // Hold current values gently - maintaining the moment
      scale.value = withTiming(scale.value, { duration: dur });
      opacity.value = withTiming(opacity.value, { duration: dur });
    } else {
      // Return to rest state
      scale.value = withTiming(0.9, { duration: 500 });
      opacity.value = withTiming(0.6, { duration: 500 });
    }
  };

  /**
   * Get the appropriate gradient colors based on the current breathing phase
   * Each phase has its own calming color to guide the user
   */
  const getProtoGradient = (): string[] => proto.gradient;

  // Update custom config helper
  function updateCustom<K extends 'inhale'|'hold'|'exhale'|'hold2'|'shape'|'gradient'>(key: K, value: any) {
    if (proto.id !== 'custom') return;
    const base = customBreath || { name: 'Custom', goal: 'Your rhythm', inhale: 4, hold: 4, exhale: 4, hold2: 0, shape: 'circle' as const, gradient: ['#7BA3D4','#9BB8D9'] as [string,string] };
    const next = { ...base, [key]: value } as any;
    setCustomBreath(next);
  }

  // Handle save preset
  const handleSavePreset = () => {
    if (!presetName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your preset.');
      return;
    }
    savePreset(presetName.trim(), presetGoal.trim() || 'Your rhythm');
    setSaveVisible(false);
    setPresetName('');
    setPresetGoal('Your rhythm');
  };

  // Handle delete preset with confirmation
  const handleDeletePreset = (id: string, name: string) => {
    Alert.alert(
      'Delete Preset',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removePreset(id),
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={[colors.breath.background, colors.background.gradient.end]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, spacing.xl) + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Breathwork</Text>
          <Text style={styles.subtitle}>{proto.name} • {proto.goal}</Text>
        </View>

        {/* Protocol Picker */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="leaf-outline" size={18} color={colors.text.primary} />
            <Text style={styles.sectionTitle}>Protocols</Text>
          </View>
          <FlatList
            data={[...protocols, { id: 'custom', name: 'Custom', gradient: customBreath?.gradient || ['#7BA3D4','#9BB8D9'], shape: customBreath?.shape || 'circle' }]}
            keyExtractor={(p) => p.id}
            horizontal
            contentContainerStyle={styles.protoList}
            renderItem={({ item }) => {
              const isSelected = selectedId === item.id;
              const gradientColor = item.gradient?.[0] || colors.primary.main;
              const shape = item.shape || 'circle';
              return (
                <Pressable
                  onPress={() => {
                    setSelectedId(item.id);
                    if (item.id !== 'custom') {
                      setStoredCycles(item.cycles);
                    }
                    stop();
                  }}
                  style={[
                    styles.protoChip,
                    isSelected && styles.protoChipActive,
                    { borderColor: isSelected ? gradientColor : colors.border.medium }
                  ]}
                >
                  <View style={styles.chipRow}>
                    <View style={[
                      styles.shapePreview,
                      { backgroundColor: gradientColor },
                      shape === 'circle' ? { borderRadius: 7 } :
                      shape === 'rounded' ? { borderRadius: 4 } :
                      { transform: [{ rotate: '45deg' }], borderRadius: 2 }
                    ]} />
                    <Text style={[styles.protoText, isSelected && styles.protoTextActive]}>
                      {item.name}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* My Presets */}
        {breathPresets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bookmark" size={18} color={colors.text.primary} />
              <Text style={styles.sectionTitle}>My Presets</Text>
            </View>
            <FlatList
              data={breathPresets}
              keyExtractor={(p) => p.id}
              horizontal
              contentContainerStyle={styles.protoList}
              renderItem={({ item }) => {
                const isSelected = selectedId === item.id;
                return (
                  <Pressable
                    onPress={() => { setSelectedId(item.id); setStoredCycles(item.cycles); stop(); }}
                    onLongPress={() => handleDeletePreset(item.id, item.name)}
                    style={[
                      styles.protoChip,
                      isSelected && styles.protoChipActive,
                      { borderColor: isSelected ? item.gradient[0] : colors.border.medium }
                    ]}
                  >
                    <View style={styles.chipRow}>
                      <View style={[
                        styles.shapePreview,
                        { backgroundColor: item.gradient[0] },
                        item.shape === 'circle' ? { borderRadius: 7 } :
                        item.shape === 'rounded' ? { borderRadius: 4 } :
                        { transform: [{ rotate: '45deg' }], borderRadius: 2 }
                      ]} />
                      <Text style={[styles.protoText, isSelected && styles.protoTextActive]}>
                        {item.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
              showsHorizontalScrollIndicator={false}
            />
            <Text style={styles.hintText}>Long press to delete</Text>
          </View>
        )}

        {/* Custom Controls */}
        {proto.id === 'custom' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="create-outline" size={18} color={colors.text.primary} />
              <Text style={styles.sectionTitle}>Customize Your Rhythm</Text>
            </View>
            
            {/* Breathing Timing */}
            <View style={styles.customCard}>
              <View style={styles.customSectionHeader}>
                <Ionicons name="time" size={18} color={colors.primary.main} />
                <Text style={styles.customSectionTitle}>Breathing Timing</Text>
              </View>
              <View style={styles.steppersList}>
                <View style={styles.stepperRow}>
                  <View style={styles.stepperLabelRow}>
                    <Ionicons name="arrow-down-circle" size={18} color={colors.primary.main} />
                    <Text style={styles.stepperLabel}>Inhale</Text>
                  </View>
                  <Stepper value={proto.inhale} onChange={(v)=>updateCustom('inhale', v)} />
                </View>
                <View style={styles.stepperRow}>
                  <View style={styles.stepperLabelRow}>
                    <Ionicons name="pause-circle" size={18} color={colors.secondary.main} />
                    <Text style={styles.stepperLabel}>Hold</Text>
                  </View>
                  <Stepper value={proto.hold} onChange={(v)=>updateCustom('hold', v)} />
                </View>
                <View style={styles.stepperRow}>
                  <View style={styles.stepperLabelRow}>
                    <Ionicons name="arrow-up-circle" size={18} color={colors.success.main} />
                    <Text style={styles.stepperLabel}>Exhale</Text>
                  </View>
                  <Stepper value={proto.exhale} onChange={(v)=>updateCustom('exhale', v)} />
                </View>
                {proto.hold2 > 0 && (
                  <View style={styles.stepperRow}>
                    <View style={styles.stepperLabelRow}>
                      <Ionicons name="pause-circle-outline" size={18} color={colors.warning.main} />
                      <Text style={styles.stepperLabel}>Hold 2</Text>
                    </View>
                    <Stepper value={proto.hold2 || 0} onChange={(v)=>updateCustom('hold2', v)} />
                  </View>
                )}
              </View>
              {proto.hold2 === 0 && (
                <Pressable
                  style={styles.addHold2Btn}
                  onPress={() => updateCustom('hold2', 1)}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.text.primary} />
                  <Text style={styles.addHold2Text}>Add Second Hold</Text>
                </Pressable>
              )}
            </View>

            {/* Shape Selection */}
            <View style={styles.customCard}>
              <View style={styles.customSectionHeader}>
                <Ionicons name="shapes" size={18} color={colors.secondary.main} />
                <Text style={styles.customSectionTitle}>Shape</Text>
              </View>
              <ShapePicker value={proto.shape} onChange={(s)=>updateCustom('shape', s)} />
            </View>

            {/* Color Selection */}
            <View style={styles.customCard}>
              <View style={styles.customSectionHeader}>
                <Ionicons name="color-palette" size={18} color={colors.secondary.main} />
                <Text style={styles.customSectionTitle}>Color</Text>
              </View>
              <PalettePicker value={proto.gradient} onChange={(g)=>updateCustom('gradient', g)} />
            </View>

            {/* Save Button */}
            <Pressable style={styles.saveBtn} onPress={() => setSaveVisible(true)}>
              <LinearGradient
                colors={[colors.secondary.gradient.start, colors.secondary.gradient.end]}
                style={styles.saveBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="bookmark" size={20} color={colors.text.inverse} />
                <Text style={styles.saveBtnText}>Save as Preset</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Protocol Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsRow}>
            <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailsText}>
              Inhale {proto.inhale}s
              {proto.hold ? ` • Hold ${proto.hold}s` : ''}
              • Exhale {proto.exhale}s
              {proto.hold2 ? ` • Hold ${proto.hold2}s` : ''}
            </Text>
          </View>
        </View>

        {/* Breathing Circle */}
        <View style={styles.circleSection}>
          <View style={styles.circleContainer}>
            <Animated.View style={[styles.circle, shapeStyle, circleStyle]}>
              <LinearGradient
                colors={getProtoGradient()}
                style={styles.circleGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
          </View>
          
          <View style={styles.statusSection}>
            <Text style={styles.phase}>{phase === 'done' ? 'Ready' : phase.toUpperCase()}</Text>
            <Text style={styles.time}>{phase === 'done' ? '--' : `${secondsLeft}s`}</Text>
            <Text style={styles.cycleText}>Cycle {Math.max(1, cycle)} / {proto.cycles}</Text>
          </View>
        </View>

        {/* Cycles Control */}
        <View style={styles.cyclesCard}>
          <Text style={styles.cyclesLabel}>Number of Cycles</Text>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => setStoredCycles(Math.max(1, storedCycles - 1))}
            >
              <Ionicons name="remove" size={20} color={colors.text.primary} />
            </Pressable>
            <Text style={styles.stepperValue}>{storedCycles}</Text>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => setStoredCycles(Math.min(20, storedCycles + 1))}
            >
              <Ionicons name="add" size={20} color={colors.text.primary} />
            </Pressable>
          </View>
        </View>

        {/* Control Button */}
        <View style={styles.buttonSection}>
          {phase === 'done' ? (
            <Pressable style={styles.btn} onPress={start}>
              <LinearGradient
                colors={[colors.primary.gradient.start, colors.primary.gradient.end]}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="play" size={20} color={colors.text.inverse} />
                <Text style={styles.btnText}>Start</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable style={styles.stopBtn} onPress={stop}>
              <LinearGradient
                colors={[colors.error.main, colors.error.light]}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="stop" size={20} color={colors.text.inverse} />
                <Text style={styles.btnText}>Stop</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>

        {/* Safety Note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.note}>
            Gentle practice. Stop if lightheaded. Breathe through the nose when comfortable.
          </Text>
        </View>

        {/* Protocol Description */}
        {proto.description && (
          <View style={styles.descriptionCard}>
            <View style={styles.descriptionRow}>
              <Ionicons name="information-circle-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.descriptionText}>{proto.description}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Save Preset Modal */}
      <Modal
        visible={saveVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSaveVisible(false)}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="bookmark" size={24} color={colors.primary.main} />
              <Text style={styles.modalTitle}>Save as Preset</Text>
            </View>
            <Text style={styles.modalLabel}>Preset Name</Text>
            <TextInput
              value={presetName}
              onChangeText={setPresetName}
              placeholder="e.g., Morning Calm"
              placeholderTextColor={colors.text.tertiary}
              style={styles.modalInput}
              autoFocus
            />
            <Text style={styles.modalLabel}>Goal / Description</Text>
            <TextInput
              value={presetGoal}
              onChangeText={setPresetGoal}
              placeholder="e.g., Start the day with clarity"
              placeholderTextColor={colors.text.tertiary}
              style={[styles.modalInput, styles.modalInputMultiline]}
              multiline
              numberOfLines={2}
            />
            <View style={styles.modalButtonRow}>
              <Pressable
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setSaveVisible(false);
                  setPresetName('');
                  setPresetGoal('Your rhythm');
                }}
              >
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalPrimaryBtn}
                onPress={handleSavePreset}
              >
                <LinearGradient
                  colors={[colors.primary.gradient.start, colors.primary.gradient.end]}
                  style={styles.modalPrimaryBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark" size={18} color={colors.text.inverse} />
                  <Text style={styles.modalPrimaryBtnText}>Save</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%',
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  // Sections
  section: {
    width: '100%',
    marginBottom: spacing.lg,
    maxWidth: 500,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  hintText: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  // Protocol Picker
  protoList: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  protoChip: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  protoChipActive: {
    ...shadows.md,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  protoText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  protoTextActive: {
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  shapePreview: {
    width: 14,
    height: 14,
  },
  // Details Card
  detailsCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailsText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  // Description Card
  descriptionCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  descriptionText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  // Circle Section
  circleSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%',
  },
  circleContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 100,
    overflow: 'hidden',
    ...shadows.lg,
  },
  circleGradient: {
    width: '100%',
    height: '100%',
  },
  statusSection: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  phase: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  time: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.extrabold,
    color: colors.text.primary,
  },
  cycleText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  // Cycles Card
  cyclesCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  cyclesLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadows.sm,
  },
  stepperValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    minWidth: 40,
    textAlign: 'center',
  },
  // Buttons
  buttonSection: {
    width: '100%',
    maxWidth: 500,
    marginBottom: spacing.lg,
  },
  btn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
    width: '100%',
  },
  stopBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
    width: '100%',
  },
  btnGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  btnText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
  // Custom Controls
  customCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  customSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  customSectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  steppersList: {
    gap: spacing.md,
    alignItems: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    width: '100%',
  },
  stepperLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 90,
    justifyContent: 'flex-start',
  },
  stepperLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  addHold2Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  addHold2Text: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  // Save Button
  saveBtn: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
    width: '100%',
    marginTop: spacing.sm,
  },
  saveBtnGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  saveBtnText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  // Modal
  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
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
  modalLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  modalInput: {
    ...components.input,
    marginBottom: spacing.sm,
  },
  modalInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalPrimaryBtn: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  modalPrimaryBtnGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  modalPrimaryBtnText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  modalSecondaryBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  modalSecondaryBtnText: {
    color: colors.primary.main,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.base,
  },
  // Note
  noteCard: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  note: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});

// Small UI helpers
function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={stepperStyles.container}>
      <View style={stepperStyles.controls}>
        <Pressable
          style={stepperStyles.controlBtn}
          onPress={() => onChange(Math.max(0, value - 1))}
        >
          <Ionicons name="remove" size={20} color={colors.text.primary} />
        </Pressable>
        <View style={stepperStyles.valueContainer}>
          <Text style={stepperStyles.value}>{value}</Text>
          <Text style={stepperStyles.unit}>sec</Text>
        </View>
        <Pressable
          style={stepperStyles.controlBtn}
          onPress={() => onChange(value + 1)}
        >
          <Ionicons name="add" size={20} color={colors.text.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 200,
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    width: '100%',
  },
  controlBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  value: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: 32,
  },
  unit: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: -4,
  },
});

function ShapePicker({ value, onChange }: { value: 'circle'|'rounded'|'diamond'; onChange: (s: 'circle'|'rounded'|'diamond') => void }) {
  const options: ('circle'|'rounded'|'diamond')[] = ['circle','rounded','diamond'];
  
  /**
   * Get shape icon and preview style
   */
  const getShapePreview = (shape: 'circle'|'rounded'|'diamond') => {
    const baseStyle = {
      width: 24,
      height: 24,
      backgroundColor: colors.primary.main,
    };
    
    switch (shape) {
      case 'circle':
        return { ...baseStyle, borderRadius: 12 };
      case 'rounded':
        return { ...baseStyle, borderRadius: 6 };
      case 'diamond':
        return { ...baseStyle, borderRadius: 4, transform: [{ rotate: '45deg' }] };
    }
  };
  
  return (
    <View style={pickerStyles.container}>
      {options.map(opt => {
        const isSelected = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              pickerStyles.option,
              isSelected && pickerStyles.optionActive
            ]}
          >
            <View style={getShapePreview(opt)} />
            <Text style={[
              pickerStyles.optionText,
              isSelected && pickerStyles.optionTextActive
            ]}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  option: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  optionActive: {
    borderColor: colors.primary.main,
    backgroundColor: 'rgba(123, 163, 212, 0.3)',
    borderWidth: 3,
    ...shadows.md,
  },
  optionText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  optionTextActive: {
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
});

function PalettePicker({ value, onChange }: { value: [string,string]; onChange: (g: [string,string]) => void }) {
  /**
   * Expanded mindfulness-themed color palette
   * Soft, calming colors inspired by nature and tranquility
   */
  const palettes: [string,string][] = [
    // Blues - Sky and water
    ['#7BA3D4','#9BB8D9'], // Soft periwinkle
    ['#6B9BD1','#8BB5E0'], // Calming blue
    ['#8FA8C8','#B0C4DE'], // Light steel blue
    ['#A8C8E8','#C8D8F0'], // Powder blue
    
    // Lavenders - Peace and serenity
    ['#B8A9D4','#D8CCE8'], // Soft lavender
    ['#C4B5DD','#E0D4F0'], // Light lavender
    ['#D0C0E8','#E8DCF5'], // Pale lavender
    ['#9B8AB8','#B8A9D4'], // Deep lavender
    
    // Greens - Nature and growth
    ['#7FB3A8','#A8D4C8'], // Sage green
    ['#8FC4B0','#B0DCC8'], // Mint green
    ['#9BC4A8','#B8D8C4'], // Soft green
    ['#A8C4B0','#C4D8C8'], // Pale green
    
    // Peaches - Warmth and comfort
    ['#E8B89A','#F5D4C4'], // Soft peach
    ['#F0C4A8','#F8DCC8'], // Light peach
    ['#D4A890','#E8C4B0'], // Warm peach
    
    // Purples - Meditation and depth
    ['#B8A0C8','#D0C0E0'], // Soft purple
    ['#C8B0D8','#E0D0F0'], // Light purple
    
    // Teals - Balance and calm
    ['#7FB8A8','#A8D4C4'], // Soft teal
    ['#8FC4B8','#B0DCC8'], // Light teal
    
    // Roses - Gentle and soothing
    ['#D4A8B8','#E8C4D0'], // Soft rose
    ['#E0B0C0','#F0D0D8'], // Light rose
  ];
  return (
    <View style={paletteStyles.container}>
      {palettes.map((p,i)=> {
        const isSelected = value[0] === p[0] && value[1] === p[1];
        return (
          <Pressable
            key={i}
            onPress={() => onChange(p)}
            style={[
              paletteStyles.swatch,
              isSelected && paletteStyles.swatchActive
            ]}
          >
            <LinearGradient
              colors={p}
              style={paletteStyles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {isSelected && (
              <View style={paletteStyles.checkmark}>
                <Ionicons name="checkmark" size={14} color={colors.text.inverse} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const paletteStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-start',
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.medium,
    overflow: 'hidden',
    ...shadows.sm,
  },
  swatchActive: {
    borderColor: colors.primary.main,
    borderWidth: 3,
    ...shadows.md,
    transform: [{ scale: 1.05 }],
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
});
