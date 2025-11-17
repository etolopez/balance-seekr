# Solana Mobile dApp Store Submission Guide

Complete guide for submitting **Balance Seekr** (Solana Seeker) to the Solana Mobile dApp Store.

## Overview

The Solana Mobile dApp Store is a curated store for decentralized applications on Solana Mobile devices (Saga phones). Your app uses Solana Mobile Wallet Adapter, making it a perfect candidate for submission.

## Prerequisites Checklist

Before starting, ensure you have:

- [x] **Solana Mobile Wallet Adapter Integration** ✅ (Already implemented)
- [ ] **Release APK Build** (Need to create)
- [ ] **Publishing Assets** (Need to prepare)
- [ ] **Solana Wallet** (For minting NFTs)
- [ ] **Solana Mobile Discord Access** (For review process)

## Step 1: Prepare Your App Build

### 1.1 Update App Configuration

Your current `app.json` needs a few updates for production:

```json
{
  "expo": {
    "name": "Balance Seekr",
    "slug": "balance-seekr",
    "version": "1.0.0",
    "android": {
      "package": "com.balanceseekr.app", // Update from com.anonymous.solanaseeker
      "versionCode": 1
    }
  }
}
```

**Action Items:**
- [ ] Update package name to a proper domain (e.g., `com.balanceseekr.app`)
- [ ] Update app name if needed
- [ ] Ensure version numbers are correct

### 1.2 Build Release APK

You need a **signed release APK**, not a debug build.

#### Option A: Using EAS Build (Recommended)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configure EAS:**
   ```bash
   eas build:configure
   ```

