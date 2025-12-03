#!/bin/bash
# Test script for Lite prebuild - verifies everything works before EAS build

set -e  # Exit on any error

echo "🧪 Testing Lite Prebuild Script"
echo "================================"
echo ""

# Backup original app.json
echo "📋 Step 1: Backing up app.json..."
cp app.json app.json.backup

# Test 1: Run prebuild script with lite environment
echo ""
echo "🔧 Step 2: Running prebuild script with Lite environment..."
EAS_BUILD_PROFILE=production-lite EXPO_PUBLIC_ENABLE_MASTERMINDS=false node scripts/prebuild-lite.js

# Verify exit code
if [ $? -ne 0 ]; then
    echo "❌ FAILED: Script exited with non-zero code"
    mv app.json.backup app.json
    exit 1
fi
echo "✅ Script executed successfully"

# Test 2: Verify app.json changes
echo ""
echo "🔍 Step 3: Verifying app.json changes..."

NAME=$(grep -o '"name": "[^"]*"' app.json | cut -d'"' -f4)
PACKAGE=$(grep -o '"package": "[^"]*"' app.json | cut -d'"' -f4)
BUNDLE_ID=$(grep -o '"bundleIdentifier": "[^"]*"' app.json | cut -d'"' -f4)
ENABLE_MASTERMINDS=$(grep -o '"enableMasterminds": [^,}]*' app.json | cut -d':' -f2 | tr -d ' ')

echo "   App Name: $NAME"
echo "   Android Package: $PACKAGE"
echo "   iOS Bundle ID: $BUNDLE_ID"
echo "   Enable Masterminds: $ENABLE_MASTERMINDS"

if [ "$NAME" != "Balance Seekr Lite" ]; then
    echo "❌ FAILED: App name should be 'Balance Seekr Lite', got '$NAME'"
    mv app.json.backup app.json
    exit 1
fi

if [ "$PACKAGE" != "com.balanceseekr.app.lite" ]; then
    echo "❌ FAILED: Android package should be 'com.balanceseekr.app.lite', got '$PACKAGE'"
    mv app.json.backup app.json
    exit 1
fi

if [ "$BUNDLE_ID" != "com.balanceseekr.app.lite" ]; then
    echo "❌ FAILED: iOS bundle ID should be 'com.balanceseekr.app.lite', got '$BUNDLE_ID'"
    mv app.json.backup app.json
    exit 1
fi

if [ "$ENABLE_MASTERMINDS" != "false" ]; then
    echo "❌ FAILED: enableMasterminds should be false, got '$ENABLE_MASTERMINDS'"
    mv app.json.backup app.json
    exit 1
fi

echo "✅ All app.json changes verified correctly"

# Test 3: Verify slug is unchanged
echo ""
echo "🔍 Step 4: Verifying slug is unchanged (for EAS compatibility)..."
SLUG=$(grep -o '"slug": "[^"]*"' app.json | cut -d'"' -f4)

if [ "$SLUG" != "balance-seekr" ]; then
    echo "❌ FAILED: Slug should remain 'balance-seekr' for EAS compatibility, got '$SLUG'"
    mv app.json.backup app.json
    exit 1
fi

echo "✅ Slug correctly unchanged: $SLUG"

# Test 4: Restore and test non-lite build
echo ""
echo "🔄 Step 5: Testing non-lite build (should skip modification)..."
# Restore original app.json
sed -i '' 's/"name": "Balance Seekr Lite"/"name": "Balance Seekr"/' app.json
sed -i '' 's/"enableMasterminds": false/"enableMasterminds": true/' app.json
sed -i '' 's/"package": "com.balanceseekr.app.lite"/"package": "com.balanceseekr.app"/' app.json
sed -i '' 's/"bundleIdentifier": "com.balanceseekr.app.lite"/"bundleIdentifier": "com.balanceseekr.app"/' app.json
sed -i '' 's/"scheme": "balanceseekrlite"/"scheme": "balanceseekr"/' app.json

EAS_BUILD_PROFILE=production EXPO_PUBLIC_ENABLE_MASTERMINDS=true node scripts/prebuild-lite.js

ORIGINAL_NAME=$(grep -o '"name": "[^"]*"' app.json | cut -d'"' -f4)
if [ "$ORIGINAL_NAME" != "Balance Seekr" ]; then
    echo "❌ FAILED: Non-lite build should not modify app.json, but name changed to '$ORIGINAL_NAME'"
    exit 1
fi

echo "✅ Non-lite build correctly skipped modification"

# Test 5: Run lite build again to ensure idempotency
echo ""
echo "🔄 Step 6: Testing idempotency (running lite build twice)..."
EAS_BUILD_PROFILE=production-lite EXPO_PUBLIC_ENABLE_MASTERMINDS=false node scripts/prebuild-lite.js

NAME2=$(grep -o '"name": "[^"]*"' app.json | cut -d'"' -f4)
if [ "$NAME2" != "Balance Seekr Lite" ]; then
    echo "❌ FAILED: Second run should still produce 'Balance Seekr Lite', got '$NAME2'"
    if [ -f app.json.backup ]; then
        mv app.json.backup app.json
    fi
    exit 1
fi

echo "✅ Script is idempotent (can be run multiple times)"

# Restore original
echo ""
echo "🔄 Step 7: Restoring original app.json..."
if [ -f app.json.backup ]; then
    mv app.json.backup app.json
else
    # Restore manually if backup was overwritten
    sed -i '' 's/"name": "Balance Seekr Lite"/"name": "Balance Seekr"/' app.json
    sed -i '' 's/"enableMasterminds": false/"enableMasterminds": true/' app.json
    sed -i '' 's/"package": "com.balanceseekr.app.lite"/"package": "com.balanceseekr.app"/' app.json
    sed -i '' 's/"bundleIdentifier": "com.balanceseekr.app.lite"/"bundleIdentifier": "com.balanceseekr.app"/' app.json
    sed -i '' 's/"scheme": "balanceseekrlite"/"scheme": "balanceseekr"/' app.json
fi

echo ""
echo "✅✅✅ ALL TESTS PASSED ✅✅✅"
echo ""
echo "The prebuild script is ready for EAS build!"
echo "You can now safely run: npx eas-cli build --platform android --profile production-lite"

