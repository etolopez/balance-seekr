/**
 * Feature Flags Configuration
 * Controls which features are enabled in the app
 * Can be set via environment variables for different build profiles
 */

// Check if Masterminds feature is enabled
// Defaults to true (enabled) unless explicitly disabled via env var
export const ENABLE_MASTERMINDS = 
  process.env.EXPO_PUBLIC_ENABLE_MASTERMINDS !== 'false';

/**
 * Check if a feature is enabled
 * @param feature - Feature name to check
 * @returns true if feature is enabled
 */
export function isFeatureEnabled(feature: 'masterminds'): boolean {
  switch (feature) {
    case 'masterminds':
      return ENABLE_MASTERMINDS;
    default:
      return false;
  }
}

