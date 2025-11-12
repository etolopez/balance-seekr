# Backend API Structure for Public Masterminds

## Overview
This document provides a complete structure for implementing the backend API that powers public Mastermind groups with Solana payments.

## Technology Recommendations
- **Node.js/Express** or **Python/FastAPI** or **Rust/Actix**
- **PostgreSQL** or **MongoDB** for database
- **Solana Web3.js** for payment verification
- **JWT** or similar for authentication (optional, wallet-based auth is primary)

## Database Schema

### Groups Table
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_address VARCHAR(44) NOT NULL, -- Solana address
  owner_username VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_public BOOLEAN NOT NULL DEFAULT true,
  join_price DECIMAL(18, 9) NOT NULL DEFAULT 0, -- SOL amount (0 for free)
  payment_address VARCHAR(44) NOT NULL, -- Address to receive join payments
  description TEXT,
  create_price DECIMAL(18, 9) NOT NULL, -- Platform fee paid to create
  create_payment_signature VARCHAR(200), -- Transaction signature for creation fee
  member_count INTEGER DEFAULT 0,
  INDEX idx_owner_address (owner_address),
  INDEX idx_is_public (is_public),
  INDEX idx_created_at (created_at DESC)
);
```

### Members Table
```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_address VARCHAR(44) NOT NULL,
  username VARCHAR(100),
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  join_payment_signature VARCHAR(200), -- Transaction signature for join payment
  UNIQUE(group_id, user_address),
  INDEX idx_group_id (group_id),
  INDEX idx_user_address (user_address)
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  sender_address VARCHAR(44) NOT NULL,
  sender_username VARCHAR(100),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_group_id (group_id),
  INDEX idx_created_at (created_at)
);
```

## API Endpoints

### Base URL
Set via `EXPO_PUBLIC_API_URL` environment variable (default: `https://api.solanaseeker.app`)

### 1. GET /api/groups/public
**Description**: Get all public groups

**Response**:
```json
{
  "groups": [
    {
      "id": "uuid",
      "name": "Group Name",
      "ownerAddress": "SolanaAddress...",
      "ownerUsername": "username",
      "createdAt": "2024-01-01T00:00:00Z",
      "isPublic": true,
      "joinPrice": 0.1,
      "paymentAddress": "SolanaAddress...",
      "description": "Group description",
      "memberCount": 5
    }
  ]
}
```

**Implementation Notes**:
- Filter by `is_public = true`
- Order by `created_at DESC`
- Include `member_count` from members table

---

### 2. POST /api/groups
**Description**: Create a new public group

**Request Body**:
```json
{
  "name": "Group Name",
  "ownerAddress": "SolanaAddress...",
  "ownerUsername": "username",
  "joinPrice": 0.0,
  "paymentAddress": "SolanaAddress...",
  "description": "Group description",
  "createPaymentSignature": "transaction_signature",
  "createPrice": 0.01
}
```

**Response**:
```json
{
  "group": {
    "id": "uuid",
    "name": "Group Name",
    "ownerAddress": "SolanaAddress...",
    "ownerUsername": "username",
    "createdAt": "2024-01-01T00:00:00Z",
    "isPublic": true,
    "joinPrice": 0.0,
    "paymentAddress": "SolanaAddress...",
    "description": "Group description",
    "memberCount": 0
  }
}
```

**Implementation Notes**:
1. **Verify creation payment**:
   - Use Solana Web3.js to verify the transaction signature
   - Check that payment amount matches `createPrice`
   - Check that payment recipient is the platform address
   - Check transaction is confirmed on-chain

2. **Validation**:
   - Validate `name` (required, max 255 chars)
   - Validate `joinPrice` (>= 0)
   - Validate Solana addresses format
   - Check `createPrice` matches platform fee

3. **Create group**:
   - Insert into `groups` table
   - Add owner as first member in `group_members`
   - Return created group

**Error Responses**:
- `400 Bad Request`: Invalid input
- `402 Payment Required`: Payment verification failed
- `500 Internal Server Error`: Server error

---

### 3. POST /api/groups/:groupId/join
**Description**: Join a public group (with payment verification)

**Request Body**:
```json
{
  "userAddress": "SolanaAddress...",
  "username": "username",
  "paymentSignature": "transaction_signature" // Empty string for free groups
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully joined group"
}
```

**Implementation Notes**:
1. **Check if already a member**:
   - Query `group_members` table
   - Return error if already member

2. **For paid groups** (joinPrice > 0):
   - Verify payment transaction signature
   - The transaction contains TWO transfers:
     - Platform fee: 1% of `join_price` to platform address (`BWg1ZSZqvmXdUSuuXbssBM9Qjgyo3mzJrQap7KuQ8mZZ`)
     - Owner payment: 99% of `join_price` to group's `payment_address`
   - Verify both transfers are in the transaction
   - Verify transaction is confirmed

