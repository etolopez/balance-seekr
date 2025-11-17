# Fix: "Upload preset not found" Error

## Problem
Cloudinary can't find the upload preset name you specified in your `.env` file.

## Solution: Create the Upload Preset in Cloudinary

### Step 1: Log into Cloudinary Dashboard
1. Go to https://console.cloudinary.com/
2. Log in with your account

### Step 2: Navigate to Upload Settings
1. Click **Settings** (gear icon) in the top menu
2. Click **Upload** in the left sidebar
3. Scroll down to **Upload presets** section

### Step 3: Create New Upload Preset
1. Click **"Add upload preset"** button
2. Fill in the form:
   - **Preset name:** `mastermind_images` (or match what's in your `.env`)
   - **Signing mode:** Select **"Unsigned"** ⚠️ (This is CRITICAL for client-side uploads)
   - **Folder:** `mastermind-groups` (optional, for organization)
   - **Other settings:** Leave as default for now

3. Click **"Save"** or **"Save preset"**

### Step 4: Verify Preset Name
1. After saving, you'll see your preset in the list
2. **Copy the exact preset name** (it's case-sensitive!)
3. Make sure it matches exactly what's in your `.env` file

### Step 5: Update `.env` File (if needed)
Your `.env` should have:
```env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=duishv8t1
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=mastermind_images
```

**Important:** 
- The preset name must match **exactly** (case-sensitive)
- No spaces or special characters
- If you named it differently in Cloudinary, update your `.env` to match

### Step 6: Restart Expo
After creating the preset:
1. Stop Expo (Ctrl+C)
2. Restart: `npm start -- --clear`
3. Reload your app

## Common Issues

### Issue 1: Preset is "Signed" instead of "Unsigned"
**Fix:** Edit the preset in Cloudinary and change "Signing mode" to **"Unsigned"**

### Issue 2: Preset name has typos
**Fix:** Check both:
- The preset name in Cloudinary dashboard
- The `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` value in `.env`

They must match **exactly** (case-sensitive).

### Issue 3: Preset not saved
**Fix:** Make sure you clicked "Save" after creating the preset. It should appear in the list.

## Verify It's Working

After creating the preset and restarting:
1. Try uploading an image again
2. Check the console logs - you should see:
   ```
   [ImageService] Cloudinary config check: {...}
   ```
3. If successful, you'll get a Cloudinary URL back (starts with `https://res.cloudinary.com/...`)

## Still Having Issues?

1. **Double-check the preset name:**
   - Go to Cloudinary Dashboard → Settings → Upload
   - Find your preset in the list
   - Copy the exact name
   - Update `.env` to match exactly

2. **Verify it's unsigned:**
   - Click on your preset to edit
   - Make sure "Signing mode" is set to **"Unsigned"**

3. **Check Cloudinary account:**
   - Make sure you're logged into the correct Cloudinary account
   - The cloud name should match: `duishv8t1`

