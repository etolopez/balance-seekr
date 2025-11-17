import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction, VersionedTransaction } from '@solana/web3.js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getConnection, PROGRAM_ID, findVerificationPda, CLUSTER } from '../config/solana';

/**
 * Convert wallet address to PublicKey
 * Handles both base58 and base64 encoded addresses from Mobile Wallet Adapter
 */
function addressToPublicKey(address: string): PublicKey {
  if (!address || typeof address !== 'string') {
    throw new Error(`Invalid address: ${address}. Expected a string.`);
  }

  try {
    // Try direct conversion first (base58 - standard Solana address format)
    return new PublicKey(address);
  } catch (e) {
    // If that fails, try converting from base64
    // Mobile Wallet Adapter may return base64 encoded public key bytes
    try {
      // Decode base64 to bytes, then create PublicKey from bytes
      // Remove any padding if present
      const cleanBase64 = address.replace(/[^A-Za-z0-9+/=]/g, '');
      const base64Decoded = Buffer.from(cleanBase64, 'base64');
      
      // PublicKey should be 32 bytes
      if (base64Decoded.length !== 32) {
        throw new Error(`Invalid address length: ${base64Decoded.length} bytes. Expected 32 bytes for PublicKey.`);
      }
      
      return new PublicKey(base64Decoded);
    } catch (e2) {
      console.error('[WalletService] Address conversion error:', e2, 'Address:', address);
      throw new Error(`Invalid address format: ${address.substring(0, 20)}... Expected base58 or base64 encoded PublicKey.`);
    }
  }
}
// import * as Linking from 'expo-linking';

export type WalletAccount = { address: string };
export type SiwsPayload = {
  domain: string;
  statement?: string;
  uri?: string;
};
export type WalletSiwsResult = { address: string; signInResult: any; signInPayload: SiwsPayload };

