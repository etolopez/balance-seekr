# Backend Setup Verification Checklist

## ✅ File Structure Check

Run this command to verify all files exist:
```bash
cd backend
find src -type f | sort
```

Expected files:
- ✅ `src/index.js` - Main server file
- ✅ `src/config/database.js` - Database configuration
- ✅ `src/config/solana.js` - Solana payment verification
- ✅ `src/models/database.js` - Database schema initialization
- ✅ `src/models/user.js` - User model
- ✅ `src/models/group.js` - Group model
- ✅ `src/models/message.js` - Message model
- ✅ `src/routes/users.js` - User endpoints
- ✅ `src/routes/groups.js` - Group endpoints
- ✅ `src/routes/messages.js` - Message endpoints
- ✅ `src/middleware/validation.js` - Validation middleware
- ✅ `src/utils/migrate.js` - Database migration utility

## ✅ Dependencies Check

All required packages are in `package.json`:
- ✅ `express` - Web framework
- ✅ `pg` - PostgreSQL client
- ✅ `cors` - CORS middleware
- ✅ `dotenv` - Environment variables
- ✅ `@solana/web3.js` - Solana integration

## ✅ API Endpoints Check

### Users Endpoints:
- ✅ `GET /api/users/:address` - Get user profile
- ✅ `GET /api/users/username/check` - Check username availability
- ✅ `POST /api/users/username` - Register username
- ✅ `POST /api/users/x-sync` - Sync X account

### Groups Endpoints:
- ✅ `GET /api/groups/public` - Get all public groups
- ✅ `POST /api/groups` - Create group
- ✅ `POST /api/groups/:groupId/join` - Join group
- ✅ `GET /api/groups/:groupId/members/:address` - Check membership
- ✅ `PATCH /api/groups/:groupId/join-price` - Update join price

### Messages Endpoints:
- ✅ `GET /api/groups/:groupId/messages` - Get messages
- ✅ `POST /api/groups/:groupId/messages` - Send message

## ✅ Database Schema Check

Tables that will be created:
- ✅ `users` - User profiles with unique usernames
- ✅ `groups` - Public Mastermind groups
- ✅ `group_members` - Membership tracking
- ✅ `messages` - Group messages

## ✅ Railway Configuration

- ✅ `railway.json` - Railway deployment config
- ✅ Root directory: `backend`
- ✅ Start command: `npm start`

## ⚠️ Environment Variables Required

Make sure these are set in Railway (backend service):
- `DATABASE_URL` - Auto-provided by PostgreSQL service
- `PORT=3000`
- `NODE_ENV=production`
- `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`
- `SOLANA_CLUSTER=mainnet-beta`
- `PLATFORM_PAYMENT_ADDRESS=<your Solana address>`
- `PLATFORM_CREATE_FEE=0.01`
- `PLATFORM_JOIN_FEE_PERCENTAGE=0.01`
- `CORS_ORIGIN=*`

## 🔍 Quick Test

Once deployed, test the health endpoint:
```bash
curl https://your-railway-url.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T...",
  "service": "balance-seekr-backend"
}
```

