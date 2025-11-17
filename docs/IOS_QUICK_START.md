# iOS Testing Quick Start

Quick guide to build and test your iOS app (with Masterminds limitations).

## Can I Test on iPhone?

**Yes, but with limitations:**
- ✅ All features work EXCEPT Masterminds
- ✅ Habits, Journal, Tasks, Breathwork all work
- ❌ Masterminds requires Solana wallet (Android-only)

## Quick Build for iOS

### Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com
   - Required for TestFlight or device testing

2. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

### Build iOS App

```bash
# Build for TestFlight (recommended)
eas build --platform ios --profile production

# Or build for Ad-Hoc distribution
eas build --platform ios --profile preview
```

**Build Time:** 15-30 minutes

### Distribute via TestFlight

1. **Submit to TestFlight:**
   ```bash
   eas submit --platform ios
   ```
   
   Or manually:
   - Go to https://appstoreconnect.apple.com
   - Navigate to your app → TestFlight
   - Upload the .ipa file from EAS

2. **Add Testers:**
   - In App Store Connect → TestFlight
   - Add internal testers (up to 100)
   - Add external testers (up to 10,000)
   - They receive email invitation

3. **Testers Install:**
   - Download "TestFlight" app from App Store
   - Accept invitation email
   - Install "Balance Seekr" from TestFlight

## Alternative: Direct Device Install (Ad-Hoc)

If you don't want to use TestFlight:

1. **Collect Device UDIDs:**
   - Testers: Settings → General → About → Copy UDID
   - Add UDIDs in Apple Developer Portal

2. **Build Ad-Hoc:**
   ```bash
   eas build --platform ios --profile preview
   ```

3. **Distribute:**
   - Download .ipa from EAS
   - Share via email or hosting
   - Testers install via iTunes/Finder

## What Testers Will See

- ✅ Can use Habits, Journal, Tasks, Breathwork
- ✅ Can see Home screen with badges
- ⚠️ Masterminds section will show wallet connection error
- ⚠️ Wallet features won't work

## Testing Checklist

- [ ] App launches successfully
- [ ] Habits feature works
- [ ] Journal feature works
- [ ] Tasks feature works
- [ ] Breathwork feature works
- [ ] Badges display correctly
- [ ] Masterminds shows appropriate error/message

## Cost

- **Apple Developer Account:** $99/year (one-time per year)
- **TestFlight:** Free (included with Developer account)
- **EAS Build:** Free tier available (limited builds)

## Next Steps

1. **For iOS Testing:**
   - Set up Apple Developer account
   - Build iOS app
   - Submit to TestFlight
   - Test non-wallet features

2. **For Full iOS Support (Future):**
   - Implement iOS wallet adapter
   - Update Masterminds to work on iOS
   - Re-test all features

## Resources

- **Apple Developer:** https://developer.apple.com
- **TestFlight Guide:** https://developer.apple.com/testflight/
- **EAS iOS Build:** https://docs.expo.dev/build/introduction/

