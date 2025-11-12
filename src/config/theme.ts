/**
 * Mindfulness-themed Design System
 * 
 * This theme provides a cohesive color palette and design tokens
 * that evoke calm, peace, and tranquility - perfect for a mindfulness app.
 * Colors are inspired by nature: soft skies, gentle earth tones, and serene pastels.
 */

/**
 * Primary color palette - Soft, calming tones
 */
export const colors = {
  // Background colors - Dark to teal gradient for calming contrast
  background: {
    primary: '#F8F9FA',      // Soft off-white background
    secondary: '#FFFFFF',     // Pure white for cards
    tertiary: '#F5F7FA',      // Slightly cooler background variant
    gradient: {
      start: '#1A1F2E',      // Dark grey-blue start (top)
      end: '#2D5F7A',        // Calming teal end (bottom)
    },
  },

  // Primary accent - Calming blue-green
  primary: {
    main: '#6B9BD1',          // Soft periwinkle blue
    light: '#A8C8E8',         // Light sky blue
    dark: '#4A7BA7',          // Deeper blue
    gradient: {
      start: '#7BA3D4',      // Soft blue
      end: '#9BB8D9',        // Lighter blue
    },
  },

  // Secondary accent - Gentle lavender
  secondary: {
    main: '#B8A9D4',          // Soft lavender
    light: '#D4C8E8',         // Very light lavender
    dark: '#9B8AB8',          // Deeper lavender
    gradient: {
      start: '#C4B5DD',      // Soft lavender
      end: '#D8CCE8',        // Light lavender
    },
  },

  // Success - Soft green (nature, growth)
  success: {
    main: '#7FB3A8',          // Sage green
    light: '#A8D4C8',         // Light mint
    dark: '#5A8B7F',          // Deeper sage
    gradient: {
      start: '#7FB3A8',       // Sage green
      end: '#A8D4C8',         // Light mint
    },
  },

  // Warning - Warm peach
  warning: {
    main: '#E8B89A',          // Soft peach
    light: '#F5D4C4',         // Light peach
    dark: '#D49B7A',          // Deeper peach
  },

  // Error - Soft coral (gentle, not harsh)
  error: {
    main: '#D49B9B',          // Soft coral
    light: '#E8C4C4',         // Light coral
    dark: '#B87A7A',          // Deeper coral
  },

  // Text colors - Bright, visible colors for dark gradient background
  text: {
    primary: '#F0F8FF',       // Bright light blue-white for dark backgrounds
    secondary: '#D0E8F0',     // Bright light blue-gray
    tertiary: '#B0D0E0',      // Medium light gray for hints
    inverse: '#FFFFFF',       // Pure white text
    muted: '#8AA8B8',         // Muted gray for disabled text
    // Text colors for glassy cards/backgrounds
    card: '#1A2A3A',          // Dark blue-gray for glassy cards
    cardSecondary: '#3A4A5A', // Medium dark gray for glassy cards
  },

  // Border colors - For glassy cards on dark background
  border: {
    light: 'rgba(255, 255, 255, 0.2)',    // Light glass border
    medium: 'rgba(255, 255, 255, 0.3)',   // Medium glass border
    dark: 'rgba(255, 255, 255, 0.4)',     // Darker glass border
  },

  // Shadow colors - Soft, subtle shadows
  shadow: {
    light: 'rgba(100, 120, 140, 0.08)',    // Very subtle shadow
    medium: 'rgba(100, 120, 140, 0.12)',   // Medium shadow
    dark: 'rgba(100, 120, 140, 0.16)',     // Darker shadow (still soft)
  },

  // Special colors for breathwork
  breath: {
    inhale: '#7BA3D4',         // Calming blue for inhale
    hold: '#9BB8D9',           // Light blue for hold
    exhale: '#B8A9D4',         // Soft lavender for exhale
    background: '#1A2F3E',     // Dark blue-gray to match gradient
  },
};

/**
 * Typography scale
 */
export const typography = {
  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 42,
  },

  // Font weights
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

/**
 * Spacing scale (8px base unit)
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

/**
 * Border radius scale - Soft, rounded corners
 */
export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 16,
  '3xl': 20,
  full: 9999,
};

/**
 * Shadow presets - Soft, elevated feel
 */
export const shadows = {
  sm: {
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2, // Android
  },
  md: {
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4, // Android
  },
  lg: {
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8, // Android
  },
};

/**
 * Common component styles
 */
export const components = {
  // Card style - Glassmorphism effect
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',  // Semi-transparent white for glass effect
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',      // Glass border
    // Backdrop blur effect (iOS/Android support)
    overflow: 'hidden',
    ...shadows.sm,
  },

  // Button styles
  button: {
    primary: {
      backgroundColor: colors.primary.main,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      ...shadows.sm,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary.main,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
  },

  // Input styles - Glassmorphism
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
  },
};

