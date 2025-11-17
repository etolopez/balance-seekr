# Fix: Remove Secrets and Use Environment Variables

## The Problem

Railway is trying to read `X_BEARER_TOKEN` from a file during build:
```
failed to stat /tmp/railpack-build-.../secrets/X_BEARER_TOKEN
```

This happens when credentials are added as **"Secrets"** instead of **"Environment Variables"**.

## Solution: Remove Secrets and Add as Environment Variables

### Step 1: Remove All Secrets

1. Go to [Railway Dashboard](https://railway.app)
2. Select your **backend service** (not PostgreSQL)
3. Click on **"Variables"** tab
4. Look for a **"Secrets"** section or any variables marked as secrets
5. **Delete ALL of these:**
   - `X_BEARER_TOKEN` (if it's a secret)
   - `X_ACCESS_TOKEN` (if it's a secret)
   - `X_ACCESS_TOKEN_SECRET` (if it's a secret)

### Step 2: Add as Environment Variables

1. Still in the **"Variables"** tab
2. Click **"New Variable"** (or **"Add Variable"**)
3. Add each one as a **regular environment variable**:

**Variable 1:**
- **Key/Name**: `X_BEARER_TOKEN`
- **Value**: `<your_bearer_token_here>` ⚠️ **DO NOT use actual token**
- **Type**: Make sure it's **"Environment Variable"** (NOT "Secret")

**Variable 2:**
- **Key/Name**: `X_ACCESS_TOKEN`
- **Value**: `<your_access_token_here>` ⚠️ **DO NOT use actual token**
- **Type**: **"Environment Variable"**

**Variable 3:**
- **Key/Name**: `X_ACCESS_TOKEN_SECRET`
- **Value**: `<your_access_token_secret_here>` ⚠️ **DO NOT use actual token**
- **Type**: **"Environment Variable"**

### Step 3: Verify

After adding:
- Variables should appear in the main **"Variables"** list
- They should NOT be in a "Secrets" section
- Railway will automatically redeploy

### Step 4: Check Build Logs

After redeployment, the build should succeed. You should see:
- ✅ Build completes
- ✅ Server starts
- ✅ No "failed to stat secrets" errors

## How to Tell the Difference in Railway UI

**Environment Variables:**
- Appear in the main **"Variables"** tab
- Can be edited directly
- Used during build and runtime
- ✅ **This is what we need**

**Secrets:**
- May appear in a separate **"Secrets"** section
- Railway tries to read from files during build
- Causes the error you're seeing
- ❌ **This is the problem**

## If Railway UI Only Shows "Secrets"

Some Railway interfaces might only show "Secrets" for sensitive data. If that's the case:

1. **Try the web interface** (not mobile app)
2. **Look for a toggle** to switch between "Secrets" and "Variables"
3. **Check Settings** - there might be an option to use environment variables
4. **Contact Railway Support** - they can help convert secrets to env vars

## Alternative: Make Variables Optional During Build

If Railway absolutely requires secrets, we can modify the code to make X API credentials optional during build (they're only needed at runtime). But this is a workaround - using environment variables is the correct solution.

## Quick Checklist

- [ ] Removed all X-related secrets from Railway
- [ ] Added `X_BEARER_TOKEN` as Environment Variable
- [ ] Added `X_ACCESS_TOKEN` as Environment Variable  
- [ ] Added `X_ACCESS_TOKEN_SECRET` as Environment Variable
- [ ] Verified they appear in "Variables" (not "Secrets")
- [ ] Railway redeployed
- [ ] Build succeeded (no "failed to stat secrets" error)

## Still Having Issues?

If you can't find where to switch from Secrets to Environment Variables:

1. **Screenshot your Railway Variables tab** - I can help identify the issue
2. **Check Railway documentation** - They may have updated their UI
3. **Try deleting and re-adding** - Sometimes recreating variables fixes the type

