# Production Deployment Checklist

Complete checklist for deploying Balance Seekr to production.

## ✅ Pre-Deployment Checklist

### 1. Network Configuration
- [x] **Frontend:** Switched to `mainnet-beta` in `src/config/solana.ts`
- [ ] **Backend:** Verify backend is configured for mainnet-beta
- [ ] **RPC Endpoint:** Consider using a dedicated RPC provider (Helius, QuickNode, etc.) for better reliability

### 2. Environment Variables

**Frontend (app.json):**
- [x] API URL: `https://balance-seekr-production.up.railway.app`
- [x] Cluster: `mainnet-beta` (default)

**Backend (Railway):**
- [ ] `CLUSTER=mainnet-beta`
- [ ] `SOLANA_RPC` - Use dedicated RPC provider for production
- [ ] `PLATFORM_PAYMENT_ADDRESS` - Mainnet wallet address
- [ ] All X API credentials configured

### 3. Build Configuration
- [x] `eas.json` configured for APK production builds
- [x] `app.json` package name: `com.balanceseekr.app`
- [x] Version: `1.0.0`
- [x] Version code: `1`

### 4. Testing
- [ ] Test wallet connection on mainnet
- [ ] Test Mastermind creation (0.05 SOL fee)
- [ ] Test joining paid/free Masterminds
- [ ] Test all features (Habits, Journal, Tasks, Breathwork)
- [ ] Test badge system
- [ ] Test X account sync

## Building Production APK

### Step 1: Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Build Production APK
```bash
eas build --platform android --profile production
```

**Build Time:** 15-30 minutes

### Step 4: Monitor Build
- Visit https://expo.dev
- Go to your project → Builds
- Monitor progress in real-time

### Step 5: Download APK
Once build completes:
```bash
eas build:list
eas build:download [BUILD_ID]
```

Or download from Expo dashboard.

## Post-Build Checklist

- [ ] Download APK from EAS dashboard
- [ ] Test APK on physical Android device
- [ ] Verify all features work correctly
- [ ] Test Solana wallet integration
- [ ] Test Mastermind creation and joining
- [ ] Verify mainnet transactions work

## Backend Verification

Ensure backend is configured for mainnet:

1. **Check Railway Environment Variables:**
   - `CLUSTER=mainnet-beta`
   - `SOLANA_RPC` - Use production RPC endpoint
   - `PLATFORM_PAYMENT_ADDRESS` - Mainnet wallet address

2. **Test Backend Endpoints:**
   ```bash
   curl https://balance-seekr-production.up.railway.app/health
   ```

3. **Verify Payment Verification:**
   - Backend should verify mainnet transactions
   - RPC endpoint should be mainnet-compatible

## Important Notes

⚠️ **Mainnet Considerations:**
- Real SOL/USDC will be used (not test tokens)
- Transactions are permanent and cost real fees
- Ensure wallet has sufficient SOL for fees
- Test thoroughly before public release

⚠️ **RPC Rate Limits:**
- Public RPC endpoints have rate limits
- Consider using dedicated RPC provider for production
- Monitor for rate limit errors

## Next Steps

1. Build production APK
2. Test thoroughly on mainnet
3. Prepare for Solana Mobile dApp Store submission
4. Follow `docs/SOLANA_MOBILE_DAPP_STORE_SUBMISSION.md`

## Resources

- **EAS Build Dashboard:** https://expo.dev
- **Solana Mainnet RPC:** https://docs.solana.com/cluster/rpc-endpoints
- **Dedicated RPC Providers:**
  - Helius: https://www.helius.dev
  - QuickNode: https://www.quicknode.com
  - Alchemy: https://www.alchemy.com

