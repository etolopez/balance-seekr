#!/bin/bash

# Build Production APK for Balance Seekr
# This script will guide you through the EAS build process

echo "🚀 Starting EAS Build for Balance Seekr"
echo ""

# Check if EAS CLI is available
if ! command -v eas &> /dev/null && ! command -v npx &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Check login status
echo "📋 Checking EAS login status..."
npx eas-cli whoami

if [ $? -ne 0 ]; then
    echo "❌ Not logged in. Please run: npx eas-cli login"
    exit 1
fi

echo ""
echo "✅ Logged in to EAS"
echo ""

# Initialize EAS project if needed
if [ ! -f ".easrc" ]; then
    echo "⚙️  Initializing EAS project..."
    echo "   (This will prompt you to create/link a project)"
    npx eas-cli init
fi

echo ""
echo "🔨 Starting production build..."
echo "   This will take 15-30 minutes"
echo ""

# Start the build
npx eas-cli build --platform android --profile production

echo ""
echo "✅ Build started! Check progress at: https://expo.dev"
echo "   You'll receive a notification when the build completes."

