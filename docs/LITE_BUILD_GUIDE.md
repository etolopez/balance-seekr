# Lite Build Guide (Without Masterminds)

Guide for building Android and iOS versions without the Masterminds feature.

## Overview

You can create "lite" builds that exclude the Masterminds feature while keeping all other functionality (Habits, Journal, Tasks, Breathwork, Badges). This is useful for:
- App store submissions that don't require Solana wallet integration
- Users who don't need community features
- Simplified versions of the app

## How It Works

- **Feature Flag**: Uses `EXPO_PUBLIC_ENABLE_MASTERMINDS` environment variable
- **Build Profiles**: Separate EAS build profiles for lite versions
- **Conditional Rendering**: Masterminds tab and routes are hidden when disabled

## Available Build Profiles

### Production (Full Version)
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```
- Includes Masterminds feature
- Uses mainnet Solana
- Full functionality

### Production Lite (Without Masterminds)
```bash
eas build --platform android --profile production-lite
eas build --platform ios --profile production-lite
```
- **Excludes** Masterminds feature
- No Solana wallet integration needed
- All other features work normally

### Preview Lite (For Testing)
```bash
eas build --platform android --profile preview-lite
eas build --platform ios --profile preview-lite
```
- Same as production-lite but for internal testing

## What's Included in Lite Builds

✅ **Included:**
- Home screen with goals and badges
- Habits & Goals tracking
- Journal entries
- Tasks management
- Breathwork exercises
- Badge system
- All core mindfulness features

❌ **Excluded:**
- Masterminds tab (hidden)
- Mastermind creation
- Mastermind joining
- Mastermind chat
- Solana wallet integration
- X account sync (only needed for Masterminds)

## Building Lite Versions

### Android Lite APK
```bash
eas build --platform android --profile production-lite
```

### iOS Lite Build
```bash
eas build --platform ios --profile production-lite
```

## What Changes in Lite Builds

1. **Tab Bar**: Masterminds tab is hidden
2. **Routes**: Masterminds routes are not accessible
3. **Code**: Masterminds code is still in the bundle but not executed
4. **Dependencies**: Solana dependencies are still included (but unused)

## Benefits

- ✅ Same codebase, different builds
- ✅ Easy to maintain both versions
- ✅ No code duplication
- ✅ Can build both versions from same repo
- ✅ Current production build unaffected

## Limitations

- Masterminds code is still in the bundle (adds ~2-3MB)
- Solana dependencies are included (but not used)
- Can't remove dependencies without code splitting (future enhancement)

## Future Enhancements

To further optimize lite builds:
1. Code splitting to exclude Masterminds code entirely
2. Conditional dependency installation
3. Separate app bundles for smaller size

## Testing Lite Builds

After building:
1. Install the lite APK/IPA
2. Verify Masterminds tab is not visible
3. Test all other features work normally
4. Verify app size is slightly smaller

## Switching Between Versions

You can build both versions:
- **Full version**: `eas build --platform android --profile production`
- **Lite version**: `eas build --platform android --profile production-lite`

Both builds will be available in your Expo dashboard with different build IDs.

## Notes

- The current production build in progress is **unaffected**
- Lite builds use the same codebase
- Feature flag is set at build time via environment variable
- No code changes needed to switch between versions

