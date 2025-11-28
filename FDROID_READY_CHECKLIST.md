# F-Droid Submission Readiness Checklist

This checklist helps you verify that your app is ready for F-Droid submission.

## ✅ Completed Items

- [x] **LICENSE file created** - MIT License added to repository root
- [x] **package.json updated** - License field added
- [x] **Metadata directory created** - Fastlane format structure in `metadata/`
- [x] **Metadata files created**:
  - [x] `metadata/en-US/short_description.txt`
  - [x] `metadata/en-US/full_description.txt`
  - [x] `metadata/en-US/changelogs/2.txt`
  - [x] `metadata/en-US/images/icon.png`
  - [x] `metadata/en-US/images/phoneScreenshots/` (4 screenshots)
- [x] **BUILD.md created** - Build instructions for F-Droid
- [x] **F-Droid metadata template** - `fdroid-metadata-template.yml` created

## ⚠️ Action Required

### 1. Make Repository Public

Your repository must be publicly accessible:

```bash
# Check if repository is public
# Visit: https://github.com/etolopez/balance-seekr
# If private, go to Settings → Change visibility → Make public
```

### 2. Tag Current Version

F-Droid needs version tags that match your app version:

```bash
# Tag the current version
git tag v1.0.1
git push origin v1.0.1
```

### 3. Commit All New Files

```bash
# Add all new files
git add LICENSE
git add package.json
git add metadata/
git add BUILD.md
git add fdroid-metadata-template.yml
git add FDROID_READY_CHECKLIST.md
git add docs/FDROID_SUBMISSION_GUIDE.md

# Commit
git commit -m "Add F-Droid submission files: LICENSE, metadata, and build instructions"

# Push
git push origin main  # or your default branch
```

### 4. Generate Android Native Code

F-Droid needs the `android/` directory in your repository:

```bash
# Generate native Android code
npx expo prebuild --platform android --clean

# Commit the android/ directory
git add android/
git commit -m "Add Android native code for F-Droid builds"
git push origin main
```

**Important**: The `android/` directory must be committed to your repository for F-Droid to build.

### 5. Update F-Droid Metadata Template

Edit `fdroid-metadata-template.yml` and update:

- [ ] `AuthorEmail`: Your email address
- [ ] `AuthorWebSite`: Your website (optional)
- [ ] `WebSite`: App website URL
- [ ] `Donate`: Donation link (optional)
- [ ] Remove any optional fields you don't want

### 6. Fork fdroiddata Repository

1. Go to: https://gitlab.com/fdroid/fdroiddata
2. Click "Fork" button
3. Clone your fork:
   ```bash
   git clone https://gitlab.com/YOUR_USERNAME/fdroiddata.git
   cd fdroiddata
   ```

### 7. Create Metadata File in fdroiddata

```bash
# Create branch
git checkout -b com.balanceseekr.app

# Copy template (update it first!)
cp /path/to/balance-seekr/fdroid-metadata-template.yml metadata/com.balanceseekr.app.yml

# Edit the file with your information
# Then commit
git add metadata/com.balanceseekr.app.yml
git commit -m "Add Balance Seekr (com.balanceseekr.app)"
git push origin com.balanceseekr.app
```

### 8. Submit Merge Request

1. Go to: https://gitlab.com/YOUR_USERNAME/fdroiddata
2. Click "Merge Requests" → "New Merge Request"
3. Select:
   - Source: `YOUR_USERNAME/fdroiddata` → `com.balanceseekr.app`
   - Target: `fdroid/fdroiddata` → `master`
4. Fill in title and description
5. Submit

## 📋 Verification Checklist

Before submitting, verify:

- [ ] Repository is public
- [ ] LICENSE file exists and is MIT (or another FLOSS license)
- [ ] All source code is in repository
- [ ] `android/` directory is committed (generated via `expo prebuild`)
- [ ] Version tag exists: `v1.0.1`
- [ ] Metadata files are in fastlane format
- [ ] Screenshots are PNG format
- [ ] BUILD.md has clear build instructions
- [ ] All dependencies are FLOSS-licensed
- [ ] F-Droid metadata file is complete and accurate

## 🔍 Dependency License Check

Verify all dependencies are FLOSS:

```bash
# Check dependency licenses
npm list --depth=0 --json | jq '.dependencies | to_entries | map({name: .key, license: .value.license})'
```

Common FLOSS licenses:
- ✅ MIT
- ✅ Apache-2.0
- ✅ GPL-2.0, GPL-3.0
- ✅ BSD-2-Clause, BSD-3-Clause
- ✅ ISC
- ❌ Proprietary licenses (not allowed)

## 📚 Next Steps After Submission

1. **Monitor Merge Request**: Check for comments from F-Droid maintainers
2. **Respond Promptly**: Answer any questions quickly
3. **Join F-Droid Forum**: https://forum.f-droid.org
4. **Be Patient**: Review process can take weeks to months

## 🎯 Quick Reference

**Repository**: https://github.com/etolopez/balance-seekr  
**Package**: com.balanceseekr.app  
**Version**: 1.0.1 (versionCode: 2)  
**License**: MIT  
**F-Droid Template**: `fdroid-metadata-template.yml`  
**Build Instructions**: `BUILD.md`

---

**Status**: Ready for F-Droid submission after completing action items above! 🚀

