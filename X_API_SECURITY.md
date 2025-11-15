# X API Credentials Security Guide

This guide explains how to securely store and use your X (Twitter) API credentials without exposing them in your codebase.

## ⚠️ CRITICAL: Never Commit Secrets

**NEVER commit API keys, secrets, or tokens to Git.** They are automatically ignored via `.gitignore`, but always double-check before committing.

## Step 1: Create Backend `.env` File

1. In the `backend/` directory, create a `.env` file (if it doesn't exist):

```bash
cd backend
touch .env
```

2. Add your X API credentials to `backend/.env`:

```env
# X (Twitter) API Credentials
X_API_KEY=your_actual_api_key_here
X_API_SECRET=your_actual_api_secret_here
X_BEARER_TOKEN=your_actual_bearer_token_here
X_ACCESS_TOKEN=your_actual_access_token_here
X_ACCESS_TOKEN_SECRET=your_actual_access_token_secret_here
```

3. **Verify `.env` is in `.gitignore`**:
   - Check that `backend/.env` is listed in `.gitignore`
   - The `.env.example` file is safe to commit (it has placeholder values)

## Step 2: Set Environment Variables in Railway

For production deployment on Railway:

1. Go to your Railway project dashboard
2. Select your **backend service** (not PostgreSQL)
3. Click on the **"Variables"** tab
4. Add each credential as a separate environment variable:

   - `X_API_KEY` = `your_actual_api_key`
   - `X_API_SECRET` = `your_actual_api_secret`
   - `X_BEARER_TOKEN` = `your_actual_bearer_token`
   - `X_ACCESS_TOKEN` = `your_actual_access_token`
   - `X_ACCESS_TOKEN_SECRET` = `your_actual_access_token_secret`

5. Click **"Deploy"** or wait for automatic redeployment

## Step 3: Verify Security

### ✅ What's Safe:

- ✅ `backend/.env.example` - Contains placeholders, safe to commit
- ✅ `backend/src/routes/users.js` - Uses `process.env.X_BEARER_TOKEN` (reads from environment)
- ✅ Backend code - Secrets are read from environment variables, never hardcoded

### ❌ What's NOT Safe:

- ❌ Hardcoding credentials in source code
- ❌ Committing `backend/.env` file
- ❌ Adding credentials to `app.json` or frontend code
- ❌ Exposing credentials in frontend environment variables

## Step 4: How It Works

1. **Backend Only**: All X API calls happen on the backend
2. **Environment Variables**: Credentials are read from `process.env` in Node.js
3. **Never Sent to Frontend**: The frontend never sees API keys or secrets
4. **Secure Storage**: Railway stores environment variables securely

## Step 5: Testing Locally

1. Create `backend/.env` with your credentials
2. Run the backend:
   ```bash
   cd backend
   npm start
   ```
3. The backend will read credentials from `.env` automatically (via `dotenv`)

## Step 6: Frontend Implementation

The frontend will call the backend API endpoint `/api/users/x-sync` with:
- `userAddress`: The user's wallet address
- `xHandle`: The X username (without @)

The backend handles all X API communication internally, so the frontend never needs to see the credentials.

## Troubleshooting

### "X API not configured" Error

- Check that `X_BEARER_TOKEN` is set in Railway environment variables
- Verify the backend service has been redeployed after adding variables
- Check backend logs for configuration errors

### Credentials Not Working

- Verify credentials are correct in Railway dashboard
- Check that there are no extra spaces or quotes in the values
- Ensure credentials are for the correct X Developer App

### Local Development Not Working

- Make sure `backend/.env` exists and has the correct values
- Verify `dotenv` is installed (`npm install dotenv`)
- Check that `.env` file is in the `backend/` directory (not root)

## Security Best Practices

1. **Rotate Credentials**: If credentials are ever exposed, rotate them immediately in X Developer Portal
2. **Limit Permissions**: Only grant necessary permissions to your X App
3. **Monitor Usage**: Check X Developer Portal for unusual API usage
4. **Use Different Credentials**: Use different credentials for development and production
5. **Never Log Secrets**: Avoid logging credentials in console.log statements

## File Structure

```
backend/
  ├── .env                    # ⚠️ NEVER COMMIT - Contains real credentials
  ├── .env.example            # ✅ Safe to commit - Contains placeholders
  └── src/
      └── routes/
          └── users.js        # ✅ Uses process.env.X_BEARER_TOKEN
```

## Quick Checklist

- [ ] Created `backend/.env` with real credentials
- [ ] Verified `backend/.env` is in `.gitignore`
- [ ] Added credentials to Railway environment variables
- [ ] Redeployed backend service on Railway
- [ ] Tested X verification endpoint
- [ ] Verified no credentials in committed code

