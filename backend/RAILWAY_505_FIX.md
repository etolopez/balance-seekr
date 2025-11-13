# Fix: 505/502/503 Error on Railway

## Common Causes

A 505/502/503 error usually means the server isn't starting correctly. Here's how to diagnose and fix it:

## Step 1: Check Railway Logs

1. Go to your Railway project
2. Click on your **backend service**
3. Go to the **"Logs"** tab
4. Look for error messages

Common errors you might see:
- `[Server] Failed to start:` - Database connection issue
- `[Database] Query error:` - Database initialization failed
- `Error: listen EADDRINUSE` - Port conflict
- `Cannot find module` - Missing dependencies

## Step 2: Verify Server is Listening Correctly

**✅ FIXED:** The server now listens on `0.0.0.0` which is required for Railway.

Check your logs for:
```
[Server] Server running on port 3000
[Server] Database initialized
```

If you see these, the server is running correctly.

## Step 3: Check Environment Variables

Make sure these are set in Railway (backend service → Variables tab):

### Required:
- `PORT=3000` (Railway usually sets this automatically, but verify)
- `NODE_ENV=production`
- `DATABASE_URL` (should be auto-provided by PostgreSQL service)

### Optional but Recommended:
- `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`
- `SOLANA_CLUSTER=mainnet-beta`
- `CORS_ORIGIN=*`

## Step 4: Verify Database Connection

Check logs for:
- ✅ `[Database] Connected to PostgreSQL`
- ✅ `[Database] Tables initialized successfully`

If you see database errors:
1. Check PostgreSQL service is running (should show "Running" status)
2. Verify `DATABASE_URL` is set correctly
3. Check PostgreSQL logs for issues

## Step 5: Test Health Endpoint

Once the server is running, test:
```bash
curl https://balance-seekr-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "balance-seekr-backend"
}
```

## Common Issues & Solutions

### Issue 1: Database Connection Failed
**Error in logs:** `[Database] Query error: ECONNREFUSED`

**Solution:**
- Verify PostgreSQL service is running
- Check `DATABASE_URL` is set
- Restart PostgreSQL service if needed

### Issue 2: Server Not Starting
**Error in logs:** `[Server] Failed to start:`

**Solution:**
- Check all environment variables are set
- Verify database connection works
- Check for syntax errors in code

### Issue 3: Port Already in Use
**Error:** `Error: listen EADDRINUSE: address already in use`

**Solution:**
- Railway handles ports automatically, this shouldn't happen
- If it does, restart the service

### Issue 4: Missing Dependencies
**Error:** `Cannot find module 'express'`

**Solution:**
- Railway should auto-install, but check:
  - `package.json` exists in `backend/` folder
  - Dependencies are listed correctly
  - Root directory is set to `backend`

## Step 6: Redeploy

After making changes:
1. Push changes to GitHub (if you updated code)
2. Or manually trigger redeploy in Railway
3. Watch the logs during deployment
4. Wait for "Server running on port..." message

## Still Not Working?

1. **Check Railway Status:** https://status.railway.app
2. **Restart the service** in Railway dashboard
3. **Check the exact error** in logs and share it for debugging
4. **Verify root directory** is set to `backend` in Railway settings

## Quick Checklist

- [ ] Server logs show "Server running on port..."
- [ ] Database logs show "Connected to PostgreSQL"
- [ ] Environment variables are set
- [ ] PostgreSQL service is running
- [ ] Health endpoint returns JSON response
- [ ] No errors in Railway logs

