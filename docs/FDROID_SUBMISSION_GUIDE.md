# F-Droid Submission Guide for Balance Seekr

Complete guide for submitting **Balance Seekr** to F-Droid, the free and open-source Android app repository.

## 📋 F-Droid Requirements Overview

F-Droid has strict requirements that your app must meet:

1. **FLOSS License**: App and ALL dependencies must be Free, Libre, and Open Source Software
2. **Public Source Code**: Source code must be publicly available (GitHub, GitLab, etc.)
3. **Buildable from Source**: App must build from source code without proprietary tools
4. **No Proprietary Dependencies**: All libraries and dependencies must be FLOSS
5. **No Tracking/Ads**: No tracking, analytics, or advertising without user consent

**Reference**: [F-Droid Inclusion Policy](https://fdroid.gitlab.io/jekyll-fdroid/docs/Inclusion_Policy/)

## ⚠️ Important Considerations for Expo Apps

**Challenge**: Expo apps can be tricky for F-Droid because:
- Expo uses a managed workflow that may include proprietary components
- EAS Build uses cloud services (not buildable from source)
- Some Expo SDK components may not be FLOSS

**Solution**: You'll need to:
1. Use **Expo bare workflow** or **prebuild** to generate native code
2. Ensure all dependencies are FLOSS-licensed
3. Build the APK from source (not using EAS)
4. Provide clear build instructions

## ✅ Pre-Submission Checklist

### 1. License Your Project

**CRITICAL**: F-Droid requires a FLOSS license. You need to:

1. **Add a LICENSE file** to your repository root
2. **Choose a compatible license** (recommended: GPLv3, MIT, or Apache 2.0)
3. **Update package.json** to include license field

```bash
# Create LICENSE file (example for MIT)
# Or use: GPLv3, Apache-2.0, etc.
```

**Recommended**: Use **MIT License** or **GPLv3** for maximum compatibility.

### 2. Make Source Code Public

- [ ] Repository is public on GitHub/GitLab
- [ ] All source code is accessible
- [ ] No proprietary code or secrets in repository
- [ ] `.env` files are gitignored (already done ✅)

### 3. Verify All Dependencies Are FLOSS

Check your dependencies in `package.json`:

**✅ Likely FLOSS (check individually):**
- React, React Native
- Expo SDK packages (most are MIT/Apache)
- Solana libraries
- Zustand

**⚠️ Need to verify:**
- All `@expo/*` packages
- All `react-native-*` packages
- Any third-party libraries

**Action**: Review each dependency's license:
```bash
# Check licenses
npm list --depth=0 --json | jq '.dependencies | to_entries | map({name: .key, license: .value.license})'
```

### 4. Tag Releases in Git

F-Droid needs version tags that match your app version:

```bash
# Tag current version (1.0.1)
git tag v1.0.1
git push origin v1.0.1

# For future releases
git tag v1.0.2
git push origin v1.0.2
```

**Important**: Tag names should match `versionName` in `app.json` (e.g., `v1.0.1`)

### 5. Create Metadata Files (Fastlane Format)

F-Droid uses fastlane-style metadata. Create this structure in your repository:

```
metadata/
└── en-US/
    ├── short_description.txt          # 30-50 characters
    ├── full_description.txt           # Detailed description
    ├── images/
    │   ├── icon.png                   # 512x512 PNG
    │   └── phoneScreenshots/
    │       ├── screenshot1.png
    │       ├── screenshot2.png
    │       ├── screenshot3.png
    │       └── screenshot4.png
    └── changelogs/
        └── 2.txt                      # Changelog for versionCode 2
```

**File Contents:**

**`metadata/en-US/short_description.txt`:**
```
Personal growth and wellness app with Solana-powered Masterminds
```

**`metadata/en-US/full_description.txt`:**
```
Balance Seekr is a comprehensive wellness app that helps you build habits, 
journal your thoughts, complete tasks, and connect with like-minded individuals 
through Solana-powered Mastermind groups.

Features:
- Daily habit tracking with notes and scheduling
- Personal journaling with optional encryption
- Task management
- Mastermind groups with Solana payments
- Badge achievement system
- X (Twitter) account verification
- Background color customization
- Breathwork exercises

Built with Solana Mobile Wallet Adapter for seamless wallet integration.
```

**`metadata/en-US/changelogs/2.txt`:**
```
Initial release of Balance Seekr:
- Habit tracking and logging with day-of-week scheduling
- Journal entries with encryption
- Task management
- Mastermind groups with Solana payments
- Badge achievement system
- X account verification
- Background hue customization
- Full Solana Mobile Wallet Adapter integration
```

**Screenshots**: Use existing screenshots from `balance-seekr-publishing/`:
- Convert JPG to PNG if needed
- Recommended sizes: 1080x1920 or 720x1280

### 6. Prepare Build Instructions

F-Droid needs to build your app from source. Create a `BUILD.md` or update `README.md` with:

```markdown
## Building from Source

### Prerequisites
- Node.js 18-21
- npm or yarn
- Android SDK
- Java JDK 17
- Expo CLI

### Build Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate native code:
   ```bash
   npx expo prebuild --platform android
   ```

3. Build APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. APK location:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```
```

## 🚀 Submission Process

### Step 1: Fork fdroiddata Repository

1. **Create GitLab account** (if you don't have one):
   - Visit: https://gitlab.com
   - Sign up for free account

2. **Fork the repository**:
   - Go to: https://gitlab.com/fdroid/fdroiddata
   - Click "Fork" button
   - This creates your own copy: `https://gitlab.com/YOUR_USERNAME/fdroiddata`

### Step 2: Create Metadata File

1. **Clone your fork**:
   ```bash
   git clone https://gitlab.com/YOUR_USERNAME/fdroiddata.git
   cd fdroiddata
   ```

2. **Create a new branch** (use your package name):
   ```bash
   git checkout -b com.balanceseekr.app
   ```

3. **Create metadata file**:
   ```bash
   # Create metadata file
   touch metadata/com.balanceseekr.app.yml
   ```

4. **Fill in the metadata file** (see template below)

### Step 3: Metadata File Template

Create `metadata/com.balanceseekr.app.yml`:

```yaml
Categories:
  - Health
  - Productivity
License: MIT  # Or GPL-3.0, Apache-2.0, etc.
AuthorName: Roberto Lopez J.
AuthorEmail: your-email@example.com
AuthorWebSite: https://your-website.com
WebSite: https://your-website.com
SourceCode: https://github.com/YOUR_USERNAME/solana-seeker
IssueTracker: https://github.com/YOUR_USERNAME/solana-seeker/issues
Changelog: https://github.com/YOUR_USERNAME/solana-seeker/releases

RepoType: git
Repo: https://github.com/YOUR_USERNAME/solana-seeker.git

Builds:
  - versionName: '1.0.1'
    versionCode: 2
    commit: v1.0.1
    subdir: ''
    gradle:
      - yes
    output: android/app/build/outputs/apk/release/app-release.apk
    outputFormat: apk
    srclibs:
      - '@react-native-community/slider@5.1.1'
      - '@solana/web3.js@1.98.4'
      # Add all your dependencies here
    build:
      - npm install
      - npx expo prebuild --platform android
      - cd android && ./gradlew assembleRelease

AutoUpdateMode: Version
UpdateCheckMode: Tags
CurrentVersion: '1.0.1'
CurrentVersionCode: 2
```

**Important Fields:**
- `License`: Must match your LICENSE file
- `SourceCode`: Public repository URL
- `Repo`: Git repository URL
- `commit`: Git tag for this version (e.g., `v1.0.1`)
- `build`: Commands to build from source
- `srclibs`: List of dependencies (F-Droid verifies licenses)

### Step 4: Test Build Locally (Optional but Recommended)

1. **Install F-Droid build tools**:
   ```bash
   # On Linux or macOS with Docker
   docker pull fdroid/buildserver
   ```

2. **Test build**:
   ```bash
   # This is complex - F-Droid has specific build environment
   # Consider asking F-Droid maintainers for help
   ```

**Note**: Local testing is optional. F-Droid maintainers will test the build.

### Step 5: Submit Merge Request

1. **Commit and push**:
   ```bash
   git add metadata/com.balanceseekr.app.yml
   git commit -m "Add Balance Seekr (com.balanceseekr.app)"
   git push origin com.balanceseekr.app
   ```

2. **Create Merge Request**:
   - Go to: https://gitlab.com/YOUR_USERNAME/fdroiddata
   - Click "Merge Requests" → "New Merge Request"
   - Select your branch: `com.balanceseekr.app`
   - Target: `fdroid/fdroiddata` → `master`
   - Title: "Add Balance Seekr (com.balanceseekr.app)"
   - Description: Brief description of your app

3. **Submit the MR**

### Step 6: Await Review

- F-Droid maintainers will review your submission
- They will:
  - Verify license compatibility
  - Test building from source
  - Check all dependencies are FLOSS
  - Review metadata

**Timeline**: Can take weeks to months depending on maintainer workload

**Communication**: 
- Respond promptly to any questions
- Join F-Droid forum: https://forum.f-droid.org
- Be active in your merge request comments

## 📝 Required Files Summary

Before submitting, ensure you have:

- [ ] `LICENSE` file in repository root
- [ ] `package.json` includes `"license": "MIT"` (or your chosen license)
- [ ] Git tags for each version (e.g., `v1.0.1`)
- [ ] `metadata/` directory with fastlane format files
- [ ] Public repository with all source code
- [ ] `BUILD.md` or build instructions in README
- [ ] All dependencies verified as FLOSS

## 🔍 Common Issues & Solutions

### Issue: Expo Managed Workflow Not Supported

**Problem**: F-Droid can't build Expo managed apps (they use cloud services)

**Solution**: 
- Use `expo prebuild` to generate native Android code
- Commit the `android/` folder to your repository
- Provide build instructions using Gradle directly

### Issue: Dependencies Not FLOSS

**Problem**: Some dependency has a non-FLOSS license

**Solution**:
- Replace with FLOSS alternative
- Or request exception (rarely granted)
- Check licenses: https://spdx.org/licenses/

### Issue: Build Fails

**Problem**: F-Droid can't build your app

**Solution**:
- Test build locally first
- Provide clear, step-by-step build instructions
- Ensure all dependencies are available
- Check Android SDK requirements

### Issue: Missing Metadata

**Problem**: Metadata files are incomplete

**Solution**:
- Follow fastlane format exactly
- Include all required files
- Use correct file names and locations

## 📚 Resources

- **F-Droid Inclusion Policy**: https://fdroid.gitlab.io/jekyll-fdroid/docs/Inclusion_Policy/
- **Quick Start Guide**: https://f-droid.org/docs/Submitting_to_F-Droid_Quick_Start_Guide/
- **Build Metadata Reference**: https://f-droid.org/docs/Build_Metadata_Reference/
- **F-Droid Forum**: https://forum.f-droid.org
- **fdroiddata Repository**: https://gitlab.com/fdroid/fdroiddata

## 🎯 Next Steps

1. **Add LICENSE file** to your repository
2. **Make repository public** (if not already)
3. **Tag current version**: `git tag v1.0.1 && git push origin v1.0.1`
4. **Create metadata directory** with required files
5. **Verify all dependencies** are FLOSS
6. **Fork fdroiddata** and create metadata file
7. **Submit merge request**

---

**Note**: F-Droid submission is a community-driven process. Be patient, responsive, and helpful during the review process.

