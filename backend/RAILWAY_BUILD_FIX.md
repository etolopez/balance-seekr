# Fix: "buildCommand and startCommand cannot be the same"

## Quick Fix

Railway is detecting `npm start` as both the build and start command. Here's how to fix it:

### Step 1: Update railway.json (Already Done ✅)

The `railway.json` file has been updated to remove the build section. It now only specifies the `startCommand`.

### Step 2: Check Railway Dashboard Settings

You also need to verify/update the settings in Railway's dashboard:

1. **Go to your Railway project**
2. **Click on your backend service**
3. **Go to the "Settings" tab** (or look for a gear icon ⚙️)
4. **Find the "Build & Deploy" section**
5. **Look for "Build Command" field:**
   - If it's set to `npm start`, **clear it** (leave it empty)
   - Or set it to `npm install` (to install dependencies)
6. **Verify "Start Command" is set to:**
   - `npm start`
7. **Check "Root Directory" is set to:**
   - `backend`
8. **Save the changes**

### Step 3: Redeploy

After saving:
- Railway will automatically redeploy
- Or manually trigger a redeploy from the "Deployments" tab

### Alternative: If You Can't Find Settings

If you're using Railway's newer interface:

1. **Click on your service**
2. **Look for a "Configure" button** or **three-dot menu (⋯)**
3. **Find "Build Settings"** or **"Deploy Settings"**
4. **Clear the Build Command** (or set to `npm install`)
5. **Set Start Command** to `npm start`

## Why This Happens

Railway auto-detects build commands for Node.js projects. Sometimes it incorrectly sets both `buildCommand` and `startCommand` to the same value (`npm start`), which Railway doesn't allow.

## Solution Summary

- ✅ **railway.json** - Updated (no build section)
- ⚠️ **Railway Dashboard** - You need to clear/update the Build Command manually

After making these changes, your deployment should work correctly!

