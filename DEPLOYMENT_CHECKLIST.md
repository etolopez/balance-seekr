# Deployment Checklist

## ✅ Pre-Deployment Checks

- [x] Code changes committed and pushed to GitHub
- [x] X API credentials made optional during build (workaround for Railway secrets)
- [x] Database connection error handling improved
- [x] Better logging added for debugging

## 🚀 Railway Deployment

Railway should automatically deploy when you push to the main branch. Here's what to check:

### 1. Check Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app)
2. Select your **backend service**
3. Check the **"Deployments"** tab
4. You should see a new deployment in progress or completed

### 2. Monitor Build Logs

1. In Railway, go to your **backend service**
2. Click on the **"Deployments"** tab
3. Click on the latest deployment
4. Check the **build logs** for:
   - ✅ `npm install` completes successfully
   - ✅ No "failed to stat secrets" errors
   - ✅ Server starts successfully
   - ✅ Database connection successful

### 3. Check Runtime Logs

After build completes, check **"Logs"** tab for:
- ✅ `[Server] Starting server...`
- ✅ `[Server] DATABASE_URL: ... (hidden)`
- ✅ `[Server] Testing database connection...`
- ✅ `[Server] ✅ Database connection successful`
- ✅ `[Server] ✅ Database initialized successfully`
- ✅ `[Server] ✅ Server running on port 3000`

### 4. Test Health Endpoint

Once deployed, test the health endpoint:

```bash
curl https://balance-seekr-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T...",
  "service": "balance-seekr-backend"
}
```

### 5. Test Root Endpoint

```bash
curl https://balance-seekr-production.up.railway.app/
```

Should return API information with all available endpoints.

## 🔧 If Build Fails

### Error: "failed to stat secrets/X_BEARER_TOKEN"

**Solution:** The workaround should prevent this, but if it still happens:
1. Check Railway logs for the exact error
2. Verify X variables are in "Variables" tab (not "Secrets")
3. Try deleting and recreating X variables

### Error: "DATABASE_URL is not set"

**Solution:**
1. Ensure PostgreSQL service is running
2. Link PostgreSQL service to backend service
3. Or manually add `DATABASE_URL` to backend variables

### Error: "Database connection failed"

**Solution:**
1. Check PostgreSQL service is running
2. Verify `DATABASE_URL` is correct
3. Check PostgreSQL logs for errors

## ✅ Post-Deployment Verification

Once deployed successfully:

1. **Health Check:**
   ```bash
   curl https://balance-seekr-production.up.railway.app/health
   ```

2. **Test X Sync Endpoint** (should work even without credentials):
   ```bash
   curl -X POST https://balance-seekr-production.up.railway.app/api/users/x-sync \
     -H "Content-Type: application/json" \
     -d '{
       "userAddress": "YOUR_WALLET_ADDRESS",
       "xHandle": "testuser"
     }'
   ```

3. **Check Frontend Connection:**
   - Verify `EXPO_PUBLIC_API_URL` in frontend points to Railway URL
   - Test app functionality

## 📝 Environment Variables Checklist

Ensure these are set in Railway (backend service → Variables):

- [x] `DATABASE_URL` (auto-provided by PostgreSQL service)
- [x] `PORT` (usually auto-set by Railway)
- [x] `NODE_ENV=production`
- [x] `SOLANA_RPC_URL`
- [x] `SOLANA_CLUSTER`
- [x] `PLATFORM_PAYMENT_ADDRESS`
- [x] `X_BEARER_TOKEN` (optional - only needed at runtime)
- [x] `X_ACCESS_TOKEN` (optional - only needed at runtime)
- [x] `X_ACCESS_TOKEN_SECRET` (optional - only needed at runtime)

## 🎉 Success Indicators

- ✅ Build completes without errors
- ✅ Server starts and listens on port
- ✅ Database connection successful
- ✅ Health endpoint returns 200 OK
- ✅ No SIGTERM errors in logs

