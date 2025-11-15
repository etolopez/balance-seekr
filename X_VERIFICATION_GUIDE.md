# X (Twitter) Verification Implementation Guide

This guide explains how to implement X (Twitter) account verification for Mastermind creators, allowing them to display their X username and a verified badge on their profile.

## Current Status

✅ **Backend**: API endpoint exists (`POST /api/users/x-sync`) but verification is not implemented (marked as TODO)  
✅ **Frontend**: UI components exist to display X handle and verified badge  
❌ **OAuth Flow**: Not implemented - needs to be added  
❌ **Verification Logic**: Not implemented - needs to be added  

## Overview

The verification process will:
1. Allow users to connect their X account via OAuth
2. Verify they own the X account
3. Store the X handle and verification status in the database
4. Display the X username and verified badge on their profile
5. Show verified badge for creators in Mastermind cards

## Implementation Steps

### Step 1: Set Up X Developer Account

1. Go to [X Developer Portal](https://developer.twitter.com/)
2. Create a developer account (if you don't have one)
3. Create a new App/Project
4. Get your API credentials:
   - **API Key** (Consumer Key)
   - **API Secret** (Consumer Secret)
   - **Bearer Token** (for API v2)

5. Configure OAuth settings:
   - **Callback URL**: `yourapp://oauth/callback` (for mobile)
   - **App permissions**: Read user profile, Read tweets (for verification)

### Step 2: Install Required Packages

```bash
npm install expo-auth-session expo-crypto expo-web-browser
```

### Step 3: Create X OAuth Service

Create `src/services/x-auth.service.ts`:

```typescript
/**
 * X (Twitter) OAuth Service
 * Handles X account authentication and verification
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';

// Complete the auth session for better UX
WebBrowser.maybeCompleteAuthSession();

const X_API_KEY = Constants.expoConfig?.extra?.X_API_KEY || process.env.EXPO_PUBLIC_X_API_KEY;
const X_API_SECRET = Constants.expoConfig?.extra?.X_API_SECRET || process.env.EXPO_PUBLIC_X_API_SECRET;

export interface XAuthResult {
  oauthToken: string;
  oauthTokenSecret: string;
  userId: string;
  screenName: string; // X username without @
  verified: boolean;
}

export class XAuthService {
  /**
   * Initiate X OAuth flow
   * Returns authorization URL that user should visit
   */
  async initiateAuth(): Promise<{ authUrl: string; oauthToken: string; oauthTokenSecret: string }> {
    // Step 1: Request OAuth token
    const response = await fetch('https://api.twitter.com/oauth/request_token', {
      method: 'POST',
      headers: {
        'Authorization': this.generateOAuthHeader('POST', 'https://api.twitter.com/oauth/request_token', {}),
      },
    });

    const text = await response.text();
    const params = new URLSearchParams(text);
    const oauthToken = params.get('oauth_token');
    const oauthTokenSecret = params.get('oauth_token_secret');

    if (!oauthToken || !oauthTokenSecret) {
      throw new Error('Failed to get OAuth token from X');
    }

    // Step 2: Generate authorization URL
    const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`;

    return { authUrl, oauthToken, oauthTokenSecret };
  }

  /**
   * Complete OAuth flow after user authorizes
   */
  async completeAuth(oauthToken: string, oauthTokenSecret: string, oauthVerifier: string): Promise<XAuthResult> {
    // Exchange verifier for access token
    const response = await fetch('https://api.twitter.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Authorization': this.generateOAuthHeader(
          'POST',
          'https://api.twitter.com/oauth/access_token',
          { oauth_verifier: oauthVerifier },
          oauthToken,
          oauthTokenSecret
        ),
      },
      body: new URLSearchParams({ oauth_verifier: oauthVerifier }),
    });

    const text = await response.text();
    const params = new URLSearchParams(text);
    const accessToken = params.get('oauth_token');
    const accessTokenSecret = params.get('oauth_token_secret');
    const userId = params.get('user_id');
    const screenName = params.get('screen_name');

    if (!accessToken || !accessTokenSecret || !userId || !screenName) {
      throw new Error('Failed to complete X OAuth');
    }

    // Verify the account (check if it's verified on X)
    const verified = await this.checkAccountVerified(accessToken, accessTokenSecret, userId);

    return {
      oauthToken: accessToken,
      oauthTokenSecret: accessTokenSecret,
      userId,
      screenName,
      verified,
    };
  }

  /**
   * Check if X account is verified (has blue checkmark)
   */
  private async checkAccountVerified(accessToken: string, accessTokenSecret: string, userId: string): Promise<boolean> {
    try {
      // Use Twitter API v2 to check verification status
      const response = await fetch(`https://api.twitter.com/2/users/${userId}?user.fields=verified`, {
        headers: {
          'Authorization': `Bearer ${Constants.expoConfig?.extra?.X_BEARER_TOKEN || process.env.EXPO_PUBLIC_X_BEARER_TOKEN}`,
        },
      });

      const data = await response.json();
      return data.data?.verified === true;
    } catch (error) {
      console.error('[XAuth] Error checking verification status:', error);
      return false;
    }
  }

  /**
   * Generate OAuth 1.0a authorization header
   */
  private generateOAuthHeader(
    method: string,
    url: string,
    params: Record<string, string>,
    token?: string,
    tokenSecret?: string
  ): string {
    // OAuth 1.0a signature generation
    // This is a simplified version - you may need a library like 'oauth-1.0a' for production
    const oauthParams = {
      oauth_consumer_key: X_API_KEY!,
      oauth_nonce: Crypto.randomUUID(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: '1.0',
      ...(token && { oauth_token: token }),
      ...params,
    };

    // Generate signature (simplified - use a proper OAuth library in production)
    // For now, we'll use a simpler approach with expo-auth-session
    return 'OAuth ' + Object.entries(oauthParams)
      .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
      .join(', ');
  }
}
```

**Note**: OAuth 1.0a is complex. Consider using a library like `oauth-1.0a` or `twitter-api-v2` for Node.js backend.

### Step 4: Alternative Approach - Web-Based OAuth (Recommended)

For React Native, a simpler approach is to use a web-based OAuth flow:

Create `src/services/x-auth.service.ts` (Simplified):

```typescript
/**
 * X (Twitter) OAuth Service - Web-based flow
 * Uses expo-web-browser for OAuth
 */

