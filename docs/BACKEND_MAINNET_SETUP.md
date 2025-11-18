# Backend Mainnet Configuration

Guide for configuring the backend to use Solana mainnet.

## Required Environment Variables

Add these to your Railway backend service:

### 1. Solana Cluster
```
SOLANA_CLUSTER=mainnet-beta
```

### 2. Solana RPC URL (Helius)
```
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=49cddfcb-7e1a-4b4b-a562-c9e23e424bd1
```

**Why Helius?**
- Better rate limits than public RPC
- More reliable for production
- Faster transaction indexing
- Better for payment verification

### 3. Platform Payment Address
```
PLATFORM_PAYMENT_ADDRESS=BWg1ZSZqvmXdUSuuXbssBM9Qjgyo3mzJrQap7KuQ8mZZ
```

## How to Add in Railway

1. Go to Railway Dashboard
2. Select your backend service
3. Click on "Variables" tab
4. Add each variable:
   - Click "New Variable"
   - Enter variable name (e.g., `SOLANA_CLUSTER`)
   - Enter value (e.g., `mainnet-beta`)
   - Click "Add"
5. Repeat for all variables above

## Verification

After adding variables, the backend will automatically redeploy. Check logs to verify:

```bash
# In Railway logs, you should see:
[Solana] RPC Configuration: {
  cluster: 'mainnet-beta',
  rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=...'
}
```

## Important Notes

⚠️ **Security:**
- Keep your Helius API key secure
- Don't commit API keys to Git
- Rotate keys if exposed

⚠️ **Rate Limits:**
- Helius has generous rate limits for paid plans
- Free tier may have limits
- Monitor for rate limit errors

⚠️ **Mainnet:**
- All transactions will use real SOL
- Test thoroughly before public release
- Ensure wallet has sufficient SOL for fees

## Testing

After configuration:
1. Test payment verification
2. Test Mastermind creation
3. Test joining groups
4. Monitor for RPC errors

## Troubleshooting

**If you see rate limit errors:**
- Check Helius dashboard for usage
- Consider upgrading Helius plan
- Verify API key is correct

**If transactions aren't verifying:**
- Check RPC URL is correct
- Verify cluster matches frontend (mainnet-beta)
- Check Railway logs for errors

