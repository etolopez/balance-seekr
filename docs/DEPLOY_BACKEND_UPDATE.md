# Deploy Backend Update - Background Image Support

## Quick Deploy Steps

The backend code has been updated to support background images. You need to deploy these changes to Railway.

### Step 1: Commit and Push Changes

```bash
# From project root
cd backend
git add .
git commit -m "Add background image support for groups"
git push origin main
```

### Step 2: Railway Auto-Deployment

Railway should automatically detect the push and start deploying. You can:

1. **Check Railway Dashboard:**
   - Go to your Railway project
   - Click on your backend service
   - Check the "Deployments" tab
   - You should see a new deployment starting

2. **Monitor the Logs:**
   - Click on the service
   - Go to "Logs" tab
   - Watch for:
     - `[Server] Starting server...`
     - `[Server] Database initialized successfully`
     - `[Server] ✅ Server running on port...`

### Step 3: Database Migration

The database migration will run automatically when the server starts. The `initializeDatabase()` function will:
- Add the `background_image` column to the `groups` table (if it doesn't exist)
- This is safe to run multiple times (uses `IF NOT EXISTS`)

### Step 4: Verify Deployment

Once deployed, test the endpoint:

```bash
# Check if endpoint is available
curl https://your-railway-url.up.railway.app/

# You should see the new endpoint listed:
# "updateBackgroundImage": "PATCH /api/groups/:groupId/background-image"
```

### Step 5: Test in App

After deployment:
1. Restart your Expo app (or it will auto-reload)
2. Try editing a group's background image
3. The image should now save successfully

## What Changed

### Backend Files Modified:
- `backend/src/models/database.js` - Added `background_image` column
- `backend/src/models/group.js` - Added `updateGroupBackgroundImage()` function
- `backend/src/routes/groups.js` - Added `PATCH /api/groups/:groupId/background-image` endpoint

### Database Changes:
- New column: `background_image TEXT` in `groups` table
- Migration runs automatically on server start

## Troubleshooting

### "Endpoint not found" Error
- **Cause:** Backend hasn't been deployed yet
- **Fix:** Deploy the backend changes (steps above)

### Database Migration Fails
- **Cause:** Database connection issue or permissions
- **Fix:** Check Railway PostgreSQL service logs and ensure `DATABASE_URL` is set correctly

### Image Not Saving
- **Cause:** Backend endpoint not deployed or database column missing
- **Fix:** 
  1. Verify deployment completed successfully
  2. Check backend logs for errors
  3. Verify database migration ran (check logs for "Database initialized successfully")

## Quick Status Check

After deployment, you can verify everything is working:

```bash
# 1. Check server is running
curl https://your-railway-url.up.railway.app/health

# 2. Check endpoint is listed
curl https://your-railway-url.up.railway.app/ | grep background-image

# 3. Test the endpoint (replace GROUP_ID and OWNER_ADDRESS)
curl -X PATCH https://your-railway-url.up.railway.app/api/groups/GROUP_ID/background-image \
  -H "Content-Type: application/json" \
  -d '{"ownerAddress":"OWNER_ADDRESS","backgroundImage":"https://example.com/image.jpg"}'
```

