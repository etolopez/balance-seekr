# Railway Deployment Guide

## Step 1: Create Railway Project

1. Go to [Railway](https://railway.app) and create a new project
2. Select "Deploy from GitHub repo"
3. Choose your `balance-seekr` repository
4. Railway will detect the backend folder automatically

## Step 2: Add PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically create a PostgreSQL database
3. Railway will automatically provide a `DATABASE_URL` variable - you don't need to set this manually

## Step 3: Configure Environment Variables

**Important:** Add these environment variables to your **backend service** (not the PostgreSQL service).

In Railway:
1. Click on your **backend service** (the Node.js service, not PostgreSQL)
2. Go to the "Variables" tab
3. Add the following environment variables:

### Required Variables:

**Note:** `DATABASE_URL` is automatically provided by Railway when you add the PostgreSQL service. You can reference it in your backend service, or Railway will automatically inject it.

```
PORT=3000
NODE_ENV=production
```

**Optional:** If you need to explicitly reference the database, you can add:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```
(Replace `Postgres` with your actual PostgreSQL service name)

### Solana Configuration:

```
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_CLUSTER=mainnet-beta
```

### Platform Configuration:

```
PLATFORM_PAYMENT_ADDRESS=EmjvdwMwS5WnAgHZaEdTQL3gpzbG3c9d3NryRj5En37e
PLATFORM_CREATE_FEE=0.01
PLATFORM_JOIN_FEE_PERCENTAGE=0.01
```

### CORS Configuration:

```
CORS_ORIGIN=*
```

Or set to your frontend domain:
```
CORS_ORIGIN=https://your-frontend-domain.com
```

## Step 4: Configure Service

### Finding the Settings:

1. **In your Railway project dashboard:**
   - You should see your services listed (backend service and PostgreSQL)
   - Click on your **backend service** (the one that says "Deploying from GitHub" or shows your repo name)

2. **Once you're in the service view:**
   - Look for the **"Settings"** tab at the top (next to "Deployments", "Metrics", "Variables", etc.)
   - Click on **"Settings"**

3. **In the Settings page, you'll find:**
   - **Service Name** (you can rename it if you want)
   - **Root Directory** - This is what you need to set!
   - **Build Command** - Usually auto-detected
   - **Start Command** - This is what you need to set!

### Configuration Steps:

1. **Set Root Directory:**
   - In the Settings page, find the **"Root Directory"** field
   - Enter: `backend`
   - This tells Railway to look for your `package.json` in the `backend` folder

2. **Set Start Command:**
   - Find the **"Start Command"** field
   - Enter: `npm start`
   - This tells Railway how to start your server

3. **Save Changes:**
   - Click **"Save"** or the changes will auto-save
   - Railway will automatically redeploy with the new settings

### Alternative: If you can't find Settings tab

If you don't see a Settings tab, Railway might be using the newer interface. Try these methods:

**Method 1: Direct URL**
- After clicking on your service, the URL should be something like: `https://railway.app/project/[project-id]/service/[service-id]`
- Add `/settings` to the end: `https://railway.app/project/[project-id]/service/[service-id]/settings`

**Method 2: Service Overview Page**
1. Click on your **backend service**
2. Look at the top of the page for tabs: **Deployments**, **Metrics**, **Variables**, **Settings**
3. If you see tabs, click **"Settings"**
4. If you don't see tabs, look for:
   - A **gear icon (⚙️)** in the top right
   - A **"Configure"** button
   - A **three-dot menu (⋯)** with a "Settings" option
   - Or the fields might be directly editable on the main service page

**Method 3: Using railway.json (Automatic)**
If you still can't find it, Railway should automatically use the `railway.json` file we created, which specifies:
- Root directory: `backend`
- Start command: `npm start`

So you might not need to manually configure it! Check the deployment logs to see if it's working correctly.

### What Railway Auto-Detects:

- **Node.js version** - Railway will detect from your `package.json`
- **Dependencies** - Railway will run `npm install` automatically
- **Build process** - Usually not needed for this simple backend

**Note:** If Railway doesn't auto-detect Node.js, you might need to add a `nixpacks.toml` or ensure your `package.json` is in the root directory that Railway is looking at.

## Step 5: Deploy

1. Railway will automatically deploy when you push to GitHub
2. Or click "Deploy" in the Railway dashboard
3. Check the logs to ensure the database initializes correctly

## Step 6: Get Your API URL

1. Once deployed, Railway will provide a public URL
2. Copy this URL (e.g., `https://your-app.railway.app`)
3. Update your frontend `.env` file:
   ```
   EXPO_PUBLIC_API_URL=https://your-app.railway.app
   ```

## Troubleshooting

### PostgreSQL Service Error: "failed to exec pid1: No such file or directory"

This is a known Railway infrastructure issue with PostgreSQL services. Try these solutions:

**Solution 1: Restart the PostgreSQL Service**
1. Go to your Railway project dashboard
2. Click on your **PostgreSQL service**
3. Click the **"Restart"** button (or look for a restart option in the service menu)
4. Wait a few minutes for it to restart

**Solution 2: Recreate the PostgreSQL Service (RECOMMENDED if restart doesn't work)**

This is the most reliable fix for this error:

1. **Delete the current PostgreSQL service:**
   - Go to your Railway project dashboard
   - Click on your **PostgreSQL service**
   - Look for a **"Delete"** or **"Remove"** button (usually in Settings or a dropdown menu)
   - Confirm deletion (⚠️ This will delete all data, but since you're just starting, this is fine)

2. **Create a new PostgreSQL service:**
   - In your Railway project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway will create a fresh PostgreSQL instance
   - Wait 1-2 minutes for it to fully initialize

3. **Verify the new service:**
   - Check the logs - you should see "PostgreSQL is ready to accept connections" instead of errors
   - The service status should show "Running" (green)

4. **Update DATABASE_URL (if needed):**
   - Railway automatically provides `DATABASE_URL` to your backend service
   - If you had manually set `DATABASE_URL=${{Postgres.DATABASE_URL}}`, you may need to update the service name
   - Or just remove the manual `DATABASE_URL` variable and let Railway auto-inject it

**Solution 3: Check Railway Status**
- Visit [Railway Status](https://status.railway.app) to see if there are any ongoing issues
- This error sometimes occurs during Railway infrastructure updates

**Solution 4: Wait and Retry**
- Sometimes this error resolves itself after a few minutes
- Check back in 5-10 minutes to see if the service has recovered

**Note:** This error is **not** related to your code or configuration - it's a Railway infrastructure issue with the PostgreSQL container.

### Database Connection Issues
- Verify `DATABASE_URL` is correctly set
- Check that PostgreSQL service is running (should show "Running" status)
- Ensure the database is accessible from your service
- If you recreated PostgreSQL, make sure to update `DATABASE_URL` reference in your backend service

### Payment Verification Failing
- Verify `SOLANA_RPC_URL` is correct
- Check that `PLATFORM_PAYMENT_ADDRESS` is a valid Solana address
- Ensure transactions are on the correct network (mainnet/testnet)

### CORS Issues
- Update `CORS_ORIGIN` to match your frontend domain
- For development, you can use `*` (not recommended for production)

