# Android Testing Guide

## 🚀 Quick Start - Physical Android Device

### Step 1: Enable Developer Mode on Your Android Phone

1. **Go to Settings → About Phone**
2. **Tap "Build Number" 7 times** (you'll see "You are now a developer!")
3. **Go back to Settings → Developer Options**
4. **Enable "USB Debugging"**

### Step 2: Connect Your Phone

1. **Connect your Android phone via USB**
2. **On your phone:** Allow USB debugging when prompted
3. **Verify connection:**
   ```bash
   adb devices
   ```
   You should see your device listed

### Step 3: Build and Install

**Option A: Using Gradle (Recommended)**
```bash
cd android
./gradlew assembleDebug
./gradlew installDebug
```

**Option B: Using Android Studio**
1. Open Android Studio
2. File → Open → Select `android/` folder
3. Wait for Gradle sync
4. Click the green Play button or press `Shift + F10`
5. Select your connected device

### Step 4: Start Expo

In a separate terminal (from project root):
```bash
npm start
```

The app should automatically connect to your device!

---

## 📱 Alternative: Android Emulator

### Step 1: Start Android Studio

### Step 2: Open AVD Manager
- Tools → Device Manager
- Click "Create Device" if you don't have one
- Choose a device (e.g., Pixel 6)
- Download a system image if needed
- Click "Finish"

### Step 3: Start the Emulator
- Click the Play button next to your AVD
- Wait for it to boot (takes 1-2 minutes)

### Step 4: Build and Install
```bash
cd android
./gradlew installDebug
```

### Step 5: Start Expo
```bash
npm start
```

---

## ✅ Testing Image Picker

Once your app is running on Android:

1. **Go to Masterminds tab**
2. **Click "Create Public Group"** or **"Edit"** on an existing group
3. **Click "Choose Background Image"**
4. **Grant photo permission** when Android asks
5. **Select an image** - it will upload to Cloudinary automatically
6. **Check the preview** - you should see your uploaded image

---

## 🐛 Troubleshooting

### Device not detected?
```bash
# Check if device is connected
adb devices

# If empty, try:
adb kill-server
adb start-server
adb devices
```

### Build fails?
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Permission denied?
- Make sure USB debugging is enabled
- Check that you allowed USB debugging on your phone
- Try a different USB cable/port

### Expo not connecting?
- Make sure phone and computer are on the same WiFi network
- Or use USB connection mode
- Try restarting Expo: `npm start -- --clear`

---

## 🎯 Quick Commands Reference

```bash
# Check connected devices
adb devices

# Install app on connected device
cd android && ./gradlew installDebug

# Start Expo
npm start

# Restart Expo with cleared cache
npm start -- --clear
```

