# Backend API Deployment Guide

## Overview
This guide will help you deploy the backend API for Public Masterminds. You have several hosting options - **you don't need Google** (though Google Cloud is an option). Here are the best options for getting started quickly:

## 🚀 Quick Start Options (Recommended)

### Option 1: Railway (Easiest - Recommended for Beginners)
**Why Railway?** Free tier, easy setup, automatic deployments, includes database.

1. **Sign up**: Go to [railway.app](https://railway.app)
2. **Create Project**: Click "New Project"
3. **Add Database**: 
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will create a PostgreSQL database automatically
4. **Deploy API**:
   - Click "New" → "GitHub Repo" (or "Empty Project")
   - Connect your repository or create a new one
5. **Set Environment Variables**:
   ```
   DATABASE_URL=<railway-provided-postgres-url>
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   PLATFORM_PAYMENT_ADDRESS=BWg1ZSZqvmXdUSuuXbssBM9Qjgyo3mzJrQap7KuQ8mZZ
   PLATFORM_CREATE_FEE=0.01
   PLATFORM_JOIN_FEE_PERCENTAGE=0.01
   PORT=3000
   ```
6. **Get API URL**: Railway provides a URL like `https://your-app.up.railway.app`
7. **Update Mobile App**: Set `EXPO_PUBLIC_API_URL=https://your-app.up.railway.app`

**Cost**: Free tier includes $5/month credit (usually enough for small apps)

---

### Option 2: Render (Free Tier Available)
**Why Render?** Free tier, simple setup, good for Node.js apps.

1. **Sign up**: Go to [render.com](https://render.com)
2. **Create Web Service**:
   - Click "New" → "Web Service"
   - Connect your GitHub repo or create new
   - Select Node.js
3. **Add PostgreSQL Database**:
   - Click "New" → "PostgreSQL"
   - Render creates database automatically
4. **Set Environment Variables** (same as Railway)
5. **Deploy**: Render auto-deploys on git push

**Cost**: Free tier available (with limitations)

---

### Option 3: Supabase (All-in-One Solution)
**Why Supabase?** Free PostgreSQL database + optional API hosting, great for quick setup.

1. **Sign up**: Go to [supabase.com](https://supabase.com)
2. **Create Project**: Click "New Project"
3. **Get Database URL**: 
   - Go to Settings → Database
   - Copy "Connection string" (URI format)
4. **Deploy API Separately**: Use Railway/Render for API, Supabase for database only
   - OR use Supabase Edge Functions for API (more advanced)

**Cost**: Free tier includes 500MB database

---

### Option 4: Google Cloud Platform (GCP)
**Why GCP?** If you prefer Google ecosystem, more control, scalable.

1. **Sign up**: Go to [cloud.google.com](https://cloud.google.com)
2. **Create Project**: In Google Cloud Console
3. **Set up Cloud SQL** (PostgreSQL):
   - Go to SQL → Create Instance
   - Choose PostgreSQL
4. **Deploy to Cloud Run**:
   - Build container image
   - Deploy to Cloud Run (serverless)
5. **Set Environment Variables** in Cloud Run settings

**Cost**: Free tier available, pay-as-you-go after

---

### Option 5: AWS (Most Scalable)
**Why AWS?** Enterprise-grade, highly scalable, more complex setup.

1. **Sign up**: Go to [aws.amazon.com](https://aws.amazon.com)
2. **Set up RDS** (PostgreSQL database)
3. **Deploy to Elastic Beanstalk** or **ECS**
4. **Configure** environment variables

**Cost**: Free tier available, then pay-as-you-go

---

## 📋 Step-by-Step: Creating the Backend API

### Step 1: Choose Your Stack

**Recommended: Node.js + Express + PostgreSQL**

```bash
# Create new directory
mkdir solana-seeker-backend
cd solana-seeker-backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors dotenv pg @solana/web3.js
npm install --save-dev nodemon typescript @types/express @types/node
```

### Step 2: Project Structure

```
solana-seeker-backend/
├── src/
│   ├── index.ts          # Main server file
│   ├── routes/
│   │   └── groups.ts     # Group endpoints
│   ├── services/
│   │   └── payment.ts    # Payment verification
│   ├── db/
│   │   └── connection.ts # Database connection
│   └── types/
│       └── index.ts      # TypeScript types
├── .env                  # Environment variables
├── package.json
└── tsconfig.json
```

### Step 3: Basic Server Setup

**src/index.ts**:
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import groupsRouter from './routes/groups';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/groups', groupsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 4: Database Setup

**src/db/connection.ts**:
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;
```

**Database Schema** (run this SQL in your database):
```sql
-- Create tables
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_address VARCHAR(44) NOT NULL,
  owner_username VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_public BOOLEAN NOT NULL DEFAULT true,
  join_price DECIMAL(18, 9) NOT NULL DEFAULT 0,
  payment_address VARCHAR(44) NOT NULL,
  description TEXT,
  create_price DECIMAL(18, 9) NOT NULL,
  create_payment_signature VARCHAR(200),
  member_count INTEGER DEFAULT 0
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_address VARCHAR(44) NOT NULL,
  username VARCHAR(100),
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  join_payment_signature VARCHAR(200),
  join_price_paid DECIMAL(18, 9) NOT NULL DEFAULT 0,
  UNIQUE(group_id, user_address)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  sender_address VARCHAR(44) NOT NULL,
  sender_username VARCHAR(100),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_groups_owner ON groups(owner_address);
CREATE INDEX idx_groups_public ON groups(is_public);
CREATE INDEX idx_members_group ON group_members(group_id);
CREATE INDEX idx_members_user ON group_members(user_address);
CREATE INDEX idx_messages_group ON messages(group_id);
```

### Step 5: Payment Verification

**src/services/payment.ts**:
```typescript
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');

const PLATFORM_ADDRESS = process.env.PLATFORM_PAYMENT_ADDRESS || 'BWg1ZSZqvmXdUSuuXbssBM9Qjgyo3mzJrQap7KuQ8mZZ';
const PLATFORM_JOIN_FEE_PERCENTAGE = 0.01;

export async function verifyPayment(
  signature: string,
  expectedRecipient: string,
  expectedAmount: number
): Promise<boolean> {
  const tx = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  if (!tx || !tx.meta || tx.meta.err) {
    throw new Error('Transaction not found or failed');
  }

  const recipientPubkey = new PublicKey(expectedRecipient);
  const expectedAmountLamports = expectedAmount * 1e9;
  const accountKeys = tx.transaction.message.staticAccountKeys;
  const recipientIndex = accountKeys.findIndex(key => key.equals(recipientPubkey));

  if (recipientIndex >= 0) {
    const balanceChange = tx.meta.postBalances[recipientIndex] - tx.meta.preBalances[recipientIndex];
    if (balanceChange >= expectedAmountLamports) {
      return true;
    }
  }

  throw new Error('Payment verification failed');
}

export async function verifyJoinPayment(
  signature: string,
  groupJoinPrice: number,
  groupOwnerAddress: string
): Promise<boolean> {
  const tx = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  if (!tx || !tx.meta || tx.meta.err) {
    throw new Error('Transaction not found or failed');
  }

  const platformAddress = new PublicKey(PLATFORM_ADDRESS);
  const ownerAddress = new PublicKey(groupOwnerAddress);
  const accountKeys = tx.transaction.message.staticAccountKeys;

  const platformIndex = accountKeys.findIndex(key => key.equals(platformAddress));
  const ownerIndex = accountKeys.findIndex(key => key.equals(ownerAddress));

  if (platformIndex < 0 || ownerIndex < 0) {
    throw new Error('Payment recipients not found in transaction');
  }

  const totalAmountLamports = groupJoinPrice * 1e9;
  const platformFeeLamports = Math.floor(totalAmountLamports * PLATFORM_JOIN_FEE_PERCENTAGE);
  const ownerAmountLamports = totalAmountLamports - platformFeeLamports;

  const platformBalanceChange = tx.meta.postBalances[platformIndex] - tx.meta.preBalances[platformIndex];
  const ownerBalanceChange = tx.meta.postBalances[ownerIndex] - tx.meta.preBalances[ownerIndex];

  const tolerance = 1000; // 0.000001 SOL
  const platformValid = Math.abs(platformBalanceChange - platformFeeLamports) <= tolerance;
  const ownerValid = Math.abs(ownerBalanceChange - ownerAmountLamports) <= tolerance;

  if (platformValid && ownerValid) {
    return true;
  }

  throw new Error(`Payment verification failed. Platform: ${platformValid}, Owner: ${ownerValid}`);
}
```

### Step 6: API Routes

**src/routes/groups.ts**:
```typescript
import express from 'express';
import pool from '../db/connection';
import { verifyPayment, verifyJoinPayment } from '../services/payment';

const router = express.Router();

// GET /api/groups/public
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        g.id,
        g.name,
        g.owner_address as "ownerAddress",
        g.owner_username as "ownerUsername",
        g.created_at as "createdAt",
        g.is_public as "isPublic",
        g.join_price as "joinPrice",
        g.payment_address as "paymentAddress",
        g.description,
        COUNT(gm.id) as "memberCount"
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      WHERE g.is_public = true
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `);
    
    res.json({ groups: result.rows });
  } catch (error) {
    console.error('Error fetching public groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/groups
router.post('/', async (req, res) => {
  try {
    const { name, ownerAddress, ownerUsername, joinPrice, paymentAddress, description, createPaymentSignature, createPrice } = req.body;

    // Verify creation payment
    if (createPaymentSignature) {
      await verifyPayment(
        createPaymentSignature,
        process.env.PLATFORM_PAYMENT_ADDRESS!,
        createPrice
      );
    }

    // Create group
    const groupResult = await pool.query(`
      INSERT INTO groups (name, owner_address, owner_username, join_price, payment_address, description, create_price, create_payment_signature)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, owner_address, owner_username, created_at, is_public, join_price, payment_address, description
    `, [name, ownerAddress, ownerUsername, joinPrice, paymentAddress, description, createPrice, createPaymentSignature]);

    const group = groupResult.rows[0];

    // Add owner as first member
    await pool.query(`
      INSERT INTO group_members (group_id, user_address, username, join_price_paid)
      VALUES ($1, $2, $3, 0)
    `, [group.id, ownerAddress, ownerUsername]);

    res.json({ group: { ...group, memberCount: 1 } });
  } catch (error: any) {
    console.error('Error creating group:', error);
    res.status(400).json({ error: error.message || 'Failed to create group' });
  }
});

// POST /api/groups/:groupId/join
router.post('/:groupId/join', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userAddress, username, paymentSignature } = req.body;

    // Check if already member
    const existing = await pool.query(`
      SELECT * FROM group_members WHERE group_id = $1 AND user_address = $2
    `, [groupId, userAddress]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already a member' });
    }

    // Get group
    const groupResult = await pool.query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = groupResult.rows[0];

    // Verify payment for paid groups
    if (group.join_price > 0 && paymentSignature) {
      await verifyJoinPayment(
        paymentSignature,
        parseFloat(group.join_price),
        group.payment_address
      );
    }

    // Add member
    await pool.query(`
      INSERT INTO group_members (group_id, user_address, username, join_payment_signature, join_price_paid)
      VALUES ($1, $2, $3, $4, $5)
    `, [groupId, userAddress, username, paymentSignature, group.join_price]);

    // Update member count
    await pool.query(`
      UPDATE groups SET member_count = member_count + 1 WHERE id = $1
    `, [groupId]);

    res.json({ success: true, message: 'Successfully joined group' });
  } catch (error: any) {
    console.error('Error joining group:', error);
    res.status(400).json({ error: error.message || 'Failed to join group' });
  }
});

// GET /api/groups/:groupId/messages
router.get('/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(`
      SELECT id, group_id as "groupId", sender_address as "senderAddress", 
             sender_username as "senderUsername", content, created_at as "createdAt"
      FROM messages
      WHERE group_id = $1
      ORDER BY created_at ASC
      LIMIT $2 OFFSET $3
    `, [groupId, limit, offset]);

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/groups/:groupId/messages
router.post('/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { senderAddress, content, username } = req.body;

    // Verify membership
    const memberCheck = await pool.query(`
      SELECT * FROM group_members WHERE group_id = $1 AND user_address = $2
    `, [groupId, senderAddress]);

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Create message
    const result = await pool.query(`
      INSERT INTO messages (group_id, sender_address, sender_username, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id, group_id, sender_address, sender_username, content, created_at
    `, [groupId, senderAddress, username, content]);

    res.json({ message: result.rows[0] });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(400).json({ error: error.message || 'Failed to send message' });
  }
});

// GET /api/groups/:groupId/members/:userAddress
router.get('/:groupId/members/:userAddress', async (req, res) => {
  try {
    const { groupId, userAddress } = req.params;
    const result = await pool.query(`
      SELECT * FROM group_members WHERE group_id = $1 AND user_address = $2
    `, [groupId, userAddress]);

    res.json({ isMember: result.rows.length > 0 });
  } catch (error) {
    console.error('Error checking membership:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### Step 7: Environment Variables

**.env**:
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PLATFORM_PAYMENT_ADDRESS=BWg1ZSZqvmXdUSuuXbssBM9Qjgyo3mzJrQap7KuQ8mZZ
PLATFORM_CREATE_FEE=0.01
PLATFORM_JOIN_FEE_PERCENTAGE=0.01
PORT=3000
NODE_ENV=production
```

### Step 8: Package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### Step 9: Deploy

1. **Push to GitHub**
2. **Connect to Railway/Render**:
   - Import from GitHub
   - Set environment variables
   - Deploy automatically

3. **Get your API URL** (e.g., `https://your-app.up.railway.app`)

4. **Update Mobile App**:
   ```bash
   # In your React Native app
   EXPO_PUBLIC_API_URL=https://your-app.up.railway.app
   ```

## 🎯 Quick Start Checklist

- [ ] Choose hosting platform (Railway recommended)
- [ ] Create database (PostgreSQL)
- [ ] Set up API project (Node.js + Express)
- [ ] Implement payment verification
- [ ] Deploy API
- [ ] Update `EXPO_PUBLIC_API_URL` in mobile app
- [ ] Test group creation and joining

## 💡 Tips

1. **Start with Railway** - easiest setup, includes database
2. **Use devnet first** - test with `https://api.devnet.solana.com` before mainnet
3. **Monitor logs** - check Railway/Render logs for errors
4. **Add rate limiting** - use `express-rate-limit` package
5. **Add CORS properly** - allow your mobile app domain

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## Need Help?

If you get stuck:
1. Check the logs in your hosting platform
2. Verify environment variables are set correctly
3. Test API endpoints with Postman or curl
4. Make sure database connection string is correct

