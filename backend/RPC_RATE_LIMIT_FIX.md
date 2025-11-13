# RPC Rate Limit Fix

## Problem
The default Solana RPC endpoint (public mainnet) has strict rate limits (429 Too Many Requests), causing payment verification to fail.

## Solution Options

### Option 1: Use a Better RPC Provider (Recommended)

Add one of these RPC providers to your Railway environment variables:

#### Helius (Free tier available)
1. Sign up at https://www.helius.dev/
2. Get your API key
3. Add to Railway: `SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY`

#### QuickNode (Free tier available)
1. Sign up at https://www.quicknode.com/
2. Create a Solana mainnet endpoint
3. Add to Railway: `SOLANA_RPC_URL=YOUR_QUICKNODE_ENDPOINT_URL`

#### Alchemy (Free tier available)
1. Sign up at https://www.alchemy.com/
2. Create a Solana app
3. Add to Railway: `SOLANA_RPC_URL=YOUR_ALCHEMY_ENDPOINT_URL`

### Option 2: Use Current Fix (Exponential Backoff)

The code now includes:
- Exponential backoff (3s, 6s, 12s, 24s delays)
- Special handling for rate limit errors (longer delays)
- Up to 5 retry attempts

This should help, but a better RPC provider is still recommended for production.

## How to Add RPC URL to Railway

1. Go to your Railway project dashboard
2. Select your **backend service** (not PostgreSQL)
3. Go to the **Variables** tab
4. Add a new variable:
   - **Name**: `SOLANA_RPC_URL`
   - **Value**: Your RPC endpoint URL (from Helius, QuickNode, or Alchemy)
5. Save - Railway will automatically redeploy

## Current Default

If `SOLANA_RPC_URL` is not set, it defaults to the public Solana mainnet RPC, which has strict rate limits.

## Testing

After adding a better RPC URL, try creating a group again. The rate limit errors should be resolved.

