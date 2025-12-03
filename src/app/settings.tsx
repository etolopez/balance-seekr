import { StyleSheet, Text, View, Switch, Pressable, ScrollView, Alert, Linking, Clipboard } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../state/store';
import { colors, typography, spacing, borderRadius, shadows, getBackgroundGradient } from '../config/theme';
import { useState } from 'react';
import Slider from '@react-native-community/slider';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const lowMotion = useAppStore((s) => s.lowMotion);
  const setLowMotion = useAppStore((s) => s.setLowMotion);
  const resetAll = useAppStore((s) => s.resetAll);
  const cuesHaptics = useAppStore((s) => s.cuesHaptics);
  const setCuesHaptics = useAppStore((s) => s.setCuesHaptics);
  const dataRetentionDays = useAppStore((s) => s.dataRetentionDays);
  const setDataRetentionDays = useAppStore((s) => s.setDataRetentionDays);
  const performDataCleanup = useAppStore((s) => s.performDataCleanup);
  const backgroundHue = useAppStore((s) => s.backgroundHue);
  const setBackgroundHue = useAppStore((s) => s.setBackgroundHue);
  const [isCleaning, setIsCleaning] = useState(false);
  
  // Get adjusted gradient colors for preview
  const gradientColors = getBackgroundGradient(backgroundHue);
  
  const retentionOptions: { label: string; days: number }[] = [
    { label: 'Keep All Data', days: 0 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'Last 180 Days', days: 180 },
    { label: 'Last 365 Days', days: 365 },
  ];
  
  const handleCleanupNow = async () => {
    Alert.alert(
      'Clean Up Old Data',
      'This will permanently delete habit logs, completed tasks, and journal entries older than your retention period. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean Up Now',
          style: 'destructive',
          onPress: async () => {
            setIsCleaning(true);
            try {
              await performDataCleanup(false); // Don't clean journal by default
              Alert.alert('Success', 'Old data has been cleaned up successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clean up data. Please try again.');
            } finally {
              setIsCleaning(false);
            }
          },
        },
      ]
    );
  };
  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
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

        <Text style={styles.title}>Settings</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Haptic Feedback</Text>
              <Text style={styles.labelHint}>Vibration feedback for task completion and interactions</Text>
            </View>
            <Switch
              value={cuesHaptics}
              onValueChange={setCuesHaptics}
              trackColor={{ false: colors.border.medium, true: colors.primary.light }}
              thumbColor={cuesHaptics ? colors.primary.main : colors.background.secondary}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Low Motion</Text>
              <Text style={styles.labelHint}>Reduce animations for better accessibility</Text>
            </View>
            <Switch
              value={lowMotion}
              onValueChange={setLowMotion}
              trackColor={{ false: colors.border.medium, true: colors.primary.light }}
              thumbColor={lowMotion ? colors.primary.main : colors.background.secondary}
            />
          </View>
        </View>
        
        {/* Data Retention Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Retention</Text>
          <Text style={styles.sectionDescription}>
            Automatically clean up old habit logs and completed tasks to manage database size.
            Journal entries are preserved by default.
          </Text>
          
          {retentionOptions.map((option) => (
            <Pressable
              key={option.days}
              style={styles.retentionOption}
              onPress={() => setDataRetentionDays(option.days)}
            >
              <View style={styles.retentionOptionLeft}>
                <Text style={styles.retentionLabel}>{option.label}</Text>
                {option.days > 0 && (
                  <Text style={styles.retentionSubtext}>
                    Data older than {option.days} days will be removed
                  </Text>
                )}
              </View>
              <View style={[
                styles.radioButton,
                dataRetentionDays === option.days && styles.radioButtonSelected
              ]}>
                {dataRetentionDays === option.days && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </Pressable>
          ))}
          
          {dataRetentionDays > 0 && (
            <Pressable
              style={[styles.cleanupButton, isCleaning && styles.cleanupButtonDisabled]}
              onPress={handleCleanupNow}
              disabled={isCleaning}
            >
              <Ionicons 
                name="trash-outline" 
                size={16} 
                color={colors.text.inverse} 
                style={{ marginRight: spacing.xs }}
              />
              <Text style={styles.cleanupButtonText}>
                {isCleaning ? 'Cleaning...' : 'Clean Up Now'}
              </Text>
            </Pressable>
          )}
        </View>
        
        {/* Background Hue Customization Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background Color</Text>
          <Text style={styles.sectionDescription}>
            Adjust the hue of the background gradient to match your preference.
          </Text>
          
          <View style={styles.hueSliderContainer}>
            <View style={styles.huePreview}>
              <LinearGradient
                colors={gradientColors}
                style={styles.huePreviewGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </View>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Hue: {Math.round(backgroundHue)}°</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={360}
                value={backgroundHue}
                onValueChange={setBackgroundHue}
                minimumTrackTintColor={colors.primary.main}
                maximumTrackTintColor={colors.border.medium}
                thumbTintColor={colors.primary.main}
                step={1}
              />
            </View>
            <Pressable
              style={styles.resetHueButton}
              onPress={() => setBackgroundHue(0)}
            >
              <Text style={styles.resetHueButtonText}>Reset to Default</Text>
            </Pressable>
          </View>
        </View>
        
        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Balance Seekr</Text>
          
          <Text style={styles.aboutQuote}>
            "This is an app created to help you organize your life and goals so you're more in tune with what you want. I cannot promise a life change if you're not willing to take the steps necessary to get there, but I can give you the tools to walk along side you. I hope this brings you more clarity to your day-to-day and helps you elevate the details that makes life worth living. Live in balance, find rest when you can, and keep going. You are loved."
          </Text>
          
          <Text style={styles.aboutAuthor}>— Roberto</Text>
          
          <View style={styles.aboutCreator}>
            <Text style={styles.aboutCreatorText}>App created by Roberto Lopez J.</Text>
          </View>
          
          <View style={styles.socialLinks}>
            <Pressable
              style={styles.socialLink}
              onPress={() => Linking.openURL('https://x.com/simplyeto')}
            >
              <Ionicons name="logo-twitter" size={20} color={colors.text.inverse} />
              <Text style={styles.socialLinkText}>@simplyeto</Text>
            </Pressable>
            
            <Pressable
              style={styles.socialLink}
              onPress={() => Linking.openURL('https://www.instagram.com/simplyeto')}
            >
              <Ionicons name="logo-instagram" size={20} color={colors.text.inverse} />
              <Text style={styles.socialLinkText}>@simplyeto</Text>
            </Pressable>
            
            <Pressable
              style={styles.socialLink}
              onPress={() => Linking.openURL('https://www.youtube.com/@SimplyEto')}
            >
              <Ionicons name="logo-youtube" size={20} color={colors.text.inverse} />
              <Text style={styles.socialLinkText}>YouTube</Text>
            </Pressable>
          </View>
          
          {/* Donation Section */}
          <View style={styles.donationSection}>
            <Text style={styles.donationText}>
              This is a free app created by one person, so, if you'd like to donate, you can do it here:
            </Text>
            <Pressable
              style={styles.donateButton}
              onPress={() => {
                const solanaAddress = '66FTEkkqvKa4QMMRXaryf2oGmknTFbyLQrmKRK6qAJkC';
                Clipboard.setString(solanaAddress);
                Alert.alert(
                  'Address Copied!',
                  `Solana address copied to clipboard:\n${solanaAddress}\n\nYou can now paste it in your wallet to send SOL or USDC.`,
                  [{ text: 'OK' }]
                );
              }}
            >
              <Ionicons name="wallet-outline" size={18} color={colors.text.inverse} />
              <Text style={styles.donateButtonText}>Donate with Solana/USDC</Text>
            </Pressable>
          </View>
        </View>
        
        <Pressable style={styles.reset} onPress={resetAll}>
          <LinearGradient
            colors={[colors.error.main, colors.error.dark]}
            style={styles.resetGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.resetText}>Reset Local Data</Text>
          </LinearGradient>
        </Pressable>
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
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xl,
    textAlign: 'center',
    color: colors.text.primary,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  labelHint: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    lineHeight: 16,
  },
  reset: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    ...shadows.sm,
  },
  resetGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
  note: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
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
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  retentionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  retentionOptionLeft: {
    flex: 1,
  },
  retentionLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  retentionSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary.main,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.main,
  },
  cleanupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning.main,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  cleanupButtonDisabled: {
    opacity: 0.5,
  },
  cleanupButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
  // Hue Slider Styles
  hueSliderContainer: {
    gap: spacing.md,
  },
  huePreview: {
    height: 60,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...shadows.sm,
  },
  huePreviewGradient: {
    flex: 1,
    width: '100%',
  },
  sliderRow: {
    gap: spacing.sm,
  },
  sliderLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  resetHueButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resetHueButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  // About Section Styles
  aboutQuote: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  aboutAuthor: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.lg,
    textAlign: 'right',
  },
  aboutCreator: {
    marginBottom: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  aboutCreatorText: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  socialLinks: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  socialLinkText: {
    fontSize: typography.sizes.base,
    color: colors.text.inverse,
    fontWeight: typography.weights.medium,
  },
  donationSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: spacing.md,
  },
  donationText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  donateButtonText: {
    fontSize: typography.sizes.base,
    color: colors.text.inverse,
    fontWeight: typography.weights.semibold,
  },
});