import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const X_CLIENT_ID = Constants.expoConfig?.extra?.X_CLIENT_ID || process.env.EXPO_PUBLIC_X_CLIENT_ID;
const REDIRECT_URI = 'yourapp://oauth/callback';

export interface XAuthResult {
  accessToken: string;
  userId: string;
  screenName: string;
  verified: boolean;
}

export class XAuthService {
  /**
   * Start X OAuth flow using web browser
   */
  async authenticate(): Promise<XAuthResult | null> {
    try {
      // For X OAuth 2.0 (simpler, but requires backend proxy)
      // Or use OAuth 1.0a with a backend proxy
      
      // Option 1: Use your backend as OAuth proxy
      const backendUrl = Constants.expoConfig?.extra?.API_URL || process.env.EXPO_PUBLIC_API_URL;
      const authUrl = `${backendUrl}/api/auth/x/authorize?redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
      
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          // Exchange code for token via backend
          return await this.exchangeCodeForToken(code);
        }
      }
      
      return null;
    } catch (error) {
      console.error('[XAuth] Authentication error:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(code: string): Promise<XAuthResult> {
    const backendUrl = Constants.expoConfig?.extra?.API_URL || process.env.EXPO_PUBLIC_API_URL;
    
    const response = await fetch(`${backendUrl}/api/auth/x/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    return data;
  }
}
```

### Step 5: Implement Backend OAuth Proxy

Since OAuth 1.0a is complex for mobile, create a backend proxy:

Create `backend/src/routes/auth.js`:

```javascript
import express from 'express';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import fetch from 'node-fetch';

const router = express.Router();

const X_API_KEY = process.env.X_API_KEY;
const X_API_SECRET = process.env.X_API_SECRET;
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN;

const oauth = new OAuth({
  consumer: { key: X_API_KEY, secret: X_API_SECRET },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString, key) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64');
  },
});

/**
 * GET /api/auth/x/authorize
 * Initiate X OAuth flow
 */
