# Solana dApp Store Publishing Setup Guide

This guide walks you through the setup and submission process for publishing **Balance Seekr** to the Solana Mobile dApp Store.

## ✅ Prerequisites Completed

1. **Node.js 21.7.3** - Installed and active (required: 18-21)
2. **pnpm** - Enabled via corepack
3. **Solana dApp Store CLI** - Installed in `publishing/` folder
4. **Android SDK Build Tools** - Found at `~/Library/Android/sdk/build-tools/36.1.0`
5. **Java JDK 17** - Found at `/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home`
6. **Environment Configuration** - `.env` file created in `publishing/` folder

## 📋 Current Setup Status

### Environment Variables
The `.env` file in `publishing/` contains:
```bash
ANDROID_TOOLS_DIR="$HOME/Library/Android/sdk/build-tools/36.1.0"
JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"
```

### CLI Installation
- Location: `publishing/` folder
- Package: `@solana-mobile/dapp-store-cli@0.15.0`
- Config file: `publishing/config.yaml` (initialized)

## 🚀 Next Steps

### Step 1: Configure `config.yaml`

The `config.yaml` file in `publishing/` needs to be filled out with your app details. You need to provide:

1. **Publisher Information:**
   - Publisher name (e.g., "Roberto Lopez J." or "Balance Seekr")
   - Publisher website URL
   - Publisher email address
   - Support email (optional)

2. **App Information:**
   - App name: "Balance Seekr" ✅
   - Android package: "com.balanceseekr.app" ✅
   - License URL (required)
   - Copyright URL (required)
   - Privacy Policy URL (required)
   - App website URL

3. **Media Assets:**
   - App icon: `../balance-seekr-publishing/app-icon-512.png` ✅
   - Banner: `../balance-seekr-publishing/banner-1200x600.png` ✅
   - Screenshots: At least 4 screenshots from `../balance-seekr-publishing/`

4. **Release Information:**
   - Version: "1.0.1" ✅
   - Short description
   - Long description
   - What's new in this version
   - Testing instructions

### Step 2: Prepare APK

You have two APK builds from EAS:
- **Full Version**: https://expo.dev/artifacts/eas/kwbhLd1fNtyZsc3j2Ug9Vs.apk
- **Lite Version**: https://expo.dev/artifacts/eas/unnesVVX533pTLu1Djy5Nf.apk

**Action Required:**
1. Download the **Full Version** APK (with Masterminds)
2. Save it to: `publishing/../balance-seekr-publishing/apk/balance-seekr-release.apk`

```bash
# From the project root:
cd balance-seekr-publishing/apk
# Download the APK and rename it to balance-seekr-release.apk
```

### Step 3: Create Required URLs

You need to create and host:
1. **License/Terms of Service** - A URL to your app's terms
2. **Copyright Notice** - A URL to your copyright information
3. **Privacy Policy** - A URL to your privacy policy

These can be:
- GitHub Pages
- Your own website
- A simple static HTML page

### Step 4: Update `config.yaml`

Edit `publishing/config.yaml` with all the required information. Here's a template structure:

```yaml
publisher:
  name: "Roberto Lopez J."
  website: "https://your-website.com"  # Update this
  email: "your-email@example.com"  # Update this
  support_email: "support@example.com"  # Optional

app:
  name: "Balance Seekr"
  android_package: "com.balanceseekr.app"
  urls:
    license_url: "https://your-website.com/terms"  # Required
    copyright_url: "https://your-website.com/copyright"  # Required
    privacy_policy_url: "https://your-website.com/privacy"  # Required
    website: "https://your-website.com"  # Required
  media:
    - purpose: icon
      uri: "../balance-seekr-publishing/app-icon-512.png"

release:
  media:
    - purpose: icon
      uri: "../balance-seekr-publishing/app-icon-512.png"
    - purpose: banner
      uri: "../balance-seekr-publishing/banner-1200x600.png"
    - purpose: screenshot
      uri: "../balance-seekr-publishing/screenshot-1-home.jpg"
    - purpose: screenshot
      uri: "../balance-seekr-publishing/screenshot-3-Habits.jpg"
    - purpose: screenshot
      uri: "../balance-seekr-publishing/screenshot-5-Journal.jpg"
    - purpose: screenshot
      uri: "../balance-seekr-publishing/screenshot-7-masterminds.jpg"
  files:
    - purpose: install
      uri: "../balance-seekr-publishing/apk/balance-seekr-release.apk"
  catalog:
    en-US:
      name: "Balance Seekr"
      short_description: "Personal growth and wellness app with Solana-powered Masterminds"
      long_description: |
        Balance Seekr is a comprehensive wellness app that helps you build habits, 
        journal your thoughts, complete tasks, and connect with like-minded individuals 
        through Solana-powered Mastermind groups.
        
        Features:
        - Daily habit tracking with notes and scheduling
        - Personal journaling with encryption
        - Task management
        - Mastermind groups with Solana payments
        - Badge system for achievements
        - X (Twitter) account verification
        - Background color customization
        - Breathwork exercises
        
        Built with Solana Mobile Wallet Adapter for seamless wallet integration.
      new_in_version: |
        Initial release of Balance Seekr:
        - Habit tracking and logging with day-of-week scheduling
        - Journal entries with encryption
        - Task management
        - Mastermind groups with Solana payments
        - Badge achievement system
        - X account verification
        - Background hue customization
        - Full Solana Mobile Wallet Adapter integration
      saga_features: "Optimized for Solana Mobile devices with native wallet integration"

solana_mobile_dapp_publisher_portal:
  testing_instructions: |
    To test Balance Seekr:
    1. Install the APK on a Solana Mobile device or emulator
    2. Connect a Solana wallet using Mobile Wallet Adapter
    3. Create a habit and mark it complete
    4. Create a journal entry
    5. Browse Masterminds and create a group (requires SOL payment)
    6. Verify X account integration
    7. Adjust background hue in settings
```

