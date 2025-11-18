/**
 * Feature Flags Configuration
 * Controls which features are enabled in the app
 * Can be set via environment variables or app.json extra field
 */

import Constants from 'expo-constants';

// Check if Masterminds feature is enabled
// Priority: 1. app.json extra.enableMasterminds, 2. EXPO_PUBLIC_ENABLE_MASTERMINDS env var, 3. default true
const mastermindsFromExtra = Constants.expoConfig?.extra?.enableMasterminds;
const mastermindsEnv = process.env.EXPO_PUBLIC_ENABLE_MASTERMINDS;

// If explicitly set in app.json, use that (most reliable)
// Otherwise check env var (must be exactly 'false' to disable)
// Default to true if neither is set
let ENABLE_MASTERMINDS: boolean;
if (typeof mastermindsFromExtra === 'boolean') {
  ENABLE_MASTERMINDS = mastermindsFromExtra;
} else if (mastermindsEnv !== undefined) {
  ENABLE_MASTERMINDS = mastermindsEnv !== 'false';
} else {
  ENABLE_MASTERMINDS = true; // Default enabled
}

export { ENABLE_MASTERMINDS };

// ALWAYS log this so we can see what's happening (even in production builds)
console.log('[Features] ==========================================');
console.log('[Features] ENABLE_MASTERMINDS:', ENABLE_MASTERMINDS);
console.log('[Features] From app.json extra:', mastermindsFromExtra);
console.log('[Features] From env var:', mastermindsEnv);
console.log('[Features] Final value:', ENABLE_MASTERMINDS);
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

