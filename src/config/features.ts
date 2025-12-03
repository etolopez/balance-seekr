/**
 * Feature Flags Configuration
 * Controls which features are enabled in the app
 * Can be set via environment variables or app.json extra field
 */

import Constants from 'expo-constants';

// Check if Masterminds feature is enabled
// Priority: 1. app.json extra.enableMasterminds, 2. EXPO_PUBLIC_ENABLE_MASTERMINDS env var, 3. default true
function getEnableMasterminds(): boolean {
  try {
    // Try to get from Constants (most reliable for built apps)
    const fromExtra = Constants.expoConfig?.extra?.enableMasterminds;
    
    // Check if explicitly set to false (most important check for lite builds)
    if (fromExtra === false) {
      console.log('[Features] 🚫 Masterminds DISABLED via app.json extra.enableMasterminds: false');
      return false;
    }
    
    // If explicitly set to true, enable it
    if (fromExtra === true) {
      console.log('[Features] ✅ Masterminds ENABLED via app.json extra.enableMasterminds: true');
      return true;
    }
    
    // Fallback to env var (for development)
    const fromEnv = process.env.EXPO_PUBLIC_ENABLE_MASTERMINDS;
    if (fromEnv !== undefined) {
      const isEnabled = fromEnv !== 'false' && fromEnv !== '0';
      console.log('[Features] Using EXPO_PUBLIC_ENABLE_MASTERMINDS env var:', fromEnv, '→', isEnabled);
      return isEnabled;
    }
    
    // Default to true if not set (for backward compatibility)
    console.log('[Features] ⚠️ No explicit config found, defaulting to ENABLED');
    return true;
  } catch (error) {
    console.error('[Features] ❌ Error reading config:', error);
    return true; // Default enabled on error
  }
}

export const ENABLE_MASTERMINDS = getEnableMasterminds();

// ALWAYS log this so we can see what's happening
console.log('[Features] ==========================================');
console.log('[Features] 🎯 FINAL ENABLE_MASTERMINDS:', ENABLE_MASTERMINDS);
console.log('[Features] 📦 Constants.expoConfig?.extra:', JSON.stringify(Constants.expoConfig?.extra));
console.log('[Features] 🔍 enableMasterminds value:', Constants.expoConfig?.extra?.enableMasterminds);
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

