# iOS Testing Guide for Balance Seekr

Guide for building and distributing iOS test builds.

## ⚠️ Important Limitation: Solana Mobile Wallet Adapter

**Current Status:** Your app uses `@solana-mobile/mobile-wallet-adapter-protocol`, which is **Android-specific** and designed for Solana Mobile devices (Saga phones).

### What Works on iOS:
- ✅ **Habits & Goals** - Full functionality
- ✅ **Journal** - Full functionality  
- ✅ **Tasks** - Full functionality
- ✅ **Breathwork** - Full functionality
- ✅ **Home Screen** - Full functionality
- ✅ **Badges** - Full functionality

### What Doesn't Work on iOS:
- ❌ **Masterminds** - Requires Solana wallet (Android-only)
- ❌ **Wallet Connection** - Solana Mobile Adapter is Android-only
- ❌ **Solana Payments** - Not available on iOS

**Note:** You can still test iOS for all non-wallet features. For Masterminds, you'd need to implement an iOS-compatible wallet adapter later.

## iOS Testing Options

### Option 1: TestFlight (Recommended) ⭐

**Best for:** Official Apple beta testing

**Requirements:**
- Apple Developer Account ($99/year)
- App Store Connect access

**Steps:**

1. **Build iOS App:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit to TestFlight:**
   ```bash
   eas submit --platform ios
   ```
   
   Or manually:
   - Download the .ipa from EAS
   - Upload to App Store Connect → TestFlight
   - Add internal/external testers
   - They install via TestFlight app

3. **Testers Install:**
   - Download TestFlight app from App Store
   - Accept invitation email
   - Install your app from TestFlight

**Pros:**
- ✅ Official Apple testing platform
- ✅ Easy for testers (via TestFlight app)
- ✅ Automatic updates
- ✅ Up to 10,000 testers
- ✅ 90-day testing period per build

**Cons:**
- ⚠️ Requires Apple Developer account ($99/year)
- ⚠️ Review process (usually quick for TestFlight)
- ⚠️ Limited to 90 days per build

### Option 2: Ad-Hoc Distribution

**Best for:** Testing with specific devices (up to 100 devices)

**Requirements:**
- Apple Developer Account ($99/year)
- Device UDIDs of testers

**Steps:**

1. **Collect Device UDIDs:**
   - Testers: Settings → General → About → Copy UDID
   - Add UDIDs to your Apple Developer account

2. **Build with Ad-Hoc Profile:**
   ```bash
   eas build --platform ios --profile preview
   ```
   
   Configure in `eas.json`:
   ```json
   {
     "build": {
       "preview": {
         "ios": {
           "distribution": "ad-hoc"
         }
       }
     }
   }
   ```

3. **Distribute:**
   - Download .ipa from EAS
   - Share via email or hosting
   - Testers install via iTunes/Finder or direct download

**Pros:**
- ✅ No App Store review
- ✅ Works offline
- ✅ Good for internal testing

**Cons:**
- ⚠️ Limited to 100 devices
- ⚠️ Requires UDID collection
- ⚠️ More complex setup

### Option 3: Development Build (Expo Dev Client)

**Best for:** Development and quick testing

**Steps:**

1. **Build Development Client:**
   ```bash
   eas build --platform ios --profile development
   ```

2. **Install on Device:**
   - Download and install via EAS
   - Or use Xcode to install directly

3. **Run with Expo:**
   ```bash
   npx expo start --dev-client
   ```

**Pros:**
- ✅ Fast iteration
- ✅ Hot reload
- ✅ Good for development

**Cons:**
- ⚠️ Requires Expo Dev Client app
- ⚠️ Not suitable for end-user testing

## iOS-Specific Considerations

### 1. Wallet Integration on iOS

Since Solana Mobile Wallet Adapter is Android-only, you'll need:

**Option A: Use Wallet Adapter for iOS**
```bash
npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-native
```

**Option B: Web-based Wallet Connection**
- Use WalletConnect or similar
- Open wallet in browser/Safari
- Connect via deep linking

**Option C: iOS-Specific Wallet SDKs**
- Phantom iOS SDK
- Solflare iOS SDK
- Other wallet-specific SDKs

### 2. Update iOS Configuration

Your `app.json` already has iOS config:
```json
{
  "ios": {
    "bundleIdentifier": "com.balanceseekr.app",
    "supportsTablet": true
  }
}
```

**Additional iOS Settings to Consider:**
```json
{
  "ios": {
    "bundleIdentifier": "com.balanceseekr.app",
    "buildNumber": "1",
    "supportsTablet": true,
    "infoPlist": {
      "NSPhotoLibraryUsageDescription": "The app accesses your photos to let you set background images for your Mastermind groups.",
      "NSCameraUsageDescription": "Allow Balance Seekr to access your camera"
    }
  }
}
```

### 3. Update Info.plist

Your iOS `Info.plist` still references old names. Update:
- `CFBundleDisplayName`: "Solana Seeker" → "Balance Seekr"
- URL schemes: `solanaseeker` → `balanceseekr`

## Recommended Approach

### For Now (Android Focus):

1. **Focus on Android testing first** (Solana Mobile dApp Store)
2. **Build Android APK** and distribute for testing
3. **Get feedback** and iterate

### For iOS Later:

1. **Implement iOS wallet adapter** (when ready)
2. **Build iOS app** with EAS
3. **Submit to TestFlight** for testing
4. **Iterate** based on feedback

## Quick iOS Build Commands

```bash
# Build for TestFlight
eas build --platform ios --profile production

# Build for Ad-Hoc
eas build --platform ios --profile preview

# Build Development Client
eas build --platform ios --profile development

# Submit to TestFlight
eas submit --platform ios

# Check build status
eas build:list --platform ios
```

## iOS vs Android Testing Comparison

| Feature | Android | iOS |
|---------|---------|-----|
| **Distribution** | APK (direct install) | TestFlight or Ad-Hoc |
| **Cost** | Free | $99/year (Apple Developer) |
| **Ease** | Very Easy | Moderate |
| **Wallet Support** | ✅ Solana Mobile Adapter | ⚠️ Needs alternative |
| **Tester Limit** | Unlimited | 10,000 (TestFlight) |
| **Review Required** | No (APK) | Yes (TestFlight) |

## Current Status

✅ **Android:** Ready for testing
- Solana Mobile Wallet Adapter works
- Can build APK and distribute
- No restrictions

⚠️ **iOS:** Needs work
- Solana Mobile Wallet Adapter doesn't work on iOS
- Need alternative wallet connection
- Requires Apple Developer account for testing

## Next Steps

1. **For Android Testing:**
   - Follow `docs/APK_BUILD_AND_DISTRIBUTION.md`
   - Build APK and distribute

2. **For iOS (Future):**
   - Implement iOS wallet adapter
   - Set up Apple Developer account
   - Build and submit to TestFlight

## Resources

- **EAS iOS Build:** https://docs.expo.dev/build/introduction/
- **TestFlight Guide:** https://developer.apple.com/testflight/
- **Apple Developer:** https://developer.apple.com
- **Solana Wallet Adapters:** https://github.com/solana-labs/wallet-adapter

