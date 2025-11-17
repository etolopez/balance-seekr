# APK Build and Distribution Guide

Complete guide for building your APK and distributing it for testing.

## Part 1: Building the APK

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

If you don't have an Expo account:
1. Visit https://expo.dev
2. Sign up for free
3. Then run `eas login`

### Step 3: Configure Your Project

```bash
eas build:configure
```

This will:
- Link your project to Expo
- Set up build configuration
- Create/update `eas.json` if needed

### Step 4: Build the APK

**For Testing (Preview Build):**
```bash
eas build --platform android --profile preview
```

**For Production/Release:**
```bash
eas build --platform android --profile production
```

**What happens:**
- Build starts on EAS servers (takes 10-20 minutes)
- You'll get a build ID
- You can monitor progress at https://expo.dev
- When complete, you'll get a download link

### Step 5: Download the APK

1. **Via Command Line:**
   ```bash
   eas build:list
   # Find your build ID, then:
   eas build:download [BUILD_ID]
   ```

2. **Via Web Dashboard:**
   - Visit https://expo.dev
   - Go to your project
   - Click "Builds" in the sidebar
   - Click on your completed build
   - Click "Download" button

3. **Save the APK:**
   - Save to `balance-seekr-publishing/apk/balance-seekr-release.apk`
   - Or any location you prefer

## Part 2: Distributing APK for Testing

You have several options for distributing your APK to testers:

### Option 1: Firebase App Distribution (Recommended) ⭐

**Best for:** Organized testing with multiple testers

1. **Set up Firebase:**
   - Go to https://console.firebase.google.com
   - Create a new project (or use existing)
   - Enable "App Distribution" in Firebase Console

2. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. **Initialize Firebase:**
   ```bash
   firebase init appdistribution
   ```

4. **Upload APK:**
   ```bash
   firebase appdistribution:distribute balance-seekr-publishing/apk/balance-seekr-release.apk \
     --app YOUR_APP_ID \
     --groups "testers" \
     --release-notes "Initial test build for Balance Seekr"
   ```

5. **Add Testers:**
   - In Firebase Console → App Distribution
   - Add tester emails
   - They'll receive email with download link

**Pros:**
- ✅ Professional distribution
- ✅ Tester management
- ✅ Release notes
- ✅ Crash reporting integration
- ✅ Free tier available

### Option 2: Direct Hosting (Simple)

**Best for:** Quick sharing with a few testers

1. **Upload to Cloud Storage:**
   - **Google Drive:** Upload APK, share link (set to "Anyone with link")
   - **Dropbox:** Upload APK, create share link
   - **GitHub Releases:** Create release, upload APK as asset
   - **Your own server:** Upload via FTP/SFTP

2. **Share the Link:**
   - Send link to testers
   - They download and install directly

**Example with GitHub:**
```bash
# Create a release
gh release create v1.0.0-test \
  balance-seekr-publishing/apk/balance-seekr-release.apk \
  --title "Balance Seekr Test Build" \
  --notes "Test build for Android. Install by downloading the APK."
```

**Pros:**
- ✅ Simple and free
- ✅ No setup required
- ✅ Works immediately

**Cons:**
- ⚠️ No tester management
- ⚠️ No analytics
- ⚠️ Manual distribution

### Option 3: EAS Update (For Over-the-Air Updates)

**Best for:** Updating app without rebuilding

After initial APK install, you can push updates:

```bash
eas update --branch production --message "Bug fixes and improvements"
```

**Note:** This requires users to have the app installed first.

### Option 4: Internal Testing Track (Google Play)

**Best for:** Testing before public release

1. **Build AAB instead of APK:**
   ```bash
   # Update eas.json to use "aab" instead of "apk"
   eas build --platform android --profile production
   ```

2. **Upload to Google Play Console:**
   - Create internal testing track
   - Upload AAB
   - Add testers via email
   - They install via Play Store link

**Pros:**
- ✅ Official Play Store testing
- ✅ Easy for testers
- ✅ Automatic updates

**Cons:**
- ⚠️ Requires Google Play Developer account ($25 one-time)
- ⚠️ Review process (usually quick for internal testing)

## Recommended Setup for Your App

### Quick Start (Easiest):

1. **Build APK:**
   ```bash
   eas build --platform android --profile preview
   ```

2. **Upload to Google Drive:**
   - Upload the APK
   - Get shareable link
   - Share with testers

3. **Testers Install:**
   - Download APK from link
   - Enable "Install from unknown sources" on Android
   - Install APK

### Professional Setup (Recommended):

1. **Set up Firebase App Distribution**
2. **Build APK with EAS**
3. **Upload to Firebase**
4. **Add testers via email**
5. **They receive email with install link**

## Installation Instructions for Testers

Create a simple guide for your testers:

```markdown
# Installing Balance Seekr Test Build

1. **Enable Unknown Sources:**
   - Go to Settings → Security
   - Enable "Install from unknown sources" or "Install unknown apps"
   - Allow your browser/file manager

2. **Download APK:**
   - Click the download link you received
   - Wait for download to complete

3. **Install:**
   - Open the downloaded APK file
   - Tap "Install"
   - Wait for installation

4. **Open App:**
   - Find "Balance Seekr" in your app drawer
   - Launch and test!

**Note:** You may see a security warning. This is normal for test builds.
Tap "Install anyway" or "More details" → "Install anyway"
```

## Quick Commands Reference

```bash
# Build APK
eas build --platform android --profile preview

# Check build status
eas build:list

# Download APK
eas build:download [BUILD_ID]

# View build logs
eas build:view [BUILD_ID]

# Upload to Firebase (after setup)
firebase appdistribution:distribute path/to/app.apk --app YOUR_APP_ID --groups "testers"
```

## Troubleshooting

### Build Fails
- Check logs: `eas build:view [BUILD_ID]`
- Common issues: Missing env vars, dependency conflicts
- Fix and rebuild

### APK Won't Install
- Ensure "Install from unknown sources" is enabled
- Check Android version compatibility
- Verify APK is not corrupted (re-download)

### Testers Can't Download
- Check link permissions (should be public or shared)
- Verify file hosting is accessible
- Try different hosting service

## Next Steps

After distributing for testing:

1. **Collect Feedback:**
   - Create a feedback form (Google Forms, etc.)
   - Ask testers to report bugs
   - Gather feature requests

2. **Fix Issues:**
   - Address critical bugs
   - Improve based on feedback

3. **Build New Version:**
   - Update version in `app.json`
   - Build new APK
   - Distribute updated version

4. **Prepare for Solana Mobile dApp Store:**
   - Once testing is complete
   - Follow `SOLANA_MOBILE_DAPP_STORE_SUBMISSION.md`

## Security Notes

⚠️ **Important:**
- Test builds are unsigned or use test signing
- Warn testers this is a test build
- Don't distribute production builds publicly
- Use proper signing for release builds

## Resources

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Firebase App Distribution:** https://firebase.google.com/docs/app-distribution
- **Google Play Internal Testing:** https://support.google.com/googleplay/android-developer/answer/9845334

