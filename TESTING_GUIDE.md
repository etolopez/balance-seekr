# Testing Guide - After Prebuild

After running `npx expo prebuild --clean`, you need to build and test your app. Here are your options:

## 🎯 Quick Testing Options

### Option 1: iOS Simulator (Mac only, fastest)

1. **Open Xcode:**
   ```bash
   open ios/solana-seeker.xcworkspace
   ```

2. **Select a Simulator:**
   - In Xcode, click the device selector (top bar)
   - Choose an iPhone simulator (e.g., iPhone 15 Pro)

3. **Build and Run:**
   - Press `Cmd + R` or click the Play button
   - Wait for the build to complete (first time takes 5-10 minutes)

4. **Start Expo:**
   - In a separate terminal, run:
   ```bash
   npm start
   ```
   - The app should automatically connect to the development server

### Option 2: Physical iOS Device

1. **Connect your iPhone via USB**

2. **Open Xcode:**
   ```bash
   open ios/solana-seeker.xcworkspace
   ```

3. **Select your device:**
   - In Xcode device selector, choose your connected iPhone

4. **Configure signing:**
   - Click on the project in the left sidebar
   - Go to "Signing & Capabilities"
   - Select your Apple Developer team (or use your personal account)

5. **Build and Run:**
   - Press `Cmd + R`
   - Trust the developer on your iPhone (Settings → General → Device Management)

6. **Start Expo:**
   ```bash
   npm start
   ```

### Option 3: Android Emulator

1. **Start Android Studio**

2. **Open AVD Manager:**
   - Tools → Device Manager
   - Create/start an Android Virtual Device (AVD)

3. **Build the app:**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

4. **Install on emulator:**
   ```bash
   ./gradlew installDebug
   ```
   Or use Android Studio to build and run

5. **Start Expo:**
   ```bash
   npm start
   ```

### Option 4: Physical Android Device

1. **Enable Developer Options on your Android device:**
   - Settings → About Phone → Tap "Build Number" 7 times
   - Go back → Developer Options → Enable "USB Debugging"

2. **Connect via USB**

3. **Build and install:**
   ```bash
   cd android
   ./gradlew installDebug
   ```

4. **Start Expo:**
   ```bash
   npm start
   ```

## 🚀 EAS Build (Recommended for Production Testing)

If you want to test on a real device without local builds:

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login:**
   ```bash
   eas login
   ```

3. **Build for development:**
   ```bash
   eas build --profile development --platform ios
   # or
   eas build --profile development --platform android
   ```

4. **Install on device:**
   - EAS will provide a download link
   - Install the app on your device
   - Run `npm start` and the app will connect

## 📱 Testing Image Picker

Once your app is running:

1. **Go to Masterminds tab**
2. **Click "Create Public Group"**
3. **Click "Choose Background Image"**
4. **Grant photo permission when prompted**
5. **Select an image** - it should upload to Cloudinary automatically
6. **Check the preview** - you should see your uploaded image

## ✅ What to Test

- [ ] Image picker opens and requests permission
- [ ] Image uploads to Cloudinary successfully
- [ ] Background image appears on group cards
- [ ] Edit button works for your groups
- [ ] Image appears in group detail modal
- [ ] "Join for Free" text shows when price is 0
- [ ] Owner badge shows instead of join button for your groups

## 🐛 Troubleshooting

### Image picker not working?
- Make sure you granted photo permissions
- Check that the native module loaded (no errors in console)
- Try restarting the app

### Build errors?
- Make sure CocoaPods installed correctly: `cd ios && pod install`
- For Android: `cd android && ./gradlew clean`

### Expo not connecting?
- Make sure device/emulator and computer are on the same network
- Check that Expo is running: `npm start`
- Try restarting Expo with `--clear` flag
