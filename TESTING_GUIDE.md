# Testing Guide for Public Masterminds

## Testing Mode

To test payments and group creation without a backend API, enable **Testing Mode**.

### How to Enable Testing Mode

Set the environment variable:
```bash
EXPO_PUBLIC_TESTING_MODE=true
```

Or add it to your `.env` file:
```
EXPO_PUBLIC_TESTING_MODE=true
```

### What Testing Mode Does

When testing mode is enabled:

1. **Payment Simulation**:
   - Payments are simulated (no actual Solana transactions)
   - Mock transaction signatures are generated
   - No wallet interaction required for payments

2. **Local Group Creation**:
   - Public groups are created locally in your database
   - No backend API calls are made
   - Groups appear in "My Masterminds" immediately

3. **Local Group Joining**:
   - Joining groups works locally
   - No backend verification required
   - Groups appear in your local groups list

4. **Discover Section**:
   - Shows groups you've created locally
   - No backend API required

### Testing Workflow

1. **Enable Testing Mode**:
   ```bash
   export EXPO_PUBLIC_TESTING_MODE=true
   # Then restart your Expo app
   ```

2. **Create Public Groups**:
   - Go to Masterminds tab
   - Click "Create Public Group"
   - Fill in the form
   - Click "Create & Pay 0.01 SOL"
   - In testing mode, payment is simulated (no wallet needed)

3. **Join Groups**:
   - Go to Discover section
   - Click "Join" on any group
   - In testing mode, payment is simulated

4. **View Your Groups**:
   - Created groups appear in "My Masterminds"
   - They're marked as "Public" with a badge

### Testing with Real Payments

To test with **real Solana payments** (requires wallet):

1. **Disable Testing Mode**:
   ```bash
   unset EXPO_PUBLIC_TESTING_MODE
   # Or set to false
   export EXPO_PUBLIC_TESTING_MODE=false
   ```

2. **Set Up Backend API** (see `BACKEND_API_STRUCTURE.md`):
   - Deploy backend API
   - Set `EXPO_PUBLIC_API_URL` to your API URL
   - Payments will be real Solana transactions
   - Groups will be stored on backend

### Platform Wallet Address

The platform wallet address is set to:
```
BWg1ZSZqvmXdUSuuXbssBM9Qjgyo3mzJrQap7KuQ8mZZ
```

This address receives:
- 0.01 SOL for every public group created
- 1% of every join payment

### Testing Checklist

- [ ] Enable testing mode
- [ ] Create a public group (free to join)
- [ ] Create a public group (paid to join)
- [ ] Join a free group
- [ ] Join a paid group (simulated payment)
- [ ] View groups in "My Masterminds"
- [ ] Verify groups show "Public" badge
- [ ] Test with real payments (disable testing mode, set up backend)

### Notes

- Testing mode groups are **local only** and won't sync with backend
- When you disable testing mode and set up backend, you'll need to recreate groups
- Real payments require a backend API to verify transactions
- Platform address is hardcoded in `src/config/platform.ts`

