/**
 * X (Twitter) OAuth Service
 * Handles X account authentication via OAuth flow
 */

import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { ApiService } from './api.service';

// Complete the auth session for better UX
WebBrowser.maybeCompleteAuthSession();

export interface XOAuthResult {
  screenName: string; // X username without @
  userId: string;
  verified: boolean;
}

export class XOAuthService {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
  }

  /**
   * Initiate X OAuth flow
   * Opens X authentication in browser and returns user info
   */
  async authenticate(userAddress: string): Promise<XOAuthResult> {
    try {
      const backendUrl = Constants.expoConfig?.extra?.API_URL || process.env.EXPO_PUBLIC_API_URL;
      if (!backendUrl) {
        throw new Error('Backend API URL not configured');
      }

      // Generate redirect URI for OAuth callback
      const redirectUri = `${backendUrl}/api/auth/x/callback?userAddress=${encodeURIComponent(userAddress)}`;
      
      // Step 1: Get authorization URL from backend
      const authUrlResponse = await fetch(
        `${backendUrl}/api/auth/x/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&userAddress=${encodeURIComponent(userAddress)}`
      );

      if (!authUrlResponse.ok) {
        const error = await authUrlResponse.json().catch(() => ({ message: authUrlResponse.statusText }));
        throw new Error(error.message || 'Failed to initiate X OAuth');
      }

      const { authUrl } = await authUrlResponse.json();

      if (!authUrl) {
        throw new Error('No authorization URL returned from backend');
      }

      // Step 2: Open X authorization in browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      if (result.type !== 'success' || !result.url) {
        throw new Error('X authentication was cancelled or failed');
      }

      // Step 3: Extract callback data from URL
      const url = new URL(result.url);
      const oauthToken = url.searchParams.get('oauth_token');
      const oauthVerifier = url.searchParams.get('oauth_verifier');

      if (!oauthToken || !oauthVerifier) {
        throw new Error('Invalid OAuth callback - missing parameters');
      }

      // Step 4: Complete OAuth flow via backend
      const callbackResponse = await fetch(
        `${backendUrl}/api/auth/x/callback?oauth_token=${oauthToken}&oauth_verifier=${oauthVerifier}`
      );

      if (!callbackResponse.ok) {
        const error = await callbackResponse.json().catch(() => ({ message: callbackResponse.statusText }));
        throw new Error(error.message || 'Failed to complete X OAuth');
      }

      const userData = await callbackResponse.json();

      if (!userData.success || !userData.screenName) {
        throw new Error('Failed to get X username from OAuth');
      }

      return {
        screenName: userData.screenName,
        userId: userData.userId || '',
        verified: userData.verified || false,
      };
    } catch (error: any) {
      console.error('[XOAuth] Authentication error:', error);
      throw error;
    }
  }
}

