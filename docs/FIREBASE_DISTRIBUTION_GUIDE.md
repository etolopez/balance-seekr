# Firebase App Distribution Guide

Step-by-step guide to upload your APK to Firebase App Distribution and get a shareable link.

## Prerequisites

1. **Firebase Account**: Go to https://console.firebase.google.com and create/sign in
2. **Firebase Project**: Create a new project or use existing one
3. **Firebase CLI**: Install if you don't have it

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open your browser to authenticate.

## Step 3: Initialize Firebase in Your Project

```bash
cd /Users/eto/Desktop/appp-mental/solana-seeker
firebase init appdistribution
```

**When prompted:**
- Select your Firebase project
- Choose "Android" as the platform
- Enter the path to your APK (or leave blank to specify later)

## Step 4: Download Your APK

If you haven't downloaded it yet:

```bash
# For Lite version
curl -L "https://expo.dev/artifacts/eas/pr6p3bQnYyzSbUsQnQtP57.apk" -o balance-seekr-lite.apk

# For Full version (use the URL from your EAS build)
curl -L "YOUR_BUILD_URL_HERE" -o balance-seekr-production.apk
```

## Step 5: Upload APK to Firebase

### Option A: Using Firebase CLI (Recommended)

```bash
firebase appdistribution:distribute balance-seekr-lite.apk \
  --app YOUR_APP_ID \
  --groups "testers" \
  --release-notes "Balance Seekr Lite - Android build without Masterminds"
```

**To get your App ID:**
1. Go to Firebase Console → App Distribution
2. Click "Get started" or "Add app"
3. Select "Android"
4. Enter package name: `com.balanceseekr.app.lite` (for lite) or `com.balanceseekr.app` (for full)
5. Copy the App ID shown

### Option B: Using Firebase Console (Web UI)

1. Go to https://console.firebase.google.com
2. Select your project
3. Click "App Distribution" in the left menu
4. Click "Add app" or select existing app
5. Choose "Android"
6. Enter package name: `com.balanceseekr.app.lite` (for lite version)
7. Click "Register app"
8. Click "Upload release"
9. Drag and drop your APK file
10. Add release notes (optional)
11. Click "Next"
12. Select testers or create a tester group
13. Click "Distribute"

## Step 6: Get Shareable Link

### Method 1: From Firebase Console

1. Go to Firebase Console → App Distribution
2. Click on your app
3. Click on the release you just uploaded
4. Click "Share" or "Copy link"
5. The link will look like: `https://appdistribution.firebase.google.com/releases/...`

### Method 2: From Email

Firebase will send an email to testers with a download link. You can forward this link.

### Method 3: Public Link (if enabled)

1. In Firebase Console → App Distribution → Your app
2. Go to "Settings" or "Configuration"
3. Enable "Public links" if available
4. Copy the public link

## Step 7: Share the Link

The link will allow anyone to:
- Download the APK directly
- Install it on their Android device
- See release notes

**Note**: Users may need to allow "Install from unknown sources" on their Android device.

## Quick Commands Reference

```bash
# Download APK
curl -L "APK_URL" -o app.apk

# Upload to Firebase
firebase appdistribution:distribute app.apk \
  --app YOUR_APP_ID \
  --groups "testers" \
  --release-notes "Version description"

# List your apps
firebase appdistribution:apps:list
```

## Troubleshooting

### "App not found"
- Make sure you've registered the app in Firebase Console first
- Check that the package name matches exactly

### "Permission denied"
- Make sure you're logged in: `firebase login`
- Check that you have access to the Firebase project

### "Invalid APK"
- Make sure the APK is not corrupted
- Re-download from EAS if needed

## Alternative: Direct Hosting

If you prefer not to use Firebase, you can also:

1. **Google Drive**: Upload APK, share link (set to "Anyone with link")
2. **GitHub Releases**: Create a release and upload APK as asset
3. **Dropbox**: Upload and create share link

