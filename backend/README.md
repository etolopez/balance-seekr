# Balance Seekr Backend API

Backend API for Balance Seekr - Mastermind groups with Solana payments.

## Features

- User management with unique usernames
- Public Mastermind groups
- Solana payment verification
- Group messaging
- X (Twitter) account sync for verified badges

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `PLATFORM_PAYMENT_ADDRESS` - Your platform's Solana address for receiving fees
- `PLATFORM_CREATE_FEE` - Fee in SOL for creating groups
- `PLATFORM_JOIN_FEE_PERCENTAGE` - Percentage fee for joining groups

### 3. Database Setup

The database tables will be automatically created on first run. Make sure your PostgreSQL database is running and accessible.

### 4. Run the Server

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### Users

- `GET /api/users/:address` - Get user profile
- `GET /api/users/username/check?username=...` - Check username availability
- `POST /api/users/username` - Register username
- `POST /api/users/x-sync` - Sync X account

### Groups

- `GET /api/groups/public` - Get all public groups
- `POST /api/groups` - Create a new group
- `POST /api/groups/:groupId/join` - Join a group
- `GET /api/groups/:groupId/members/:address` - Check membership
- `PATCH /api/groups/:groupId/join-price` - Update join price

### Messages

- `GET /api/groups/:groupId/messages` - Get group messages
- `POST /api/groups/:groupId/messages` - Send a message

## Railway Deployment

1. Connect your GitHub repository to Railway
2. Add a PostgreSQL service
3. Set environment variables in Railway dashboard
4. Deploy!

The server will automatically initialize the database on first run.

## Database Schema

See `src/models/database.js` for the complete schema. Tables include:
- `users` - User profiles with usernames and X handles
- `groups` - Public Mastermind groups
- `group_members` - Group membership tracking
- `messages` - Group messages