export class WalletService {
  private static readonly APP_IDENTITY = {
    name: 'Balance Seekr',
    uri: 'https://balanceseekr.app',
    icon: 'favicon.ico',
  } as const;
  private assertDevClientAndroid() {
    const ownership = (Constants as any)?.appOwnership as string | undefined;
    if (Platform.OS !== 'android') {
      throw new Error('Solana wallet verification requires Android (Mobile Wallet Adapter).');
    }
    if (ownership === 'expo') {
      throw new Error('Requires Android Dev Client or standalone build — not Expo Go. Run: npx expo run:android');
    }
  }
  // Attempt to sign a verification message via Solana Mobile Wallet Adapter (Android Dev Client)
  async verifyOnce(): Promise<WalletAccount> {
    // Lazy import so Expo Go doesn't crash
    try {
      this.assertDevClientAndroid();
      // @ts-ignore
      const m = await import('@solana-mobile/mobile-wallet-adapter-protocol');
      const { transact } = m;
      const res = await transact(async (wallet: any) => {
        try {
          // Authorize with cluster - this opens the wallet picker/selector
          // The Mobile Wallet Adapter will show available wallets (Phantom, Solflare, etc.)
          // The authorize call will:
          // 1. Show wallet picker if multiple wallets installed
          // 2. Open default wallet if only one installed
          // 3. Allow user to select and authorize
          const { accounts } = await wallet.authorize({ 
            cluster: CLUSTER, 
            identity: WalletService.APP_IDENTITY as any,
          });
          
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts returned from wallet authorization');
          }
          
          const account = accounts[0];
          // Extract address - handle both string and object formats
          let address = typeof account === 'string' 
            ? account 
            : (account?.address || account?.publicKey || account);
          
          if (!address || typeof address !== 'string') {
            console.error('[WalletService] Invalid account format:', account);
            throw new Error('Invalid account format returned from wallet');
          }
          
          // Convert address to base58 format (standard Solana address format)
          // This ensures the address is always in the format expected by the backend
          try {
            const publicKey = addressToPublicKey(address);
            address = publicKey.toBase58(); // Always use base58 format
            console.log('[WalletService] Address converted to base58:', address.substring(0, 10) + '...');
          } catch (error) {
            console.error('[WalletService] Failed to convert address to base58:', error);
            throw new Error('Invalid wallet address format. Please try connecting again.');
          }
          
          return { address };
        } catch (walletError: any) {
          // Better error handling for wallet-specific errors
          const errorMsg = walletError?.message || walletError?.toString() || 'Unknown wallet error';
          const lc = String(errorMsg).toLowerCase();
          console.error('[WalletService] Wallet interaction error:', errorMsg, walletError);
          
          // Check for specific error types
          if (lc.includes('cancel') || lc.includes('reject') || lc.includes('denied')) {
            throw new Error('Wallet connection was cancelled or rejected');
          }
          if (lc.includes('timeout') || lc.includes('expired')) {
            throw new Error('Wallet connection timed out. Please try again.');
          }
          
          throw new Error(`Wallet verification failed: ${errorMsg}`);
        }
      });
      
      if (!res || !res.address) {
        throw new Error('Invalid response from wallet verification');
      }
      
      return res as WalletAccount;
    } catch (e: any) {
      const errorMsg = e?.message || e?.toString() || 'Unknown error';
      const lc = String(errorMsg).toLowerCase();
      const errorString = JSON.stringify(e);
      console.error('[WalletService] verifyOnce error:', errorMsg, errorString, e);
      
      // Handle Java CancellationException - common when app switches to wallet
      if (errorMsg.includes('CancellationException') || errorString.includes('CancellationException') || 
          errorMsg.includes('java.util.concurrent.CancellationException') || lc.includes('cancel')) {
        throw new Error('Connection was interrupted. This can happen when switching apps. Please try again and make sure to accept the connection in Phantom, then wait for it to return to the app.');
      }
      
      // Provide more helpful error messages
      if (lc.includes('cancel') || lc.includes('reject') || lc.includes('denied')) {
        throw new Error('Wallet connection was cancelled. Please try again and make sure to accept the connection in Phantom.');
      }
      
      if (lc.includes('timeout') || lc.includes('expired')) {
        throw new Error('Connection timed out. Please try again.');
      }
      
      throw new Error(errorMsg.includes('Android Dev Client') ? errorMsg : 'Wallet verification failed. Please ensure you\'re using Android Dev Client and have Phantom wallet installed.');
    }
  }

  // On-chain verification using a simple program call.
  // Assumes a program deployed that initializes a PDA at seeds ['verify', owner]
  async verifyOnChain(): Promise<WalletAccount> {
    if (!PROGRAM_ID) throw new Error('Verification program not configured');
    try {
      this.assertDevClientAndroid();
      // @ts-ignore lazy import
      const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol');
      const connection: Connection = getConnection();

      const res = await transact(async (wallet: any) => {
        // 1) Authorize with cluster
        console.log('[WalletService] Using identity for wallet (on-chain):', WalletService.APP_IDENTITY.uri);
        const { accounts } = await wallet.authorize({ cluster: CLUSTER, identity: WalletService.APP_IDENTITY as any });
        const account = accounts[0];
        const owner = addressToPublicKey(account.address);

        // 2) Derive verification PDA
        const [verifyPda] = findVerificationPda(owner);

        // 3) Build instruction (program must accept this instruction)
        // Discriminator 0x00 for initialize
        const data = Buffer.from([0]);
        const keys = [
          { pubkey: owner, isSigner: true, isWritable: false },
          { pubkey: verifyPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ];
        const ix = new TransactionInstruction({ programId: PROGRAM_ID, keys, data });

        // 4) Build and send transaction via wallet
        const { blockhash } = await connection.getLatestBlockhash('finalized');
        const tx = new Transaction({ feePayer: owner, recentBlockhash: blockhash }).add(ix);

        // Prefer VersionedTransaction if supported by wallet, else fallback
        let vx: VersionedTransaction | Transaction = tx;
        try {
          // Attempt to transform to v0
          // @ts-ignore
          const msg = tx.compileMessage();
          // @ts-ignore
          vx = new VersionedTransaction(msg);
        } catch {}

        // sign and send
        await wallet.signAndSendTransactions({ transactions: [vx] });

        // 5) Optionally confirm
        // (Wallet usually returns signature; some libs auto-submit)
        // You can fetch the account to confirm it exists
        try {
          await connection.getAccountInfo(verifyPda, 'confirmed');
        } catch {}

        return { address: account.address as string };
      });

      return res as WalletAccount;
    } catch (e: any) {
      const errorMsg = e?.message || e?.toString() || 'Unknown error';
      const lc = String(errorMsg).toLowerCase();
      const errorString = JSON.stringify(e);
      console.error('[verifyOnChain] error:', errorMsg, errorString, e);
      
      // Handle Java CancellationException - common when app switches to wallet
      if (errorMsg.includes('CancellationException') || errorString.includes('CancellationException') || 
          errorMsg.includes('java.util.concurrent.CancellationException') || lc.includes('cancel')) {
        throw new Error('Connection was interrupted. This can happen when switching apps. Please try again and make sure to accept the connection in Phantom, then wait for it to return to the app.');
      }
      
      throw new Error(errorMsg || 'On-chain verification failed');
    }
  }

  // SIWS (Sign-in-with-Solana) to prove wallet ownership. Combine with server-side
  // verification and SGT ownership check to guarantee Seeker ownership.
  async verifySiws(): Promise<WalletSiwsResult> {
    this.assertDevClientAndroid();
    try {
      // @ts-ignore lazy import
      const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol');
      const payload: SiwsPayload = {
        domain: 'balanceseekr.app',
        statement: 'Sign in to verify Balance Seekr ownership',
        uri: 'https://balanceseekr.app',
      };
      const res = await transact(async (wallet: any) => {
        const auth = await wallet.authorize({
          cluster: CLUSTER,
          identity: WalletService.APP_IDENTITY as any,
          // sign_in_payload is supported by MWA; using any to avoid TS friction
          sign_in_payload: payload as any,
        } as any);
        const addr = auth?.accounts?.[0]?.address;
        if (!addr) throw new Error('No account returned from SIWS authorization');
        return { address: addr as string, signInResult: (auth as any)?.sign_in_result, signInPayload: payload };
      });
      if (!res || !res.address) throw new Error('Invalid SIWS response');
      return res as WalletSiwsResult;
    } catch (e: any) {
      const errorMsg = e?.message || e?.toString() || 'Unknown error';
      const lc = String(errorMsg).toLowerCase();
      const errorString = JSON.stringify(e);
      console.error('[WalletService] verifySiws error:', errorMsg, errorString, e);
      if (errorMsg.includes('CancellationException') || errorString.includes('CancellationException') ||
          errorMsg.includes('java.util.concurrent.CancellationException') || lc.includes('cancel')) {
        throw new Error('Connection was interrupted. Please try again and complete all prompts in the wallet.');
      }
      throw new Error(errorMsg || 'SIWS verification failed');
    }
  }
}
