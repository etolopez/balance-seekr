# Railway SIGTERM Error Fix

## The Problem

Your backend is receiving `SIGTERM` (process termination signal), which means Railway is killing the process. This usually happens when:

1. **Database connection fails** - Most common cause
2. **Missing DATABASE_URL** - Railway can't connect to PostgreSQL
3. **Database service not linked** - Backend can't find the database
4. **Startup errors** - Code crashes during initialization

## What I Fixed

✅ **Removed immediate `process.exit(-1)`** on database errors  
✅ **Added database connection test** before starting server  
✅ **Better error logging** to see exactly what's failing  
✅ **Clear error messages** with troubleshooting steps  

## Next Steps

### 1. Check Railway Logs

After the next deployment, check the Railway logs. You should now see detailed error messages like:

```
[Server] ❌ DATABASE_URL is not set!
```

or

```
[Server] ❌ Database connection failed: ...
```

### 2. Verify Database Service

1. Go to Railway dashboard
2. Check that you have **two services**:
   - ✅ **PostgreSQL** service (database)
   - ✅ **Backend** service (Node.js app)

3. **Link the services** (if not already linked):
   - Click on your **Backend** service
   - Go to **"Settings"** tab
   - Under **"Service Dependencies"**, add the PostgreSQL service
   - This ensures `DATABASE_URL` is automatically provided

### 3. Check DATABASE_URL

1. In your **Backend** service, go to **"Variables"** tab
2. Look for `DATABASE_URL`
3. It should be automatically set by Railway (if services are linked)
4. If missing, add it manually:
   - Go to your **PostgreSQL** service
   - Copy the `DATABASE_URL` from there
   - Add it to your **Backend** service variables

### 4. Verify Database is Running

1. Check your **PostgreSQL** service logs
2. Look for any errors or connection issues
3. The logs should show normal PostgreSQL activity

### 5. Common Issues

#### Issue: "DATABASE_URL is not set"

**Solution:**
- Link the PostgreSQL service to your backend service
- Or manually add `DATABASE_URL` to backend variables

#### Issue: "Database connection failed: connection refused"

**Solution:**
- Ensure PostgreSQL service is running
- Check that services are linked
- Verify `DATABASE_URL` format is correct

#### Issue: "Database connection failed: password authentication failed"

**Solution:**
- Railway should handle this automatically
- If manual, check the `DATABASE_URL` format

## Testing

After fixing the issue, the logs should show:

```
[Server] Starting server...
[Server] PORT: 3000
[Server] NODE_ENV: production
[Server] DATABASE_URL: postgresql://... (hidden)
[Server] Testing database connection...
[Server] ✅ Database connection successful
[Server] Database time: 2025-11-15T20:03:10.970Z
[Server] Initializing database tables...
[Server] ✅ Database initialized successfully
[Server] ✅ Server running on port 3000
```

## If It Still Fails

1. **Check the full error message** in Railway logs
2. **Copy the error** and share it
3. **Verify**:
   - PostgreSQL service is running
   - Services are linked
   - `DATABASE_URL` is set
   - No syntax errors in code

## Quick Checklist

- [ ] PostgreSQL service exists and is running
- [ ] Backend service exists
- [ ] Services are linked (or `DATABASE_URL` is manually set)
- [ ] `DATABASE_URL` appears in backend variables
- [ ] No errors in PostgreSQL logs
- [ ] Code changes deployed to Railway
- [ ] Check new detailed error logs

