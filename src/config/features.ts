/**
 * Feature Flags Configuration
 * Controls which features are enabled in the app
 * Can be set via environment variables for different build profiles
 */

// Check if Masterminds feature is enabled
// Defaults to true (enabled) unless explicitly disabled via env var
// The env var must be exactly the string 'false' to disable
const mastermindsEnv = process.env.EXPO_PUBLIC_ENABLE_MASTERMINDS;
export const ENABLE_MASTERMINDS = mastermindsEnv !== 'false';

// ALWAYS log this so we can see what's happening (even in production builds)
console.log('[Features] ==========================================');
console.log('[Features] ENABLE_MASTERMINDS:', ENABLE_MASTERMINDS);
console.log('[Features] EXPO_PUBLIC_ENABLE_MASTERMINDS env:', mastermindsEnv);
console.log('[Features] typeof env:', typeof mastermindsEnv);
console.log('[Features] env === "false":', mastermindsEnv === 'false');
console.log('[Features] ==========================================');

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

