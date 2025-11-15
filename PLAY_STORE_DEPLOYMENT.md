# Play Store Deployment Guide

## Overview

This guide covers deploying your Balance Seekr app to the Google Play Store. Your app is already configured to use environment variables, which is the correct approach for production deployment.

## Current Setup ✅

Your app is already production-ready in terms of configuration:

1. **Environment Variables**: Using Expo's `app.json` `extra` field (best practice)
2. **Backend API**: Configured to use `EXPO_PUBLIC_API_URL` from environment
3. **No Hardcoded Secrets**: All sensitive data is in environment variables
4. **Git Security**: `.env` files are gitignored

## Pre-Deployment Checklist

### 1. Verify Production Backend URL

**Current Setup:**
- Your backend is deployed on Railway: `https://balance-seekr-production.up.railway.app`
- This should be your production API URL

**Action Required:**
1. Check your `.env` file (or `app.json` `extra` field):
   ```env
   EXPO_PUBLIC_API_URL=https://balance-seekr-production.up.railway.app
   ```

2. Verify the backend is working:
   ```bash
   curl https://balance-seekr-production.up.railway.app/health
   ```

### 2. Environment Variables Configuration

**For Expo/EAS Build:**
- Environment variables in `.env` are automatically included in builds
- Variables prefixed with `EXPO_PUBLIC_` are exposed to the app
- **DO NOT** include sensitive keys (API keys, secrets) in the app bundle

**Current Safe Variables:**
- ✅ `EXPO_PUBLIC_API_URL` - Public backend URL (safe)
- ✅ `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` - Public cloud name (safe)
- ✅ `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` - Public upload preset (safe)
- ✅ `EXPO_PUBLIC_PLATFORM_ADDRESS` - Public Solana address (safe)

**Never Include:**
- ❌ X API Bearer Tokens
- ❌ X API Access Tokens/Secrets
- ❌ Cloudinary API Secret
- ❌ Database credentials
- ❌ Any private keys

### 3. Build Configuration

**Option A: Using Expo Application Services (EAS) - Recommended**

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configure EAS:**
   ```bash
   eas build:configure
   ```

3. **Create `eas.json` (if not exists):**
   ```json
   {
     "build": {
       "production": {
         "android": {
           "buildType": "apk"  // or "aab" for Play Store
         },
         "env": {
           "EXPO_PUBLIC_API_URL": "https://balance-seekr-production.up.railway.app"
         }
       }
     }
   }
   ```

4. **Build for Android:**
   ```bash
   eas build --platform android --profile production
   ```

**Option B: Local Build (Advanced)**

1. **Generate Keystore:**
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure `app.json`:**
   ```json
   {
     "android": {
       "package": "com.yourcompany.balanceseekr",
       "versionCode": 1
     }
   }
   ```

3. **Build APK:**
   ```bash
   npx expo build:android
   ```

### 4. App Signing

**For Play Store, you need:**
- A signed APK or AAB (Android App Bundle - recommended)
- AAB is preferred by Google Play Store

**EAS handles signing automatically**, or you can use:
- Google Play App Signing (recommended)
- Manual signing with keystore

### 5. Play Store Requirements

**Before Submitting:**

1. **App Icon**: Ensure you have a proper app icon (1024x1024)
2. **Screenshots**: Prepare screenshots for different device sizes
3. **Privacy Policy**: Required for apps that collect data
4. **Content Rating**: Complete Google Play's content rating questionnaire
5. **App Description**: Write compelling store listing text

**Required Information:**
- App name: "Balance Seekr"
- Short description (80 characters)
- Full description (4000 characters)
- Category: Health & Fitness / Lifestyle
- Target audience
- Content rating

### 6. Privacy Considerations

**Your app collects:**
- Wallet addresses (blockchain public keys - not PII)
- Usernames (user-provided)
- X (Twitter) handles (if synced)
- Habit/task data (local storage)

**Recommendations:**
- Create a Privacy Policy (required)
- Explain data collection clearly
- Mention that wallet addresses are public blockchain data
- State that data is stored locally and optionally synced to backend

### 7. Testing Before Release

**Test Checklist:**
- [ ] Backend API connectivity works
- [ ] Wallet connection works
- [ ] All features function correctly
- [ ] No console errors in production build
- [ ] App works offline (local features)
- [ ] Images load correctly (Cloudinary)
- [ ] Solana transactions work (devnet/mainnet)

**Test Build:**
```bash
# Create a test build
eas build --platform android --profile production
# Install on test device
# Test all features
```

## Deployment Steps

### Step 1: Final Checks
```bash
# Verify environment variables
cat .env | grep EXPO_PUBLIC

# Test backend
curl https://balance-seekr-production.up.railway.app/health

# Check for any hardcoded URLs
grep -r "localhost\|127.0.0.1" src/
```

### Step 2: Build Production App
```bash
# Using EAS (recommended)
eas build --platform android --profile production

# Or local build
npx expo build:android
```

### Step 3: Download Build
- EAS will provide a download link
- Download the `.aab` or `.apk` file

### Step 4: Create Play Store Listing
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Fill in all required information
4. Upload screenshots and assets

### Step 5: Upload Build
1. Go to "Production" → "Create new release"
2. Upload your `.aab` file (or `.apk`)
3. Add release notes
4. Review and roll out

### Step 6: Submit for Review
- Google typically reviews within 1-3 days
- You'll be notified of approval or issues

## Environment Variables in Production

**You DON'T need a "clean" version** - your current setup is correct:

✅ **What's Safe to Include:**
- Public API URLs
- Public Solana addresses
- Public Cloudinary cloud names
- Public upload presets

❌ **What's NOT Included (Correctly):**
- Backend secrets (stored on Railway, not in app)
- Database credentials (backend only)
- Private API keys (backend only)

**Your app bundle will contain:**
- The frontend code
- Public environment variables (API URL, etc.)
- No secrets or private keys

This is the **standard and correct** approach for mobile apps.

## Post-Deployment

### Monitor
- Check Play Console for crash reports
- Monitor backend logs (Railway)
- Track user feedback

### Updates
- Use semantic versioning (`1.0.0`, `1.0.1`, etc.)
- Update `versionCode` in `app.json` for each release
- Test updates before releasing

## Troubleshooting

**Build Fails:**
- Check EAS build logs
- Verify environment variables are set
- Ensure `app.json` is valid

**Backend Not Connecting:**
- Verify Railway backend is running
- Check `EXPO_PUBLIC_API_URL` is correct
- Test backend URL manually

**App Crashes:**
- Check Play Console crash reports
- Review error logs
- Test on multiple devices

## Summary

✅ **You're ready to deploy!** Your app is already configured correctly:
- Environment variables are properly set up
- No secrets are in the codebase
- Backend is deployed and accessible
- Configuration follows best practices

**Next Steps:**
1. Verify production backend URL
2. Build with EAS or locally
3. Create Play Store listing
4. Upload and submit

No "clean" version needed - your current setup is production-ready! 🚀

