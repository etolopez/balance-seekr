# EAS Build Guide for Balance Seekr

Quick guide for building release APKs using Expo Application Services (EAS).

## Prerequisites

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to EAS:**
   ```bash
   eas login
   ```
   - If you don't have an Expo account, create one at https://expo.dev

3. **Link your project (if not already linked):**
   ```bash
   eas build:configure
   ```

## Building APK for Solana Mobile dApp Store

### Production APK Build

```bash
eas build --platform android --profile production
```

This will:
- Build a signed release APK
- Upload to EAS servers
- Provide download link when complete

### Preview APK Build (for testing)

```bash
eas build --platform android --profile preview
```

## Build Configuration

Your `eas.json` is already configured with:

- **Production profile:** Builds APK for release
- **Preview profile:** Builds APK for internal testing
- **Development profile:** Builds with dev client

## After Build Completes

1. **Download the APK:**
   - Visit https://expo.dev
   - Go to your project
   - Navigate to "Builds"
   - Download the completed build

2. **Test the APK:**
   ```bash
   # Install on connected Android device
   adb install path/to/your-app.apk
   
   # Or transfer to device and install manually
   ```

3. **Verify:**
   - [ ] App launches correctly
   - [ ] Solana wallet connection works
   - [ ] All features functional
   - [ ] No debug logs or errors

## Build Status

Check build status:
```bash
eas build:list
```

View build details:
```bash
eas build:view [BUILD_ID]
```

## Troubleshooting

### Build Fails

1. **Check logs:**
   ```bash
   eas build:view [BUILD_ID]
   ```

2. **Common issues:**
   - Missing environment variables
   - Dependency conflicts
   - Android SDK issues

### APK Too Large

- Check `assetBundlePatterns` in `app.json`
- Remove unused assets
- Optimize images

### Signing Issues

EAS handles signing automatically. If you need custom signing:
- Configure in `eas.json` under `android.signing`
- Provide your keystore credentials

## Next Steps

After building:
1. Download APK
2. Test thoroughly
3. Use for Solana Mobile dApp Store submission
4. Follow `SOLANA_MOBILE_DAPP_STORE_SUBMISSION.md` guide

## Resources

- **EAS Documentation:** https://docs.expo.dev/build/introduction/
- **EAS Build Dashboard:** https://expo.dev
- **Build Status:** Check your Expo dashboard

