# Backend Testing Guide

## Quick Start Testing

### 1. Test the Health Endpoint

Once your backend is deployed on Railway, test the health endpoint:

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

### 2. Test Username Availability

```bash
curl "https://your-railway-url.railway.app/api/users/username/check?username=testuser"
```

Expected response:
```json
{
  "available": true,
  "message": "Username is available"
}
```

### 3. Register a Username

```bash
curl -X POST https://your-railway-url.railway.app/api/users/username \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "YOUR_SOLANA_WALLET_ADDRESS",
    "username": "testuser"
  }'
```

Expected response:
```json
{
  "success": true,
  "username": "testuser",
  "message": "Username registered successfully"
}
```

### 4. Get User Profile

```bash
curl https://your-railway-url.railway.app/api/users/YOUR_SOLANA_WALLET_ADDRESS
```

Expected response:
```json
{
  "username": "testuser",
  "xHandle": null,
  "verified": false
}
```

### 5. Get Public Groups

```bash
curl https://your-railway-url.railway.app/api/groups/public
```

Expected response:
```json
{
  "groups": []
}
```
(Empty initially, will populate as groups are created)

### 6. Create a Public Group

```bash
curl -X POST https://your-railway-url.railway.app/api/groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Group",
    "ownerAddress": "YOUR_SOLANA_WALLET_ADDRESS",
    "joinPrice": 0,
    "paymentAddress": "YOUR_SOLANA_WALLET_ADDRESS",
    "description": "A test group",
    "createPrice": 0.01,
    "createPaymentSignature": "YOUR_PAYMENT_SIGNATURE"
  }'
```

**Note:** For testing, you can use a mock signature, but in production you need a real Solana transaction signature.

## Using Postman or Insomnia

1. **Import the collection** (see below)
2. **Set the base URL** to your Railway URL
3. **Update variables** with your wallet address
4. **Test endpoints** in order

## Testing Workflow

### Step 1: Register a Username
1. Check if username is available
2. Register the username
3. Verify it was saved by getting user profile

### Step 2: Create a Group
1. Create a public group (requires payment signature)
2. List public groups to see your new group
3. Get group details

### Step 3: Join a Group
1. Join a group (requires payment if group has join price)
2. Check membership status
3. Send a message to the group

### Step 4: Test Messages
1. Get messages for a group
2. Send a message
3. Verify message appears in the list

## Local Testing (Optional)

If you want to test locally before deploying:

1. **Install PostgreSQL locally** or use Docker:
   ```bash
   docker run --name postgres-test -e POSTGRES_PASSWORD=test -p 5432:5432 -d postgres
   ```

2. **Set up .env file:**
   ```env
   DATABASE_URL=postgresql://postgres:test@localhost:5432/balance_seekr
   PORT=3000
   NODE_ENV=development
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   SOLANA_CLUSTER=mainnet-beta
   PLATFORM_PAYMENT_ADDRESS=YOUR_ADDRESS
   PLATFORM_CREATE_FEE=0.01
   PLATFORM_JOIN_FEE_PERCENTAGE=0.01
   CORS_ORIGIN=*
   ```

3. **Run the server:**
   ```bash
   cd backend
   npm start
   ```

4. **Test endpoints** using `http://localhost:3000` instead of Railway URL

## Common Test Scenarios

### Scenario 1: New User Registration
```bash
# 1. Check username
curl "http://localhost:3000/api/users/username/check?username=alice"

# 2. Register username
curl -X POST http://localhost:3000/api/users/username \
  -H "Content-Type: application/json" \
  -d '{"userAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", "username": "alice"}'

# 3. Get profile
curl http://localhost:3000/api/users/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

### Scenario 2: Create and Join Group
```bash
# 1. Create group (with mock signature for testing)
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Solana Developers",
    "ownerAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "joinPrice": 0.1,
    "paymentAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "description": "A group for Solana developers",
    "createPrice": 0.01,
    "createPaymentSignature": "mock_signature_for_testing"
  }'

# 2. List groups
curl http://localhost:3000/api/groups/public

# 3. Join group (use group ID from step 1)
curl -X POST http://localhost:3000/api/groups/GROUP_ID_HERE/join \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "ANOTHER_WALLET_ADDRESS",
    "paymentSignature": "free"
  }'
```

## Testing Payment Verification

**Note:** Payment verification requires real Solana transactions. For testing:

1. **Use testnet** - Set `SOLANA_RPC_URL` to testnet RPC
2. **Mock signatures** - You can temporarily disable payment verification for testing
3. **Real transactions** - Create actual testnet transactions and use their signatures

## Debugging Tips

1. **Check backend logs** in Railway to see what's happening
2. **Verify database connection** - Look for `[Database] Connected to PostgreSQL`
3. **Check table creation** - Look for `[Database] Tables initialized successfully`
4. **Verify environment variables** - Make sure all required vars are set
5. **Test endpoints one by one** - Start with health, then users, then groups

## Next Steps

Once testing is successful:
1. Update your frontend `EXPO_PUBLIC_API_URL` to point to Railway
2. Test the full flow from the mobile app
3. Create real groups and test payments
4. Monitor logs for any issues

