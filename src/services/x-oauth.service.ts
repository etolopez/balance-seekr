/**
 * X (Twitter) OAuth Service
 * Handles X account authentication via OAuth flow
 * 
 * Note: Full OAuth flow requires deep linking setup.
 * For now, we'll use a simplified approach that opens X in browser
 * and uses a web-based callback page.
 */

import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { ApiService } from './api.service';
import { Alert } from 'react-native';

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
   * Opens X authentication in browser
   * 
   * Note: This uses a simplified flow where the user completes OAuth in browser
   * and the backend automatically syncs the account when callback is received.
   */
  async authenticate(userAddress: string): Promise<XOAuthResult> {
    try {
      const backendUrl = Constants.expoConfig?.extra?.API_URL || process.env.EXPO_PUBLIC_API_URL;
      if (!backendUrl) {
        throw new Error('Backend API URL not configured');
      }

      // Generate redirect URI - use a web page that shows success message
      const redirectUri = `${backendUrl}/api/auth/x/callback?userAddress=${encodeURIComponent(userAddress)}`;
      
      // Step 1: Get authorization URL from backend
      const authUrl = `${backendUrl}/api/auth/x/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&userAddress=${encodeURIComponent(userAddress)}`;
      console.log('[XOAuth] Requesting auth URL from:', authUrl);
      
      const authUrlResponse = await fetch(authUrl);

      if (!authUrlResponse.ok) {
        const errorText = await authUrlResponse.text().catch(() => authUrlResponse.statusText);
        console.error('[XOAuth] Backend error response:', {
          status: authUrlResponse.status,
          statusText: authUrlResponse.statusText,
          body: errorText
        });
        
        let errorMessage = 'Failed to initiate X OAuth';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const { authUrl } = await authUrlResponse.json();

      if (!authUrl) {
        throw new Error('No authorization URL returned from backend');
      }

      // Step 2: Open X authorization in browser
      const canOpen = await Linking.canOpenURL(authUrl);
      if (!canOpen) {
        throw new Error('Cannot open X authentication URL');
      }

      // Show instructions to user
      return new Promise((resolve, reject) => {
        Alert.alert(
          'Open X to Authenticate',
          'You will be redirected to X to authenticate your account. After authorizing, return to this app and your X username will be automatically synced.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => reject(new Error('X authentication cancelled')),
            },
            {
              text: 'Open X',
              onPress: async () => {
                try {
                  // Open the auth URL in browser
                  await Linking.openURL(authUrl);
                  
                  // Poll the backend to check if OAuth completed
                  // The backend will automatically sync when callback is received
                  const maxAttempts = 30; // 30 seconds max
                  let attempts = 0;
                  
                  const checkInterval = setInterval(async () => {
                    attempts++;
                    
                    try {
                      // Check if user profile has been updated with X handle
                      const { ApiService } = await import('./api.service');
                      const apiService = new ApiService();
                      const profile = await apiService.getUserProfile(userAddress);
                      
                      if (profile.xHandle) {
                        clearInterval(checkInterval);
                        resolve({
                          screenName: profile.xHandle,
                          userId: '',
                          verified: profile.verified || false,
                        });
                      } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        reject(new Error('X authentication timed out. Please try again.'));
                      }
                    } catch (error) {
                      // Continue polling
                      if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        reject(new Error('Failed to verify X authentication. Please try again.'));
                      }
                    }
                  }, 1000); // Check every second
                  
                  // Show a message that we're waiting
                  Alert.alert(
                    'Authenticating...',
                    'Please complete the authentication in X, then return to this app. We will automatically detect when you\'re done.',
                    [{ text: 'OK' }]
                  );
                } catch (error: any) {
                  reject(error);
                }
              },
            },
          ]
        );
      });
    } catch (error: any) {
      console.error('[XOAuth] Authentication error:', error);
      throw error;
    }
  }
}