3. **Update `eas.json`** (create if it doesn't exist):
   ```json
   {
     "build": {
       "production": {
         "android": {
           "buildType": "apk",
           "gradleCommand": ":app:assembleRelease"
         }
       }
     }
   }
   ```

4. **Build Release APK:**
   ```bash
   eas build --platform android --profile production
   ```

5. **Download the APK** from the EAS dashboard when build completes.

#### Option B: Local Build

1. **Generate a keystore** (if you don't have one):
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore balance-seekr-key.jks -alias balance-seekr -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing in `app.json`:**
   ```json
   {
     "expo": {
       "android": {
         "package": "com.balanceseekr.app",
         "signingConfig": {
           "useKeystore": true
         }
       }
     }
   }
   ```

3. **Build locally:**
   ```bash
   npx expo prebuild --clean
   cd android
   ./gradlew assembleRelease
   ```

4. **Find APK:** `android/app/build/outputs/apk/release/app-release.apk`

**Action Items:**
- [ ] Build signed release APK
- [ ] Test APK on Android device/emulator
- [ ] Verify Solana wallet integration works in release build

## Step 2: Prepare Publishing Assets

You need the following assets for submission:

### 2.1 App Icon
- **Size:** 512x512 pixels
- **Format:** PNG
- **Requirements:** Square, no transparency, high quality
- **File:** `app-icon-512.png`

### 2.2 Banner Graphic
- **Size:** 1200x600 pixels
- **Format:** PNG or JPG
- **Requirements:** Landscape orientation, represents your app
- **File:** `banner-1200x600.png`

### 2.3 Screenshots/Videos
- **Minimum:** 4 screenshots or videos
- **Recommended:** 6-8 screenshots showing key features
- **Requirements:** 
  - Show app functionality
  - Highlight Solana integration
  - Show Masterminds, Habits, Journal, Tasks features
- **Sizes:** Various (phone screenshots, typically 1080x1920 or similar)

**Action Items:**
- [ ] Create 512x512 app icon
- [ ] Create 1200x600 banner
- [ ] Capture 4-8 screenshots of key features
- [ ] (Optional) Create short demo video

## Step 3: Set Up Publishing Configuration

### 3.1 Install Publishing Tool

The Solana dApp Store uses a publishing tool to create NFTs and submit your app.

1. **Clone the publishing repository:**
   ```bash
   git clone https://github.com/solana-mobile/dapp-publishing.git
   cd dapp-publishing
   npm install
   ```

2. **Create a publishing folder:**
   ```bash
   mkdir balance-seekr-publishing
   cd balance-seekr-publishing
   ```

### 3.2 Create `config.yaml`

Create a `config.yaml` file with your app details:

```yaml
publisher:
  name: "Your Name or Company"
  website: "https://balanceseekr.com" # Update with your website
  email: "your-email@example.com" # Your contact email

app:
  name: "Balance Seekr"
  tagline: "Personal growth and wellness with Solana-powered Masterminds"
  description: |
    Balance Seekr is a comprehensive wellness app that helps you build habits, 
    journal your thoughts, complete tasks, and connect with like-minded individuals 
    through Solana-powered Mastermind groups. Features include:
    
    - Daily habit tracking with notes
    - Personal journaling with encryption
    - Task management
    - Mastermind groups with Solana payments
    - Badge system for achievements
    - X (Twitter) account verification
    
    Built with Solana Mobile Wallet Adapter for seamless wallet integration.
  
  category: "Lifestyle" # Options: Finance, Gaming, Lifestyle, Social, Tools, etc.
  tags:
    - "wellness"
    - "productivity"
    - "social"
    - "solana"
  
  website: "https://balanceseekr.com" # Your app website
  twitter: "@balanceseekr" # Your Twitter handle (if applicable)
  discord: "https://discord.gg/your-server" # Your Discord (if applicable)

release:
  version: "1.0.0"
  releaseNotes: |
    Initial release of Balance Seekr:
    - Habit tracking and logging
    - Journal entries with encryption
    - Task management
    - Mastermind groups with Solana payments
    - Badge achievement system
    - X account verification
    - Full Solana Mobile Wallet Adapter integration
```

**Action Items:**
- [ ] Fill out `config.yaml` with your app details
- [ ] Update website, email, and social links
- [ ] Write compelling description highlighting Solana features

### 3.3 Organize Assets

Place all assets in your publishing folder:

```
balance-seekr-publishing/
├── config.yaml
├── app-icon-512.png
├── banner-1200x600.png
├── screenshots/
│   ├── screenshot-1.png
│   ├── screenshot-2.png
│   ├── screenshot-3.png
│   └── screenshot-4.png
└── apk/
    └── balance-seekr-release.apk
```

## Step 4: Mint NFTs for Your App

The Solana dApp Store uses NFTs to represent your app and releases on-chain.

### 4.1 Create Solana Keypair

You'll need a Solana keypair for publishing (separate from your app's wallet):

```bash
# Generate a new keypair for publishing
solana-keygen new --outfile ~/dapp-publisher-keypair.json

# Fund the keypair with SOL (for devnet testing first)
solana airdrop 2 ~/dapp-publisher-keypair.json --url devnet

# For mainnet, transfer SOL to the keypair address
solana address -k ~/dapp-publisher-keypair.json
```

**⚠️ Important:** 
- Store this keypair securely
- Start with devnet for testing
- Only use mainnet when ready for production

### 4.2 Mint App NFT

The App NFT represents your app (created once):

```bash
cd dapp-publishing
npm run mint-app \
  -- --keypair ~/dapp-publisher-keypair.json \
  --config balance-seekr-publishing/config.yaml \
  --icon balance-seekr-publishing/app-icon-512.png \
  --banner balance-seekr-publishing/banner-1200x600.png \
  --cluster devnet # Use 'mainnet-beta' for production
```

This will:
- Create an App NFT on-chain
- Store app metadata
- Return an App NFT address (save this!)

### 4.3 Mint Release NFT

The Release NFT represents a specific version of your app:

```bash
npm run mint-release \
  -- --keypair ~/dapp-publisher-keypair.json \
  --config balance-seekr-publishing/config.yaml \
  --app-nft <APP_NFT_ADDRESS> \
  --apk balance-seekr-publishing/apk/balance-seekr-release.apk \
  --screenshots balance-seekr-publishing/screenshots/ \
  --cluster devnet # Use 'mainnet-beta' for production
```

This will:
- Create a Release NFT for version 1.0.0
- Upload APK and screenshots
- Link to your App NFT
- Return a Release NFT address (save this!)

**Action Items:**
- [ ] Create publishing keypair
- [ ] Fund keypair with SOL (devnet for testing)
- [ ] Mint App NFT (test on devnet first)
- [ ] Mint Release NFT (test on devnet first)
- [ ] Save both NFT addresses

## Step 5: Submit to Solana dApp Store

### 5.1 Submit via Publishing Portal

1. **Access the Solana dApp Store Publisher Portal:**
   - Visit: https://publisher.solanamobile.com (or current portal URL)
   - Connect with your publishing wallet

2. **Submit Your App:**
   - Enter your App NFT address
   - Enter your Release NFT address
   - Attest compliance with Solana dApp Store policies
   - Confirm you're authorized to submit the app

3. **Review Checklist:**
   - [ ] App NFT minted successfully
   - [ ] Release NFT minted successfully
   - [ ] APK is signed release build
   - [ ] All assets uploaded correctly
   - [ ] App description is accurate
   - [ ] Compliance attested

### 5.2 Join Solana Mobile Discord

1. **Join the Discord server:**
   - Invite link: https://discord.gg/solanamobile (verify current link)
   - Join the `#dapp-store` channel

2. **Notify for Review:**
   Post in `#dapp-store` channel:
   ```
   Hi! I've submitted Balance Seekr to the dApp Store:
   - App NFT: <YOUR_APP_NFT_ADDRESS>
   - Release NFT: <YOUR_RELEASE_NFT_ADDRESS>
   - Version: 1.0.0
   - Description: Personal growth app with Solana-powered Masterminds
   
   Ready for review! 🚀
   ```

3. **Wait for Review:**
   - Solana Mobile team will contact you
   - They may request changes or additional information
   - Review process typically takes a few days to a week

## Step 6: Post-Submission

### 6.1 Respond to Feedback

- Address any issues raised during review
- Update APK if needed and mint a new Release NFT
- Update assets if requested

### 6.2 Update Your App

For future versions:

1. **Build new APK** with incremented version
2. **Update `config.yaml`** with new version and release notes
3. **Mint new Release NFT:**
   ```bash
   npm run mint-release \
     -- --keypair ~/dapp-publisher-keypair.json \
     --config balance-seekr-publishing/config.yaml \
     --app-nft <APP_NFT_ADDRESS> \
     --apk balance-seekr-publishing/apk/balance-seekr-release-v1.1.0.apk \
     --screenshots balance-seekr-publishing/screenshots/ \
     --cluster mainnet-beta
   ```
4. **Submit new Release NFT** to the portal

## Current App Status

### ✅ Already Implemented:
- Solana Mobile Wallet Adapter integration
- Android app structure
- Payment verification
- Mastermind groups with Solana payments

### ⚠️ Needs Attention:
- Package name: `com.anonymous.solanaseeker` → Should be updated to proper domain
- App name: "Solana Seeker" → Consider "Balance Seekr" for consistency
- Release APK build needed
- Publishing assets needed

## Resources

- **Solana Mobile Documentation:** https://docs.solanamobile.com
- **dApp Publishing Guide:** https://docs.solanamobile.com/dapp-publishing/overview
- **Solana Mobile Discord:** https://discord.gg/solanamobile
- **Publishing Tool GitHub:** https://github.com/solana-mobile/dapp-publishing
- **Tutorial Video:** https://www.youtube.com/watch?v=IgeE1mg1aYk

## Next Steps

1. **Immediate:**
   - [ ] Update package name in `app.json`
   - [ ] Create publishing assets (icon, banner, screenshots)
   - [ ] Build release APK using EAS or locally

2. **Before Submission:**
   - [ ] Test release APK thoroughly
   - [ ] Set up publishing keypair
   - [ ] Create `config.yaml`
   - [ ] Mint App NFT (test on devnet first)

3. **Submission:**
   - [ ] Mint Release NFT (mainnet)
   - [ ] Submit via publisher portal
   - [ ] Join Discord and notify for review

## Support

If you encounter issues:
- Check Solana Mobile Discord `#dapp-store` channel
- Review publishing tool documentation
- Contact Solana Mobile team through Discord

Good luck with your submission! 🚀

