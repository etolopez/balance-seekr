# X OAuth Setup Guide

## The Error

The backend is returning "Failed to initiate X OAuth" because `X_API_KEY` and `X_API_SECRET` are missing.

## Required Credentials

For X OAuth to work, you need **three** different credentials from your X Developer Portal:

1. **X_API_KEY** (Consumer Key) - Required for OAuth
2. **X_API_SECRET** (Consumer Secret) - Required for OAuth  
3. **X_BEARER_TOKEN** - Already added, used for API v2 calls

## How to Get These

1. Go to [X Developer Portal](https://developer.twitter.com/)
2. Select your App/Project
3. Go to **"Keys and tokens"** tab
4. You'll see:
   - **API Key** (this is `X_API_KEY`)
   - **API Secret** (this is `X_API_SECRET`)
   - **Bearer Token** (already added as `X_BEARER_TOKEN`)

## Add to Railway

1. Go to Railway → Your backend service → **Variables** tab
2. Add these two new variables:

**Variable 1:**
- **Name**: `X_API_KEY`
- **Value**: Your API Key from X Developer Portal

**Variable 2:**
- **Name**: `X_API_SECRET`
- **Value**: Your API Secret from X Developer Portal

3. Railway will automatically redeploy

## Verify Setup

After adding the variables, check Railway logs. You should see:
```
[Auth] X OAuth authorize request received
[Auth] X_API_KEY present: true
[Auth] X_API_SECRET present: true
```

If you see `false` for either, the variable wasn't set correctly.

## Important Notes

- **API Key and Secret are different from Access Token and Secret**
- You need the **Consumer** credentials (API Key/Secret), not the Access Token credentials
- These are safe to add as environment variables (not secrets) - Railway won't treat them as secrets

## After Setup

Once both `X_API_KEY` and `X_API_SECRET` are added:
1. Railway will redeploy automatically
2. Try the "Sync with X" button again
3. It should open X authentication in your browser
4. After authorizing, your X username will be automatically synced

