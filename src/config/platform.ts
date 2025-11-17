/**
 * Platform Configuration
 * Settings for the Masterminds platform including fees and payment addresses
 */

// Platform fee for creating a public group (in USDC)
// This fee is always required, even for free-to-join groups
export const PLATFORM_CREATE_FEE_USDC = 6.9; // 6.9 USDC

// USDC mint addresses (SPL token)
// Mainnet: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
// Devnet: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
export const USDC_MINT_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDC_MINT_DEVNET = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

/**
 * Get USDC mint address based on current cluster
 */
export function getUSDCMintAddress(): string {
  const cluster = process.env.EXPO_PUBLIC_SOLANA_CLUSTER || 'devnet';
  return cluster === 'mainnet-beta' ? USDC_MINT_MAINNET : USDC_MINT_DEVNET;
}

// Platform address to receive all fees (creation fees and 1% of join fees)
export const PLATFORM_PAYMENT_ADDRESS = process.env.EXPO_PUBLIC_PLATFORM_ADDRESS || 'BWg1ZSZqvmXdUSuuXbssBM9Qjgyo3mzJrQap7KuQ8mZZ';

// Platform fee percentage on join payments (1% = 0.01)
export const PLATFORM_JOIN_FEE_PERCENTAGE = 0.01; // 1%

// Default payment address for join fees (if group owner wants to receive payments)
// If not set, join payments go to the platform
export const DEFAULT_JOIN_PAYMENT_ADDRESS = process.env.EXPO_PUBLIC_PLATFORM_ADDRESS || PLATFORM_PAYMENT_ADDRESS;

