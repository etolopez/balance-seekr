# Railway Deployment Guide

## Step 1: Create Railway Project

1. Go to [Railway](https://railway.app) and create a new project
2. Select "Deploy from GitHub repo"
3. Choose your `balance-seekr` repository
4. Railway will detect the backend folder automatically

## Step 2: Add PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically create a PostgreSQL database
3. Copy the `DATABASE_URL` from the database service variables

## Step 3: Configure Environment Variables

In your Railway project settings, add these environment variables:

### Required Variables:

```
DATABASE_URL=<from PostgreSQL service>
PORT=3000
NODE_ENV=production
```

### Solana Configuration:

```
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_CLUSTER=mainnet-beta
```

### Platform Configuration:

```
PLATFORM_PAYMENT_ADDRESS=<your Solana wallet address>
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

1. In Railway, go to your backend service settings
2. Set the **Root Directory** to `backend`
3. Set the **Start Command** to `npm start`
4. Railway will automatically detect Node.js and install dependencies

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

### Database Connection Issues
- Verify `DATABASE_URL` is correctly set
- Check that PostgreSQL service is running
- Ensure the database is accessible from your service

### Payment Verification Failing
- Verify `SOLANA_RPC_URL` is correct
- Check that `PLATFORM_PAYMENT_ADDRESS` is a valid Solana address
- Ensure transactions are on the correct network (mainnet/testnet)

### CORS Issues
- Update `CORS_ORIGIN` to match your frontend domain
- For development, you can use `*` (not recommended for production)

