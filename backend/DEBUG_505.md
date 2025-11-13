# Debugging 505 Error on Railway

## Quick Diagnostic Steps

### 1. Check Railway Logs

Go to your Railway project → Backend service → **Logs** tab

Look for these messages:

**✅ Good signs:**
```
[Server] Starting server...
[Server] PORT: 3000
[Server] DATABASE_URL: Set
[Database] Connected to PostgreSQL
[Database] Tables initialized successfully
[Server] ✅ Server running on port 3000
```

**❌ Bad signs:**
```
[Server] Failed to start: ...
[Database] Query error: ...
[Database] Unexpected error on idle client: ...
```

### 2. Common Issues

#### Issue A: Database Connection Failed
**Logs show:** `[Database] Query error: ECONNREFUSED` or `Connection refused`

**Fix:**
1. Check PostgreSQL service is running (green status)
2. Verify `DATABASE_URL` is set in backend service variables
3. Check PostgreSQL logs for errors
4. Restart PostgreSQL service if needed

#### Issue B: Missing Environment Variables
**Logs show:** `DATABASE_URL: NOT SET`

**Fix:**
1. Go to backend service → Variables tab
2. Add `DATABASE_URL=${{Postgres.DATABASE_URL}}` (replace `Postgres` with your PostgreSQL service name)
3. Or Railway should auto-inject it - check if PostgreSQL service is linked

#### Issue C: Server Not Starting
**Logs show:** `[Server] Failed to start:` followed by an error

**Fix:**
- Check the specific error message
- Common causes:
  - Database connection issue (see Issue A)
  - Missing dependencies (check `package.json`)
  - Syntax errors in code

#### Issue D: Port Issues
**Logs show:** `Error: listen EADDRINUSE`

**Fix:**
- Railway handles ports automatically
- This shouldn't happen, but if it does, restart the service

### 3. Test Health Endpoint

Once you see `[Server] ✅ Server running on port 3000` in logs:

```bash
curl https://balance-seekr-production.up.railway.app/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "balance-seekr-backend"
}
```

**If still getting 505:**
- Wait 30-60 seconds after seeing "Server running" message
- Railway might still be routing traffic
- Check if there are multiple deployments (check Deployments tab)

### 4. Verify Service Configuration

In Railway backend service → Settings:

- **Root Directory:** `backend`
- **Start Command:** `npm start`
- **Build Command:** (empty or `npm install`)

### 5. Check Environment Variables

Backend service → Variables tab should have:

**Required:**
- `PORT` (Railway usually sets this automatically)
- `DATABASE_URL` (from PostgreSQL service)
- `NODE_ENV=production`

**Optional:**
- `SOLANA_RPC_URL`
- `SOLANA_CLUSTER`
- `CORS_ORIGIN`

### 6. Restart Everything

If nothing else works:

1. **Restart backend service:**
   - Go to backend service
   - Click "Restart" or "Redeploy"

2. **Restart PostgreSQL service:**
   - Go to PostgreSQL service
   - Click "Restart"

3. **Wait 2-3 minutes** for services to fully start

4. **Check logs again**

## What to Share for Help

If still not working, share:

1. **Last 50 lines of backend service logs**
2. **Last 20 lines of PostgreSQL service logs**
3. **Environment variables** (without sensitive values)
4. **Service configuration** (Root Directory, Start Command, etc.)

## Most Common Fix

**90% of the time**, the issue is:
1. Database connection failing
2. Missing `DATABASE_URL` environment variable

**Solution:**
1. Verify PostgreSQL is running
2. Add `DATABASE_URL=${{Postgres.DATABASE_URL}}` to backend service variables
3. Restart backend service

