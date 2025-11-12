import { Connection, PublicKey } from '@solana/web3.js';

// Defaults (easy mode): hardcode devnet + placeholder Program ID.
// You can override these via Expo env vars if desired.
export const SOLANA_RPC = process.env.EXPO_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
export const CLUSTER: 'devnet' | 'mainnet-beta' = (process.env.EXPO_PUBLIC_SOLANA_CLUSTER as any) || 'devnet';
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