### Step 5: Validate Configuration

Before minting NFTs, validate your configuration:

```bash
cd publishing
npx dapp-store validate
```

This will check:
- All required fields are filled
- Media files exist at specified paths
- APK file exists
- URLs are valid

### Step 6: Create Solana Keypair for Publishing

You'll need a separate Solana keypair for publishing (not your app's wallet):

```bash
# Generate a new keypair
solana-keygen new --outfile ~/dapp-publisher-keypair.json

# Get the address
solana address -k ~/dapp-publisher-keypair.json

# Fund it with SOL (start with devnet for testing)
solana airdrop 2 ~/dapp-publisher-keypair.json --url devnet

# For mainnet, transfer SOL to the address shown above
```

**⚠️ Important:** Store this keypair securely! You'll need it for:
- Minting App NFT (once)
- Minting Release NFTs (for each version)
- Updating your app listing

### Step 7: Mint App NFT

The App NFT represents your app (created once, reused for all releases):

```bash
cd publishing
npx dapp-store create app \
  --keypair ~/dapp-publisher-keypair.json \
  --config config.yaml \
  --cluster devnet  # Use 'mainnet-beta' for production
```

This will:
- Create an App NFT on-chain
- Store app metadata
- Return an App NFT address (save this!)

### Step 8: Mint Release NFT

The Release NFT represents version 1.0.1:

```bash
cd publishing
npx dapp-store create release \
  --keypair ~/dapp-publisher-keypair.json \
  --config config.yaml \
  --app-address <APP_NFT_ADDRESS_FROM_STEP_7> \
  --cluster devnet  # Use 'mainnet-beta' for production
```

This will:
- Create a Release NFT for version 1.0.1
- Upload APK and screenshots
- Link to your App NFT
- Return a Release NFT address (save this!)

### Step 9: Submit to Solana dApp Store

1. **Access the Publisher Portal:**
   - Visit: https://publisher.solanamobile.com
   - Connect with your publishing wallet (the keypair from Step 6)

2. **Submit Your App:**
   - Enter your App NFT address
   - Enter your Release NFT address
   - Attest compliance with Solana dApp Store policies
   - Confirm you're authorized to submit the app

3. **Join Solana Mobile Discord:**
   - Join: https://discord.gg/solanamobile
   - Go to `#dapp-store` channel
   - Post your submission details for review

## 📝 Checklist

Before submitting, ensure:

- [ ] `config.yaml` is fully filled out with all required fields
- [ ] All media files exist at specified paths
- [ ] APK is downloaded and in the correct location
- [ ] License, Copyright, and Privacy Policy URLs are created and accessible
- [ ] Publishing keypair is created and funded (test on devnet first)
- [ ] App NFT is minted (save the address)
- [ ] Release NFT is minted (save the address)
- [ ] Configuration is validated with `npx dapp-store validate`
- [ ] Tested the APK on a device/emulator
- [ ] Submitted via publisher portal
- [ ] Notified in Discord `#dapp-store` channel

## 🔧 Troubleshooting

### Node.js Version Issues
If you get Node version errors, ensure you're using Node 18-21:
```bash
nvm use 21.7.3
```

### Android SDK Tools Not Found
Check your `.env` file in `publishing/`:
```bash
ANDROID_TOOLS_DIR="$HOME/Library/Android/sdk/build-tools/36.1.0"
```

### Java Not Found
Check your `.env` file:
```bash
JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"
```

### Validation Errors
Run validation to see what's missing:
```bash
cd publishing
npx dapp-store validate
```

## 📚 Resources

- **Solana Mobile Documentation:** https://docs.solanamobile.com
- **dApp Publishing Guide:** https://docs.solanamobile.com/dapp-publishing/setup
- **Publisher Portal:** https://publisher.solanamobile.com
- **Solana Mobile Discord:** https://discord.gg/solanamobile

## 🎯 Quick Reference Commands

```bash
# Switch to correct Node version
nvm use 21.7.3

# Navigate to publishing folder
cd publishing

# Validate configuration
npx dapp-store validate

# Mint App NFT (devnet)
npx dapp-store create app --keypair ~/dapp-publisher-keypair.json --config config.yaml --cluster devnet

# Mint Release NFT (devnet)
npx dapp-store create release --keypair ~/dapp-publisher-keypair.json --config config.yaml --app-address <APP_NFT> --cluster devnet

# Get help
npx dapp-store --help
```

---

**Next Action:** Fill out `publishing/config.yaml` with your app details and required URLs.

