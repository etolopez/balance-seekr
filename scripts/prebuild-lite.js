#!/usr/bin/env node
/**
 * Prebuild script for Lite builds
 * Modifies app.json to set different app name and package names for lite builds
 * This allows full and lite versions to coexist on the same device
 * Also ensures native code is regenerated with new package names
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if this is a lite build
const isLiteBuild = process.env.EXPO_PUBLIC_ENABLE_MASTERMINDS === 'false' || 
                    process.env.EAS_BUILD_PROFILE?.includes('lite');

if (!isLiteBuild) {
  console.log('Not a lite build, skipping app.json modification');
  process.exit(0);
}

console.log('🔧 Starting Lite build prebuild...');
console.log(`   EAS_BUILD_PROFILE: ${process.env.EAS_BUILD_PROFILE}`);
console.log(`   EXPO_PUBLIC_ENABLE_MASTERMINDS: ${process.env.EXPO_PUBLIC_ENABLE_MASTERMINDS}`);

const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Backup original values (for reference)
const originalName = appJson.expo.name;
const originalPackage = appJson.expo.android.package;
const originalBundleId = appJson.expo.ios.bundleIdentifier;
const originalSlug = appJson.expo.slug;
const originalScheme = appJson.expo.scheme;

// Modify app name for lite builds
appJson.expo.name = 'Balance Seekr Lite';

// Modify package names to allow coexistence
appJson.expo.android.package = 'com.balanceseekr.app.lite';
appJson.expo.ios.bundleIdentifier = 'com.balanceseekr.app.lite';

// Modify slug for lite builds
appJson.expo.slug = 'balance-seekr-lite';

// Modify scheme for lite builds
appJson.expo.scheme = 'balanceseekrlite';

// Write back to app.json
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

console.log('✅ Modified app.json for Lite build:');
console.log(`   App Name: ${originalName} → ${appJson.expo.name}`);
console.log(`   Android Package: ${originalPackage} → ${appJson.expo.android.package}`);
console.log(`   iOS Bundle ID: ${originalBundleId} → ${appJson.expo.ios.bundleIdentifier}`);
console.log(`   Slug: ${originalSlug} → ${appJson.expo.slug}`);
console.log(`   Scheme: ${originalScheme} → ${appJson.expo.scheme}`);

// Force native code regeneration by removing android/ios folders
// This ensures the new package names are used
const androidPath = path.join(__dirname, '..', 'android');
const iosPath = path.join(__dirname, '..', 'ios');

if (fs.existsSync(androidPath)) {
  console.log('🗑️  Removing android folder to force regeneration...');
  fs.rmSync(androidPath, { recursive: true, force: true });
}

if (fs.existsSync(iosPath)) {
  console.log('🗑️  Removing ios folder to force regeneration...');
  fs.rmSync(iosPath, { recursive: true, force: true });
}

console.log('✅ Prebuild complete. Native code will be regenerated with new package names.');

