# How to Run Expo with Backend API

## ✅ Quick Fix - Create .env File

The `.env` file has been created with your Railway backend URL.

## 🚀 Correct Commands to Run Expo

### For Development (with backend):

```bash
# Option 1: Standard start (recommended)
npm start

# Option 2: Start with cleared cache (if env vars not loading)
EXPO_ROUTER_APP_ROOT=src/app npx expo start --clear

# Option 3: Start for Android specifically
npm run android

# Option 4: Start for iOS specifically  
npm run ios
```

### Important Notes:

1. **Environment variables load at startup** - You must restart Expo after creating/updating `.env`
2. **Clear cache if needed** - Use `--clear` flag if environment variables aren't loading
3. **Stop current server first** - Press `Ctrl+C` to stop, then restart

## 📋 Step-by-Step Process

### Step 1: Create .env File (Already Done ✅)

The `.env` file should contain:
```
EXPO_PUBLIC_API_URL=https://balance-seekr-production.up.railway.app
```

### Step 2: Stop Current Expo Server

If Expo is running, press `Ctrl+C` in the terminal to stop it.

### Step 3: Start Expo with Clear Cache

```bash
npm start -- --clear
```

Or use the full command:
```bash
EXPO_ROUTER_APP_ROOT=src/app npx expo start --clear
```

### Step 4: Verify Environment Variable is Loaded

After starting, you can verify by checking the logs. You should NOT see:
- ❌ "Backend not available" errors
- ❌ "Network request failed" errors

Instead, you should see:
- ✅ API calls succeeding
- ✅ Username registration working
- ✅ Public groups loading

## 🔍 Verify .env File

Check that the file exists and has the correct content:

```bash
cat .env
```

Should show:
```
EXPO_PUBLIC_API_URL=https://balance-seekr-production.up.railway.app
```

## 🐛 Troubleshooting

### If environment variable still doesn't load:

1. **Verify .env file location:**
   - Must be in project root (same level as `package.json`)
   - Not in `src/` or any subdirectory

2. **Check file permissions:**
   ```bash
   ls -la .env
   ```

3. **Try explicit environment variable:**
   ```bash
   EXPO_PUBLIC_API_URL=https://balance-seekr-production.up.railway.app npm start -- --clear
   ```

4. **Alternative: Use app.json (if .env doesn't work):**
   - Add to `app.json`:
   ```json
   {
     "expo": {
       "extra": {
         "apiUrl": "https://balance-seekr-production.up.railway.app"
       }
     }
   }
   ```
   - Then update `api.service.ts` to check `expo.extra.apiUrl` as fallback

## 📱 Production Build

For production builds (EAS Build), you'll need to:

1. **Set environment variables in EAS:**
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://balance-seekr-production.up.railway.app
   ```

2. **Or use eas.json:**
   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_API_URL": "https://balance-seekr-production.up.railway.app"
         }
       }
     }
   }
   ```

## ✅ Success Checklist

- [ ] `.env` file exists in project root
- [ ] `.env` contains `EXPO_PUBLIC_API_URL=https://balance-seekr-production.up.railway.app`
- [ ] Stopped current Expo server
- [ ] Started Expo with `npm start -- --clear`
- [ ] No "Backend not available" errors in logs
- [ ] Can register username
- [ ] Can see public groups (even if empty)

