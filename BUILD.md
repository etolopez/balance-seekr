# Building Balance Seekr from Source

This guide explains how to build Balance Seekr from source code for F-Droid and other distributions.

## Prerequisites

- **Node.js**: Version 18-21 (tested with 21.7.3)
- **npm** or **yarn**: Package manager
- **Android SDK**: Android SDK Platform 34+ and Build Tools
- **Java JDK**: Version 17 (OpenJDK or Oracle JDK)
- **Expo CLI**: Will be installed via npm

## Environment Setup

### 1. Install Node.js

```bash
# Using nvm (recommended)
nvm install 21.7.3
nvm use 21.7.3

# Or download from https://nodejs.org/
```

### 2. Install Android SDK

Download and install Android Studio, or install Android SDK command-line tools:

```bash
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# export ANDROID_HOME=$HOME/Android/Sdk  # Linux

# Add to PATH
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 3. Install Java JDK 17

```bash
# macOS (using Homebrew)
brew install openjdk@17

# Linux (Ubuntu/Debian)
sudo apt-get install openjdk-17-jdk

# Set JAVA_HOME
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home  # macOS
# export JAVA_HOME=/usr/lib/jvm/java-17-openjdk  # Linux
```

## Build Steps

### 1. Clone Repository

```bash
git clone https://github.com/etolopez/balance-seekr.git
cd balance-seekr
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Native Android Code

Expo prebuild generates the native Android project from the Expo configuration:

```bash
npx expo prebuild --platform android --clean
```

This creates the `android/` directory with native Android code.

### 4. Build APK

```bash
cd android
./gradlew assembleRelease
```

**Note**: On Windows, use `gradlew.bat` instead of `./gradlew`

### 5. Locate Built APK

The release APK will be located at:

```
android/app/build/outputs/apk/release/app-release.apk
```

## Build Configuration

### Version Information

- **Version Name**: Set in `app.json` under `expo.version`
- **Version Code**: Managed by F-Droid (auto-incremented)
- **Package Name**: `com.balanceseekr.app` (in `app.json`)

### Signing

For F-Droid builds, signing is handled automatically by F-Droid's build system. For local testing:

1. Generate a keystore:
   ```bash
   keytool -genkey -v -keystore balance-seekr-release.keystore -alias balance-seekr -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing in `android/app/build.gradle` (not needed for F-Droid)

## Dependencies

All dependencies are listed in `package.json`. Key dependencies:

- **React Native**: 0.81.5
- **Expo SDK**: 54.0.0
- **Solana Libraries**: @solana/web3.js, @solana/spl-token
- **State Management**: Zustand

All dependencies use FLOSS licenses (MIT, Apache-2.0, etc.).

## Troubleshooting

### Node Version Issues

If you encounter Node version errors:

```bash
nvm use 21.7.3
```

### Android SDK Not Found

Ensure `ANDROID_HOME` is set correctly:

```bash
echo $ANDROID_HOME
```

### Java Version Issues

Verify Java version:

```bash
java -version  # Should show version 17
```

### Gradle Build Fails

Clean and rebuild:

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### Expo Prebuild Issues

If prebuild fails, try:

```bash
npx expo prebuild --platform android --clean
rm -rf android ios
npx expo prebuild --platform android
```

## F-Droid Specific Notes

For F-Droid builds:

1. The `android/` directory must be committed to the repository
2. F-Droid will run: `npm install`, `npx expo prebuild`, `./gradlew assembleRelease`
3. All dependencies must be FLOSS-licensed
4. No proprietary build tools or services should be required

## License

This project is licensed under the MIT License. See `LICENSE` file for details.

