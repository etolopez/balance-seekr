import { Connection, PublicKey } from '@solana/web3.js';

// Defaults: Use devnet for testing/development
// You can override these via Expo env vars if desired.
// For production, set EXPO_PUBLIC_SOLANA_CLUSTER=mainnet-beta and EXPO_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
export const CLUSTER: 'devnet' | 'mainnet-beta' = (process.env.EXPO_PUBLIC_SOLANA_CLUSTER as any) || 'devnet';
export const SOLANA_RPC = process.env.EXPO_PUBLIC_SOLANA_RPC || (CLUSTER === 'devnet' 
  ? 'https://api.devnet.solana.com' 
  : 'https://api.mainnet-beta.solana.com');
// On-chain verification is OFF by default. Set EXPO_PUBLIC_VERIFY_PROGRAM_ID
// to your deployed program ID to enable verifyOnChain().
export const PROGRAM_ID_STR = process.env.EXPO_PUBLIC_VERIFY_PROGRAM_ID || '';

let parsedProgram: PublicKey | null = null;
try {
  // If PROGRAM_ID_STR is a placeholder or invalid, this will throw and we keep null.
  parsedProgram = new PublicKey(PROGRAM_ID_STR);
} catch {}
export const PROGRAM_ID = parsedProgram;

export function getConnection(): Connection {
  return new Connection(SOLANA_RPC, 'confirmed');
}

export function findVerificationPda(owner: PublicKey) {
  if (!PROGRAM_ID) throw new Error('Verification program ID not set');
  return PublicKey.findProgramAddressSync([Buffer.from('verify'), owner.toBuffer()], PROGRAM_ID);
}
