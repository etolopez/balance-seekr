/**
 * Authentication routes for OAuth flows
 * Handles X (Twitter) OAuth authentication
 */

import express from 'express';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import fetch from 'node-fetch';

const router = express.Router();

// Get X API credentials from environment
const X_API_KEY = process.env.X_API_KEY || process.env.TWITTER_API_KEY;
const X_API_SECRET = process.env.X_API_SECRET || process.env.TWITTER_API_SECRET;
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER;

// Initialize OAuth 1.0a
const oauth = new OAuth({
  consumer: { 
    key: X_API_KEY || '', 
    secret: X_API_SECRET || '' 
  },
  signature_method: 'HMAC-SHA1',
  hash_function(baseString, key) {
    return crypto.createHmac('sha1', key).update(baseString).digest('base64');
  },
});

// Store OAuth token secrets temporarily (in production, use Redis or database)
const oauthTokenStore = new Map();

/**
 * GET /api/auth/x/authorize
 * Initiate X OAuth flow
 * Returns authorization URL for the user to visit
 */
router.get('/x/authorize', async (req, res) => {
  try {
    if (!X_API_KEY || !X_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'X API credentials not configured. Please add X_API_KEY and X_API_SECRET to Railway environment variables.',
      });
    }

    const { userAddress } = req.query;

    // Step 1: Request OAuth token
    // For mobile apps, X requires oauth_callback='oob' (out-of-band)
    // This means the user will get a PIN code to enter manually
    const requestData = {
      url: 'https://api.twitter.com/oauth/request_token',
      method: 'POST',
      data: { 
        oauth_callback: 'oob', // Required for mobile/desktop apps
      },
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData));

    const response = await fetch(requestData.url, {
      method: 'POST',
      headers: { 
        Authorization: authHeader.Authorization,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate X OAuth',
      });
    }

    const text = await response.text();
    const params = new URLSearchParams(text);
    const oauthToken = params.get('oauth_token');
    const oauthTokenSecret = params.get('oauth_token_secret');

    if (!oauthToken || !oauthTokenSecret) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get OAuth token from X',
      });
    }

    // Store token secret with user address for later retrieval
    if (userAddress) {
      oauthTokenStore.set(oauthToken, { oauthTokenSecret, userAddress });
    } else {
      oauthTokenStore.set(oauthToken, { oauthTokenSecret });
    }

    // Step 2: Generate authorization URL
    const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`;

    res.json({
      success: true,
      authUrl,
      oauthToken,
      // Note: With 'oob' callback, user will get a PIN code after authorizing
      // They need to enter this PIN to complete the flow
    });
  } catch (error) {
    console.error('[Auth] Error initiating X OAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * POST /api/auth/x/verify-pin
 * Verify OAuth PIN code (for mobile apps using 'oob' callback)
 * Exchanges PIN for access token and returns user info
 */
router.post('/x/verify-pin', async (req, res) => {
  try {
    const { oauth_token, oauth_verifier, userAddress } = req.body;

    if (!oauth_token || !oauth_verifier) {
      return res.status(400).json({
        success: false,
        message: 'Missing OAuth parameters (oauth_token and oauth_verifier/PIN required)',
      });
    }

    // Retrieve stored token secret
    const stored = oauthTokenStore.get(oauth_token);
    
    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OAuth token. Please start the authentication process again.',
      });
    }

    const { oauthTokenSecret } = stored;
    // Use userAddress from request body if provided, otherwise from stored token
    const finalUserAddress = userAddress || stored.userAddress;

    // Step 3: Exchange verifier for access token
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

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({
        success: false,
        message: 'Failed to complete X OAuth',
      });
    }

    const text = await response.text();
    const params = new URLSearchParams(text);
    const accessToken = params.get('oauth_token');
    const accessTokenSecret = params.get('oauth_token_secret');
    const userId = params.get('user_id');
    const screenName = params.get('screen_name'); // This is the X username

    if (!accessToken || !screenName) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get user info from X',
      });
    }

    // Get user info to check verification status
    let isVerified = false;
    if (X_BEARER_TOKEN) {
      try {
        const userInfoResponse = await fetch(
          `https://api.twitter.com/2/users/by/username/${screenName}?user.fields=verified`,
          {
            headers: { Authorization: `Bearer ${X_BEARER_TOKEN}` },
          }
        );

        if (userInfoResponse.ok) {
          const userData = await userInfoResponse.json();
          isVerified = userData.data?.verified === true;
        }
      } catch (error) {
        // Continue without verification status
      }
    }

    // Clean up stored token
    oauthTokenStore.delete(oauth_token);

    // If userAddress was provided, automatically sync the account
    if (userAddress) {
      try {
        const { upsertUser } = await import('../models/user.js');
        await upsertUser(userAddress, {
          x_handle: screenName,
          x_verified: isVerified,
          x_verified_at: isVerified ? new Date() : null,
        });
      } catch (error) {
        // Continue even if sync fails
      }
    }

    // Return user info
    res.json({
      success: true,
      screenName, // X username without @
      userId,
      verified: isVerified,
      synced: !!userAddress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;

