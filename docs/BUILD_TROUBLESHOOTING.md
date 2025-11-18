# Build Troubleshooting Guide

Common issues and solutions for EAS builds.

## Package Name Mismatch Error

### Error:
```
INSTALL_FAILED_UPDATE_INCOMPATIBLE: Existing package com.anonymous.solanaseeker signatures do not match newer version
```

### Cause:
You have an old version of the app installed with package name `com.anonymous.solanaseeker`, but the new build uses `com.balanceseekr.app`. Android won't allow updating apps with different package names.

### Solution:

**Option 1: Uninstall Old App (Recommended)**
```bash
# Connect your Android device/emulator
adb uninstall com.anonymous.solanaseeker
```

Or manually:
- Go to Settings → Apps
- Find "Solana Seeker" or "Balance Seekr" (old version)
- Uninstall it
- Then install the new APK

**Option 2: Use Different Package Name for Testing**
If you need to keep both versions, you can temporarily change the package name in `app.json`:
```json
{
  "android": {
    "package": "com.balanceseekr.app.test"
  }
}
```

## Build Contains Old Code

### Symptoms:
- Missing features (e.g., Mastermind landing page)
- Old UI text (e.g., "Verify Identity" instead of "Verify with Balance Seekr")
- Features not working as expected

### Causes:
1. **Build from wrong commit** - EAS might have built from an older commit
2. **Cached build** - Old build artifacts cached
3. **Wrong branch** - Building from wrong git branch

### Solutions:

**1. Verify Current Code:**
```bash
# Check current commit
git log --oneline -1

# Verify code has latest features
grep -r "What is a Mastermind" src/
grep -r "Verify with Balance Seekr" src/
```

**2. Force Fresh Build:**
```bash
# Clear EAS cache and rebuild
eas build --platform android --profile production --clear-cache
```

**3. Verify Build Includes Latest Code:**
- Check build logs in Expo dashboard
- Verify the commit hash matches your latest commit
- Ensure you're building from `main` branch

**4. Check Build Configuration:**
- Verify `app.json` has correct package name: `com.balanceseekr.app`
- Verify `eas.json` is using correct profile
- Check environment variables are set correctly

## Verification Checklist

Before building, verify:

- [ ] Latest code is committed and pushed
- [ ] `app.json` has correct package name (`com.balanceseekr.app`)
- [ ] `app.json` has correct version (`1.0.0`)
- [ ] All recent features are in the codebase
- [ ] No uncommitted changes
- [ ] Building from correct branch (`main`)

## After Build Completes

1. **Download APK** from Expo dashboard
2. **Uninstall old app** if package name changed
3. **Install new APK** on device
4. **Test all features** to verify they work

## Current Package Names

- **Old (deprecated):** `com.anonymous.solanaseeker`
- **New (current):** `com.balanceseekr.app`

If you have the old app installed, you **must uninstall it first** before installing the new build.

