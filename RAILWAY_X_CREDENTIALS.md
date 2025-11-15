# Railway X API Credentials Setup

## ⚠️ IMPORTANT: Add These to Railway Environment Variables

Your X API credentials have been added to `backend/.env` for local development. Now you need to add them to Railway for production.

## Step-by-Step Instructions

### 1. Go to Railway Dashboard

1. Open [Railway Dashboard](https://railway.app)
2. Select your project
3. Click on your **backend service** (not PostgreSQL)

### 2. Add Environment Variables

1. Click on the **"Variables"** tab
2. Click **"New Variable"** for each credential below:

#### Add These Variables:

**Variable 1:**
- **Name**: `X_BEARER_TOKEN`
- **Value**: `AAAAAAAAAAAAAAAAAAAAAJ3K5QEAAAAAzfMcIoWLMksWE9luuQ9mqeJ92mc=7CMW6XAjbRCWTY6qgW5rUJDQAflgHBfNuqkOirR0IcQWiNoT87`

**Variable 2:**
- **Name**: `X_ACCESS_TOKEN`
- **Value**: `1360260811193786375-dlEPz8ElZsvjrJd0akXBnZMu38x4e7`

**Variable 3:**
- **Name**: `X_ACCESS_TOKEN_SECRET`
- **Value**: `Mqyyb42cCWPJMunV07LeajdWTl0wlEUOqT43pc5yr6gYg`

### 3. Deploy

After adding all variables:
- Railway will automatically redeploy your backend
- Wait for deployment to complete (check the "Deployments" tab)
- Test the X verification endpoint

### 4. Verify It Works

Once deployed, test the X verification:

```bash
# Replace YOUR_BACKEND_URL with your Railway URL
curl -X POST https://YOUR_BACKEND_URL/api/users/x-sync \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "YOUR_WALLET_ADDRESS",
    "xHandle": "your_x_username"
  }'
```

## Security Notes

✅ **Credentials are stored securely:**
- Local: `backend/.env` (gitignored, never committed)
- Production: Railway environment variables (encrypted)

✅ **Never exposed to:**
- Git repository
- Frontend code
- Public API responses

## Current Implementation

The backend now:
1. Reads credentials from environment variables
2. Uses `X_BEARER_TOKEN` to verify X accounts via X API v2
3. Checks if accounts have blue checkmarks (verified status)
4. Stores verification status in the database

## Next Steps

1. ✅ Credentials added to `backend/.env` (local)
2. ⏳ Add credentials to Railway (production)
3. ⏳ Test X verification endpoint
4. ⏳ Test in the app UI

## Troubleshooting

### "X API not configured" Error

- Verify all three variables are set in Railway
- Check variable names match exactly (case-sensitive)
- Ensure no extra spaces in values
- Redeploy after adding variables

### "Invalid Bearer Token" Error

- Verify Bearer Token is correct (check for URL encoding issues)
- Ensure token hasn't expired in X Developer Portal
- Check token has proper permissions

### Verification Not Working

- Check X API rate limits in Developer Portal
- Verify the X handle exists and is correct
- Check backend logs for detailed error messages