3. **For free groups** (joinPrice = 0):
   - No payment verification needed
   - `paymentSignature` should be empty string

4. **Add member**:
   - Insert into `group_members` table
   - Increment `member_count` in `groups` table
   - Return success

**Payment Split Details**:
- Platform receives: `joinPrice * 0.01` (1% fee)
- Group owner receives: `joinPrice * 0.99` (99%)
- Platform address: `BWg1ZSZqvmXdUSuuXbssBM9Qjgyo3mzJrQap7KuQ8mZZ`

**Error Responses**:
- `400 Bad Request`: Invalid input or already a member
- `402 Payment Required`: Payment verification failed (for paid groups)
- `404 Not Found`: Group not found
- `500 Internal Server Error`: Server error

---

### 4. GET /api/groups/:groupId/messages
**Description**: Get messages for a public group

**Query Parameters**:
- `limit` (optional): Number of messages to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "messages": [
    {
      "id": "uuid",
      "groupId": "uuid",
      "senderAddress": "SolanaAddress...",
      "senderUsername": "username",
      "content": "Message content",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Implementation Notes**:
- Check if user is a member (optional - can allow viewing without joining)
- Order by `created_at ASC` for chronological order
- Support pagination

---

### 5. POST /api/groups/:groupId/messages
**Description**: Send a message to a public group

**Request Body**:
```json
{
  "senderAddress": "SolanaAddress...",
  "content": "Message content",
  "username": "username"
}
```

**Response**:
```json
{
  "message": {
    "id": "uuid",
    "groupId": "uuid",
    "senderAddress": "SolanaAddress...",
    "senderUsername": "username",
    "content": "Message content",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Implementation Notes**:
1. **Verify membership**:
   - Check if `senderAddress` is in `group_members` for this group
   - Return `403 Forbidden` if not a member

2. **Validation**:
   - Validate `content` (required, max length, no empty)
   - Validate `senderAddress` format

3. **Create message**:
   - Insert into `messages` table
   - Return created message

**Error Responses**:
- `400 Bad Request`: Invalid input
- `403 Forbidden`: User is not a member
- `404 Not Found`: Group not found
- `500 Internal Server Error`: Server error

---

### 6. GET /api/groups/:groupId/members/:userAddress
**Description**: Check if user is a member of a group

**Response**:
```json
{
  "isMember": true
}
```

**Implementation Notes**:
- Query `group_members` table
- Return boolean

---

## Payment Verification

### Solana Transaction Verification

Use the following approach to verify payments:

```javascript
// Example using Solana Web3.js (Node.js)
const { Connection, PublicKey } = require('@solana/web3.js');

// Platform configuration
const PLATFORM_ADDRESS = 'BWg1ZSZqvmXdUSuuXbssBM9Qjgyo3mzJrQap7KuQ8mZZ';
const PLATFORM_JOIN_FEE_PERCENTAGE = 0.01; // 1%

async function verifyPayment(signature, expectedRecipient, expectedAmount) {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  
  // Get transaction
  const tx = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });
  
  if (!tx || !tx.meta) {
    throw new Error('Transaction not found');
  }
  
  if (tx.meta.err) {
    throw new Error('Transaction failed');
  }
  
  // Verify recipient and amount
  const recipientPubkey = new PublicKey(expectedRecipient);
  const expectedAmountLamports = expectedAmount * 1e9; // Convert SOL to lamports
  
  // Check account balance changes
  const accountKeys = tx.transaction.message.staticAccountKeys;
  const recipientIndex = accountKeys.findIndex(key => key.equals(recipientPubkey));
  
  if (recipientIndex >= 0) {
    const preBalance = tx.meta.preBalances[recipientIndex];
    const postBalance = tx.meta.postBalances[recipientIndex];
    const balanceChange = postBalance - preBalance;
    
    if (balanceChange >= expectedAmountLamports) {
      return true;
    }
  }
  
  throw new Error('Payment verification failed');
}

/**
 * Verify split payment for joining a group
 * Verifies that the transaction contains both platform fee (1%) and owner payment (99%)
 */
