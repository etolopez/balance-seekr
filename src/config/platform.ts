/**
 * Platform Configuration
 * Settings for the Masterminds platform including fees and payment addresses
 */

// Platform fee for creating a public group (in SOL)
// This fee is always required, even for free-to-join groups
export const PLATFORM_CREATE_FEE = 0.1; // 0.1 SOL

// Platform address to receive all fees (creation fees and 1% of join fees)
export const PLATFORM_PAYMENT_ADDRESS = process.env.EXPO_PUBLIC_PLATFORM_ADDRESS || 'BWg1ZSZqvmXdUSuuXbssBM9Qjgyo3mzJrQap7KuQ8mZZ';

// Platform fee percentage on join payments (1% = 0.01)
export const PLATFORM_JOIN_FEE_PERCENTAGE = 0.01; // 1%

// Default payment address for join fees (if group owner wants to receive payments)
// If not set, join payments go to the platform
export const DEFAULT_JOIN_PAYMENT_ADDRESS = process.env.EXPO_PUBLIC_PLATFORM_ADDRESS || PLATFORM_PAYMENT_ADDRESS;

