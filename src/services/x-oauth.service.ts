/**
 * X (Twitter) OAuth Service
 * Handles X account authentication via OAuth flow
 * 
 * Note: X OAuth for mobile requires 'oob' callback, which means
 * the user gets a PIN code to enter manually after authorizing.
 */

import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { ApiService } from './api.service';
import { Alert, TextInput } from 'react-native';

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
   * Opens X authentication in browser, then prompts for PIN entry
   */
  async authenticate(userAddress: string): Promise<XOAuthResult> {
    try {
      const backendUrl = Constants.expoConfig?.extra?.API_URL || process.env.EXPO_PUBLIC_API_URL;
      if (!backendUrl) {
        throw new Error('Backend API URL not configured');
      }

      // Step 1: Get authorization URL from backend
      const authUrl = `${backendUrl}/api/auth/x/authorize?userAddress=${encodeURIComponent(userAddress)}`;
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

      const { authUrl: xAuthUrl, oauthToken } = await authUrlResponse.json();

      if (!xAuthUrl || !oauthToken) {
        throw new Error('No authorization URL returned from backend');
      }

      // Step 2: Open X authorization in browser
      const canOpen = await Linking.canOpenURL(xAuthUrl);
      if (!canOpen) {
        throw new Error('Cannot open X authentication URL');
      }

      // Show instructions and open X
      return new Promise((resolve, reject) => {
        Alert.alert(
          'Open X to Authenticate',
          'You will be redirected to X to authorize this app. After authorizing, X will show you a PIN code. Copy that PIN and return here.',
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
                  await Linking.openURL(xAuthUrl);
                  
                  // Wait a moment, then prompt for PIN
                  setTimeout(() => {
                    this.promptForPIN(oauthToken, userAddress, backendUrl)
                      .then(resolve)
                      .catch(reject);
                  }, 2000);
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

  /**
   * Prompt user to enter PIN code from X
   */
  private async promptForPIN(
    oauthToken: string,
    userAddress: string,
    backendUrl: string
  ): Promise<XOAuthResult> {
    return new Promise((resolve, reject) => {
      // Use Alert.prompt for PIN entry (works on iOS, Android needs alternative)
      Alert.prompt(
        'Enter PIN from X',
        'After authorizing on X, you should see a PIN code. Enter it here:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => reject(new Error('PIN entry cancelled')),
          },
          {
            text: 'Verify',
            onPress: async (pin) => {
              if (!pin || pin.trim().length === 0) {
                reject(new Error('PIN code is required'));
                return;
              }

              try {
                // Step 3: Verify PIN with backend
                const verifyResponse = await fetch(`${backendUrl}/api/auth/x/verify-pin`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    oauth_token: oauthToken,
                    oauth_verifier: pin.trim(),
                    userAddress,
                  }),
                });

                if (!verifyResponse.ok) {
                  const errorText = await verifyResponse.text().catch(() => verifyResponse.statusText);
                  let errorMessage = 'Failed to verify PIN';
                  try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                  } catch {
                    errorMessage = errorText || errorMessage;
                  }
                  throw new Error(errorMessage);
                }

                const userData = await verifyResponse.json();

                if (!userData.success || !userData.screenName) {
                  throw new Error('Failed to get X username from OAuth');
                }

                resolve({
                  screenName: userData.screenName,
                  userId: userData.userId || '',
                  verified: userData.verified || false,
                });
              } catch (error: any) {
                reject(error);
              }
            },
          },
        ],
        'plain-text' // PIN is numeric, but plain-text allows any input
      );
    });
  }
}