async function verifyJoinPayment(signature, groupJoinPrice, groupOwnerAddress) {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  
  // Get transaction
  const tx = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });
  
  if (!tx || !tx.meta) {
    throw new Error('Transaction not found');
  }
  
  if (tx.meta.err) {
    throw new Error('Transaction failed');
  }
  
  const platformAddress = new PublicKey(PLATFORM_ADDRESS);
  const ownerAddress = new PublicKey(groupOwnerAddress);
  const accountKeys = tx.transaction.message.staticAccountKeys;
  
  // Find indices for platform and owner addresses
  const platformIndex = accountKeys.findIndex(key => key.equals(platformAddress));
  const ownerIndex = accountKeys.findIndex(key => key.equals(ownerAddress));
  
  if (platformIndex < 0 || ownerIndex < 0) {
    throw new Error('Payment recipients not found in transaction');
  }
  
  // Calculate expected amounts
  const totalAmountLamports = groupJoinPrice * 1e9;
  const platformFeeLamports = Math.floor(totalAmountLamports * PLATFORM_JOIN_FEE_PERCENTAGE);
  const ownerAmountLamports = totalAmountLamports - platformFeeLamports;
  
  // Verify platform fee payment
  const platformPreBalance = tx.meta.preBalances[platformIndex];
  const platformPostBalance = tx.meta.postBalances[platformIndex];
  const platformBalanceChange = platformPostBalance - platformPreBalance;
  
  // Verify owner payment
  const ownerPreBalance = tx.meta.preBalances[ownerIndex];
  const ownerPostBalance = tx.meta.postBalances[ownerIndex];
  const ownerBalanceChange = ownerPostBalance - ownerPreBalance;
  
  // Check both payments (allow small rounding differences)
  const tolerance = 1000; // 0.000001 SOL tolerance
  const platformValid = Math.abs(platformBalanceChange - platformFeeLamports) <= tolerance;
  const ownerValid = Math.abs(ownerBalanceChange - ownerAmountLamports) <= tolerance;
  
  if (platformValid && ownerValid) {
    return true;
  }
  
  throw new Error(`Payment verification failed. Platform: ${platformValid}, Owner: ${ownerValid}`);
}
```

## Environment Variables

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://api.solanaseeker.app

# Platform Configuration
EXPO_PUBLIC_PLATFORM_ADDRESS=BWg1ZSZqvmXdUSuuXbssBM9Qjgyo3mzJrQap7KuQ8mZZ
PLATFORM_CREATE_FEE=0.01
PLATFORM_JOIN_FEE_PERCENTAGE=0.01  # 1%

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_CLUSTER=mainnet-beta

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/solanaseeker

# Optional: JWT Secret (if using JWT auth)
JWT_SECRET=your-secret-key
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting on all endpoints
2. **Input Validation**: Validate all inputs (addresses, amounts, content)
3. **SQL Injection**: Use parameterized queries
4. **Payment Verification**: Always verify on-chain, never trust client
5. **Access Control**: Verify membership before allowing messages
6. **CORS**: Configure CORS properly for mobile app
7. **Error Handling**: Don't expose sensitive information in errors

## Example Implementation (Node.js/Express)

```javascript
const express = require('express');
const { Connection, PublicKey } = require('@solana/web3.js');
const router = express.Router();

const connection = new Connection(process.env.SOLANA_RPC_URL);

// POST /api/groups
router.post('/groups', async (req, res) => {
  try {
    const { name, ownerAddress, joinPrice, createPaymentSignature, createPrice } = req.body;
    
    // Verify creation payment
    await verifyPayment(
      createPaymentSignature,
      process.env.PLATFORM_PAYMENT_ADDRESS,
      createPrice
    );
    
    // Create group in database
    const group = await db.groups.create({
      name,
      owner_address: ownerAddress,
      join_price: joinPrice,
      create_price: createPrice,
      // ... other fields
    });
    
    // Add owner as member
    await db.group_members.create({
      group_id: group.id,
      user_address: ownerAddress,
    });
    
    res.json({ group });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/groups/:groupId/join
router.post('/groups/:groupId/join', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userAddress, paymentSignature } = req.body;
    
    // Get group
    const group = await db.groups.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if already member
    const existing = await db.group_members.findOne({
      where: { group_id: groupId, user_address: userAddress }
    });
    if (existing) {
      return res.status(400).json({ error: 'Already a member' });
    }
    
    // Verify payment for paid groups (split payment: 1% platform, 99% owner)
    if (group.join_price > 0) {
      await verifyJoinPayment(
        paymentSignature,
        group.join_price,
        group.payment_address
      );
    }
    
    // Add member
    await db.group_members.create({
      group_id: groupId,
      user_address: userAddress,
      join_payment_signature: paymentSignature,
    });
    
    // Update member count
    await db.groups.increment('member_count', {
      where: { id: groupId }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## Testing

1. **Unit Tests**: Test payment verification logic
2. **Integration Tests**: Test API endpoints with mock Solana transactions
3. **E2E Tests**: Test full flow from group creation to messaging

## Deployment

1. **Database**: Use managed PostgreSQL (AWS RDS, Supabase, etc.)
2. **API**: Deploy to AWS, Heroku, Railway, or similar
3. **Monitoring**: Set up error tracking (Sentry, etc.)
4. **Logging**: Implement structured logging

## Next Steps

1. Set up database with schema above
2. Implement payment verification function
3. Create API endpoints
4. Test with devnet Solana transactions
5. Deploy to production
6. Update `EXPO_PUBLIC_API_URL` in mobile app

