# Devnet Setup Guide

## Backend Environment Variables (Railway)

To use devnet, you need to set these environment variables in your **backend service** on Railway:

### Required Variables:

1. **SOLANA_CLUSTER**
   - Value: `devnet`
   - This tells the backend which Solana cluster to use

2. **SOLANA_RPC_URL** (Optional but recommended)
   - Value: `https://api.devnet.solana.com`
   - Or use a devnet RPC provider like Helius devnet endpoint
   - If not set, it will use the default devnet RPC based on `SOLANA_CLUSTER`

### Important Notes:

- If you have `SOLANA_RPC_URL` set to a mainnet endpoint (like `https://mainnet.helius-rpc.com/...`), it will override the cluster setting
- **Remove or update** the `SOLANA_RPC_URL` if it's pointing to mainnet
- The backend will use `SOLANA_RPC_URL` if set, otherwise it uses `clusterApiUrl(CLUSTER)`

### How to Fix:

1. Go to Railway → Your backend service → Variables tab
2. Check if `SOLANA_RPC_URL` exists and points to mainnet
3. Either:
   - **Option A**: Delete `SOLANA_RPC_URL` and set `SOLANA_CLUSTER=devnet` (will use default devnet RPC)
   - **Option B**: Set `SOLANA_RPC_URL=https://api.devnet.solana.com` and `SOLANA_CLUSTER=devnet`
4. Save - Railway will automatically redeploy

### Verify:

After redeploying, check the Railway logs. You should see:
```
[Solana] RPC Configuration: {
  cluster: 'devnet',
  rpcUrl: 'https://api.devnet.solana.com',
  hasCustomRpc: false
}
```

If you see `mainnet` or a mainnet RPC URL, the environment variables aren't set correctly.

