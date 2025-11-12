# Quick Start: Testing Your Backend

## 🚀 After Deployment on Railway

### Step 1: Get Your Railway URL

1. Go to your Railway project
2. Click on your **backend service**
3. Find the **"Settings"** tab
4. Look for **"Generate Domain"** or check the **"Networking"** tab
5. Copy your public URL (e.g., `https://your-app.railway.app`)

### Step 2: Test Health Endpoint

Open your browser or use curl:
```
https://your-railway-url.railway.app/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T...",
  "service": "balance-seekr-backend"
}
```

### Step 3: Test with the Script

```bash
cd backend
node test-api.js https://your-railway-url.railway.app
```

Or use the shell script:
```bash
cd backend
./test-api.sh https://your-railway-url.railway.app
```

## 📝 Manual Testing Examples

### Register a Username

Replace `YOUR_WALLET_ADDRESS` with your actual Solana wallet address:

```bash
curl -X POST https://your-railway-url.railway.app/api/users/username \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "YOUR_WALLET_ADDRESS",
    "username": "myusername"
  }'
```

### Check Username Availability

```bash
curl "https://your-railway-url.railway.app/api/users/username/check?username=myusername"
```

### Get Your Profile

```bash
curl https://your-railway-url.railway.app/api/users/YOUR_WALLET_ADDRESS
```

### List Public Groups

```bash
curl https://your-railway-url.railway.app/api/groups/public
```

## 🔗 Connect Your Frontend

Once testing works, update your frontend:

1. Create or update `.env` file in your project root:
   ```
   EXPO_PUBLIC_API_URL=https://your-railway-url.railway.app
   ```

2. Restart your Expo app to load the new environment variable

3. Test from your mobile app - the Mastermind features should now work!

## 🐛 Troubleshooting

### Backend not responding?
- Check Railway logs for errors
- Verify PostgreSQL is running
- Check that environment variables are set

### Database errors?
- Verify `DATABASE_URL` is available
- Check PostgreSQL service logs
- Ensure tables were created (check backend logs for "Tables initialized")

### CORS errors?
- Update `CORS_ORIGIN` in Railway to match your frontend domain
- For testing, you can use `*` (not recommended for production)

