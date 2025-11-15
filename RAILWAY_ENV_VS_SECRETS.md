# Railway: Environment Variables vs Secrets

## The Issue

Railway has two ways to store sensitive data:
1. **Environment Variables** - Regular env vars (what we need)
2. **Secrets** - File-based secrets (causes build errors)

The error you're seeing means the credentials were added as "Secrets" instead of "Environment Variables".

## Solution: Use Environment Variables

### Step 1: Remove Secrets (if any)

1. Go to Railway dashboard
2. Select your **backend service**
3. Go to **"Variables"** tab
4. If you see any variables marked as "Secrets" or in a "Secrets" section, **delete them**

### Step 2: Add as Environment Variables

1. In the **"Variables"** tab, click **"New Variable"**
2. Add each credential as a **regular environment variable** (not a secret):

**Variable 1:**
- **Name**: `X_BEARER_TOKEN`
- **Value**: `<your_bearer_token_here>` ⚠️ **DO NOT use actual token**
- **Type**: Environment Variable (not Secret)

**Variable 2:**
- **Name**: `X_ACCESS_TOKEN`
- **Value**: `<your_access_token_here>` ⚠️ **DO NOT use actual token**
- **Type**: Environment Variable (not Secret)

**Variable 3:**
- **Name**: `X_ACCESS_TOKEN_SECRET`
- **Value**: `<your_access_token_secret_here>` ⚠️ **DO NOT use actual token**
- **Type**: Environment Variable (not Secret)

### Step 3: Verify

After adding the variables:
- They should appear in the "Variables" list (not in a "Secrets" section)
- Railway will automatically redeploy
- The build should succeed

## How to Tell the Difference

**Environment Variables:**
- Appear in the main "Variables" tab
- Accessible via `process.env.VARIABLE_NAME`
- Work during build and runtime
- ✅ **This is what we need**

**Secrets:**
- May appear in a separate "Secrets" section
- Railway tries to read them from files during build
- Can cause build errors like the one you saw
- ❌ **Not what we need for this use case**

## Alternative: If Railway Forces Secrets

If Railway's UI only offers "Secrets" for sensitive data:

1. **Check Railway Settings**: Some Railway plans/features use secrets by default
2. **Use Reference Syntax**: Try using `${{Secrets.X_BEARER_TOKEN}}` in a regular env var
3. **Contact Railway Support**: If the issue persists, it might be a Railway configuration issue

## Quick Fix Checklist

- [ ] Removed any "Secrets" entries
- [ ] Added `X_BEARER_TOKEN` as Environment Variable
- [ ] Added `X_ACCESS_TOKEN` as Environment Variable
- [ ] Added `X_ACCESS_TOKEN_SECRET` as Environment Variable
- [ ] Verified variables appear in "Variables" tab (not "Secrets")
- [ ] Railway redeployed successfully
- [ ] Build completed without errors

