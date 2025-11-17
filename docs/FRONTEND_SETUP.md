# Frontend Setup: Connecting to Backend API

## Quick Fix

The frontend needs to know where your backend API is located. You need to set the `EXPO_PUBLIC_API_URL` environment variable.

## ✅ Already Done

I've created a `.env` file in your project root with:
```
EXPO_PUBLIC_API_URL=https://balance-seekr-production.up.railway.app
```

## 🔄 Next Steps

### 1. Restart Your Expo App

**Important:** Expo only loads environment variables when the app starts. You need to:

1. **Stop your current Expo server** (press `Ctrl+C` in the terminal)
2. **Restart it:**
   ```bash
   npm start
   # or
   npx expo start
   ```

### 2. Clear Cache (If Needed)

If the environment variable still doesn't load:

```bash
npx expo start --clear
```

### 3. Verify It's Working

After restarting, you should see in the logs:
- No more "Backend not available" messages
- Username registration should work
- Public groups should load

## 📝 Manual Configuration (Alternative)

If `.env` doesn't work, you can also set it in `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://balance-seekr-production.up.railway.app"
    }
  }
}
```

Then update `api.service.ts` to use:
```typescript
this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 
               (global as any).expo?.extra?.apiUrl || 
               'https://api.solanaseeker.app';
```

## 🐛 Troubleshooting

### Environment Variable Not Loading?

1. **Check `.env` file exists** in project root (same level as `package.json`)
2. **Verify the URL** is correct (no trailing slash)
3. **Restart Expo** - environment variables are loaded at startup
4. **Clear cache:** `npx expo start --clear`

### Still Getting "Backend not available"?

1. **Test the backend directly:**
   ```bash
   curl https://balance-seekr-production.up.railway.app/health
   ```

2. **Check Railway logs** to ensure backend is running

3. **Verify CORS** - Make sure `CORS_ORIGIN=*` is set in Railway backend service

### Network Errors?

- Make sure your device/emulator can reach the internet
- Check if Railway URL is accessible from your network
- Verify the backend is deployed and running

## ✅ Success Indicators

When everything is working, you should:
- ✅ Be able to check username availability
- ✅ Register a username
- ✅ See public groups (even if empty)
- ✅ No "Backend not available" errors in logs

