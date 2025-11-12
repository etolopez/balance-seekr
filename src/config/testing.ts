/**
 * Testing Configuration
 * Enable testing mode to allow creating groups and testing payments without backend API
 */

// Set to true to enable testing mode (bypasses backend API requirements)
export const TESTING_MODE = process.env.EXPO_PUBLIC_TESTING_MODE === 'true' || process.env.EXPO_PUBLIC_TESTING_MODE === '1';

// In testing mode, generate mock transaction signatures
export function generateMockSignature(): string {
  // Generate a mock transaction signature for testing
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 88; i++) { // Solana signatures are 88 base58 characters
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