router.get('/x/authorize', async (req, res) => {
  try {
    const { redirect_uri } = req.query;
    
    // Request token
    const requestData = {
      url: 'https://api.twitter.com/oauth/request_token',
      method: 'POST',
      data: { oauth_callback: redirect_uri },
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData));
    
    const response = await fetch(requestData.url, {
      method: 'POST',
      headers: { Authorization: authHeader.Authorization },
    });

    const text = await response.text();
    const params = new URLSearchParams(text);
    const oauthToken = params.get('oauth_token');
    const oauthTokenSecret = params.get('oauth_token_secret');

    // Store token secret in session (in production, use Redis or database)
    req.session.oauthTokenSecret = oauthTokenSecret;

    // Redirect to X authorization
    const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`;
    res.redirect(authUrl);
  } catch (error) {
    console.error('[Auth] Error initiating X OAuth:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate X OAuth' });
  }
});

/**
 * GET /api/auth/x/callback
 * Handle X OAuth callback
 */
router.get('/x/callback', async (req, res) => {
  try {
    const { oauth_token, oauth_verifier } = req.query;
    const oauthTokenSecret = req.session.oauthTokenSecret;

    // Exchange verifier for access token
    const requestData = {
      url: 'https://api.twitter.com/oauth/access_token',
      method: 'POST',
      data: { oauth_verifier },
    };

    const authHeader = oauth.toHeader(
      oauth.authorize(requestData, { key: oauth_token, secret: oauthTokenSecret })
    );

    const response = await fetch(requestData.url, {
      method: 'POST',
      headers: { Authorization: authHeader.Authorization },
    });

    const text = await response.text();
    const params = new URLSearchParams(text);
    const accessToken = params.get('oauth_token');
    const accessTokenSecret = params.get('oauth_token_secret');
    const userId = params.get('user_id');
    const screenName = params.get('screen_name');

    // Get user info to check verification
    const userInfo = await fetch(`https://api.twitter.com/2/users/${userId}?user.fields=verified`, {
      headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` },
    });
    const userData = await userInfo.json();
    const verified = userData.data?.verified === true;

    // Return to app with code
    const redirectUri = req.query.redirect_uri || 'yourapp://oauth/callback';
    const code = Buffer.from(JSON.stringify({ accessToken, accessTokenSecret, userId, screenName, verified })).toString('base64');
    
    res.redirect(`${redirectUri}?code=${code}`);
  } catch (error) {
    console.error('[Auth] Error handling X OAuth callback:', error);
    res.status(500).json({ success: false, message: 'Failed to complete X OAuth' });
  }
});

/**
 * POST /api/auth/x/token
 * Exchange code for token (for mobile app)
 */
router.post('/x/token', async (req, res) => {
  try {
    const { code } = req.body;
    
    // Decode the code (in production, use proper JWT or session)
    const data = JSON.parse(Buffer.from(code, 'base64').toString());
    
    res.json({
      success: true,
      accessToken: data.accessToken,
      accessTokenSecret: data.accessTokenSecret,
      userId: data.userId,
      screenName: data.screenName,
      verified: data.verified,
    });
  } catch (error) {
    console.error('[Auth] Error exchanging code:', error);
    res.status(500).json({ success: false, message: 'Invalid code' });
  }
});

export default router;
```

### Step 6: Update Backend X Sync Endpoint

Update `backend/src/routes/users.js`:

```javascript
/**
 * POST /api/users/x-sync
 * Sync X account with verification
 */
router.post('/x-sync',
  validateRequired(['userAddress', 'xHandle', 'verificationToken']),
  validateWalletAddress,
  async (req, res) => {
    try {
      const { userAddress, xHandle, verificationToken } = req.body;

      // Verify the token matches the X account
      // In production, verify the token is valid and matches the handle
      const isValid = await verifyXToken(verificationToken, xHandle);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid X verification token',
        });
      }

      // Check if account is verified on X
      const isVerified = await checkXVerification(xHandle);

      const user = await upsertUser(userAddress, {
        x_handle: xHandle.replace(/^@/, ''),
        x_verified: isVerified,
        x_verified_at: isVerified ? new Date() : null,
      });

      res.json({
        success: true,
        verified: user.x_verified || false,
        message: isVerified ? 'X account verified successfully' : 'X account synced. Verification pending.',
      });
    } catch (error) {
      console.error('[Users] Error syncing X account:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
);
```

### Step 7: Update Frontend Store

Update `src/state/store.ts` `syncXAccount` function:

```typescript
syncXAccount: async (xHandle: string) => {
  const state = get();
  if (!state.verifiedAddress) {
    throw new Error('Wallet not connected. Please connect your wallet first.');
  }

  // Use X Auth Service to authenticate
  const { XAuthService } = await import('../services/x-auth.service');
  const xAuth = new XAuthService();
  
  try {
    const authResult = await xAuth.authenticate();
    
    if (!authResult) {
      throw new Error('X authentication cancelled or failed');
    }

    // Verify the handle matches
    if (authResult.screenName.toLowerCase() !== xHandle.replace(/^@/, '').toLowerCase()) {
      throw new Error('X handle does not match authenticated account');
    }

    const { ApiService } = await import('../services/api.service');
    const apiService = new ApiService();
    
    // Sync with backend (pass verification token)
    const result = await apiService.syncXAccount(
      state.verifiedAddress,
      authResult.screenName,
      authResult.accessToken // Pass token for verification
    );
    
    // Update local state
    dbApi.upsertPref('profile.xHandle', authResult.screenName);
    dbApi.upsertPref('profile.verified', result.verified ? 'true' : 'false');
    set(() => ({
      xHandle: authResult.screenName,
      verified: result.verified,
    }));
  } catch (error: any) {
    console.error('[Store] Error syncing X account:', error);
    throw error;
  }
},
```

### Step 8: Update UI to Show Verified Badge

The UI already exists in `src/app/(tabs)/groups.tsx`. Ensure it displays correctly:

```typescript
// In Profile Modal
{verified && (
  <View style={styles.verifiedBadge}>
    <Ionicons name="checkmark-circle" size={16} color={colors.success.main} />
    <Text style={styles.verifiedText}>Verified</Text>
  </View>
)}

{xHandle && (
  <Text style={styles.xHandleText}>@{xHandle}</Text>
)}
```

### Step 9: Show Verified Badge for Creators

Update Mastermind cards to show verified badge for creators:

```typescript
// In Discover cards and My Masterminds cards
{group.ownerUsername && (
  <View style={styles.creatorInfo}>
    <Text style={styles.creatorName}>{group.ownerUsername}</Text>
    {group.ownerVerified && (
      <Ionicons name="checkmark-circle" size={14} color={colors.success.main} />
    )}
    {group.ownerXHandle && (
      <Text style={styles.creatorXHandle}>@{group.ownerXHandle}</Text>
    )}
  </View>
)}
```

### Step 10: Environment Variables

Add to `.env`:
```
EXPO_PUBLIC_X_API_KEY=your_api_key
EXPO_PUBLIC_X_API_SECRET=your_api_secret
EXPO_PUBLIC_X_BEARER_TOKEN=your_bearer_token
```

Add to `app.json`:
```json
{
  "extra": {
    "X_API_KEY": "your_api_key",
    "X_API_SECRET": "your_api_secret",
    "X_BEARER_TOKEN": "your_bearer_token"
  }
}
```

Add to Railway backend environment variables:
- `X_API_KEY`
- `X_API_SECRET`
- `X_BEARER_TOKEN`

## Alternative: Simpler Verification Method

If OAuth is too complex, you can use a simpler verification method:

1. User enters their X handle
2. User posts a verification message on X (e.g., "Verifying my @YourApp account: [wallet_address]")
3. Backend checks X API for the verification message
4. If found, mark as verified

This is simpler but less secure. OAuth is recommended for production.

## Testing

1. Test OAuth flow on a device (not simulator)
2. Verify the callback URL works
3. Test verification badge display
4. Test creator badge display in Mastermind cards

## Security Considerations

1. **Never expose API secrets** in frontend code
2. Use backend proxy for OAuth
3. Store tokens securely (use secure storage)
4. Validate tokens on backend
5. Rate limit verification requests

## Next Steps

1. Choose OAuth approach (web-based with backend proxy recommended)
2. Set up X Developer account and get credentials
3. Implement backend OAuth proxy
4. Implement frontend OAuth service
5. Update UI to show verified badges
6. Test end-to-end flow

