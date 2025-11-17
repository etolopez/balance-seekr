# Railway GitHub Integration Setup Guide

This guide will help you connect your Railway account to your GitHub repository.

## Step 1: Connect GitHub to Railway

1. **Log in to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign in with your Railway account

2. **Authorize GitHub**
   - Click on your profile icon (top right)
   - Go to **Settings** → **Connections**
   - Click **Connect GitHub** or **Add GitHub**
   - You'll be redirected to GitHub to authorize Railway
   - Click **Authorize Railway** (or similar button)
   - Grant Railway access to your repositories (you can choose all repos or specific ones)

## Step 2: Create a New Project

1. **Start New Project**
   - In Railway dashboard, click **New Project**
   - Select **Deploy from GitHub repo**
   - You'll see a list of your GitHub repositories
   - Find and select `solana-seeker` (or your repository name)

2. **Configure the Project**
   - Railway will automatically detect your project type
   - For a React Native/Expo app, Railway might not be the right choice for the mobile app itself
   - **Note**: Railway is best for deploying backend APIs, not mobile apps

## Step 3: Understanding Your Setup

Based on your project structure:
- **Mobile App**: This is a React Native/Expo app that runs on devices
- **Backend API**: You'll need to deploy the backend API (see `BACKEND_DEPLOYMENT_GUIDE.md`)

### If you're deploying a backend API:

1. **Create Backend Directory** (if not already created)
   ```bash
   mkdir solana-seeker-backend
   cd solana-seeker-backend
   ```

2. **Follow the Backend Deployment Guide**
   - See `BACKEND_DEPLOYMENT_GUIDE.md` for detailed instructions
   - Railway is recommended as Option 1 in that guide

3. **Deploy Backend to Railway**
   - Create a new Railway project
   - Connect your GitHub repo (or create a separate backend repo)
   - Railway will auto-detect Node.js/Express backend
   - Add PostgreSQL database from Railway dashboard
   - Set environment variables (see guide)

### If you're just connecting the repo:

1. **Repository is now connected**
   - Railway can now access your GitHub repository
   - You can deploy services from this repo
   - Each service in Railway can be connected to a different branch/directory

## Step 4: Environment Variables (For Backend)

If deploying a backend API, set these in Railway:

```
DATABASE_URL=<railway-postgres-url>
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PLATFORM_PAYMENT_ADDRESS=BWg1ZSZqvmXdUSuuXbssBM9Qjgyo3mzJrQap7KuQ8mZZ
PLATFORM_CREATE_FEE=0.01
PLATFORM_JOIN_FEE_PERCENTAGE=0.01
PORT=3000
NODE_ENV=production
```

## Step 5: Automatic Deployments

Once connected:
- Railway will automatically deploy on every push to your main branch
- You can configure which branch to deploy from in project settings
- View deployment logs in the Railway dashboard

## Troubleshooting

**Can't see my repository?**
- Make sure you authorized Railway to access your repositories
- Check GitHub → Settings → Applications → Authorized OAuth Apps
- Re-authorize if needed

**Deployment fails?**
- Check the deployment logs in Railway dashboard
- Verify environment variables are set correctly
- Ensure your project has the correct build configuration

## Next Steps

1. ✅ GitHub is now connected to Railway
2. If deploying backend: Follow `BACKEND_DEPLOYMENT_GUIDE.md`
3. If just connecting: You're all set! Railway can now access your repo

## Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway GitHub Integration](https://docs.railway.app/deploy/github)
- [Backend Deployment Guide](./BACKEND_DEPLOYMENT_GUIDE.md)

