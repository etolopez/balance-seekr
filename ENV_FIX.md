# Environment Variable Fix

## The Problem

Expo doesn't automatically load `.env` files. Environment variables need to be:
1. Prefixed with `EXPO_PUBLIC_` 
2. Available at build time
3. Or set in `app.json` under `expo.extra`

## ✅ What I've Done

1. **Updated `app.json`** - Added API URL to `expo.extra.apiUrl` as a fallback
2. **Updated `api.service.ts`** - Now checks multiple sources:
   - `process.env.EXPO_PUBLIC_API_URL` (from .env)
   - `Constants.expoConfig.extra.apiUrl` (from app.json)
   - Default fallback

3. **Added debugging** - Logs which source is being used

## 🔄 Next Steps

### Option 1: Use app.json (Recommended - Already Done ✅)

The API URL is now in `app.json` under `expo.extra.apiUrl`. This will work immediately.

**Restart your Expo server:**
```bash
# Stop current server (Ctrl+C)
npm start -- --clear
```

### Option 2: Use .env with Expo Config Plugin

If you want to use `.env` files, you need to install `expo-constants` (already installed) and ensure the variable is loaded.

**Verify .env file:**
```bash
cat .env
```

Should show:
```
EXPO_PUBLIC_API_URL=https://balance-seekr-production.up.railway.app
```

**Restart Expo:**
```bash
npm start -- --clear
```

## 🔍 Debugging

After restarting, check the logs. You should see:
```
[ApiService] Base URL: https://balance-seekr-production.up.railway.app
[ApiService] EXPO_PUBLIC_API_URL from process.env: undefined (or the URL)
[ApiService] apiUrl from Constants.expoConfig.extra: https://balance-seekr-production.up.railway.app
[ApiService] Using: Constants.expoConfig.extra (or process.env)
```

## ✅ Current Configuration

- ✅ `app.json` has `expo.extra.apiUrl` set
- ✅ `api.service.ts` checks both sources
- ✅ Debugging logs added
- ✅ `.env` file exists (backup method)

## 🚀 Test

After restarting, the API should connect. Check logs for:
- No "Backend not available" errors
- `[ApiService] Base URL:` showing the correct Railway URL
- Username registration working

