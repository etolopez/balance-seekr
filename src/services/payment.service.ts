import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, VersionedTransaction } from '@solana/web3.js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getConnection, CLUSTER } from '../config/solana';
import bs58 from 'bs58';

/**
 * Convert Uint8Array or Buffer to base64 string
 * Handles both Node.js Buffer and React Native Uint8Array
 */
function toBase64(data: Uint8Array | Buffer): string {
  if (Buffer.isBuffer(data)) {
    return data.toString('base64');
  }
  // For Uint8Array, convert to Buffer first
  return Buffer.from(data).toString('base64');
}

/**
 * Convert base64 signature to base58 (Solana format)
 * Mobile Wallet Adapter returns signatures as base64, but Solana expects base58
 */
function base64ToBase58(base64Sig: string): string {
  try {
    // Check if signature is already base58 (no base64 characters)
    const base64Chars = /[+/=]/;
    if (!base64Chars.test(base64Sig)) {
      // Already base58, return as-is
      return base64Sig;
    }
    
    // Decode base64 to bytes
    const bytes = Buffer.from(base64Sig, 'base64');
    
    // Encode bytes to base58 using bs58
    return bs58.encode(bytes);
  } catch (error) {
    console.error('[PaymentService] Error converting base64 to base58:', error);
    // If conversion fails, try returning as-is
    return base64Sig;
  }
}

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
      console.error('[PaymentService] Address conversion error:', e2, 'Address:', address);
      throw new Error(`Invalid address format: ${address.substring(0, 20)}... Expected base58 or base64 encoded PublicKey.`);
    }
  }
}

/**
 * Payment Service - Handles Solana payments for Mastermind groups
 * Supports creating paid groups and joining paid groups
 */
export class PaymentService {
  private static readonly APP_IDENTITY = {
    name: 'Balance Seekr',
    uri: 'https://balanceseekr.app',
    icon: 'favicon.ico',
  } as const;

  private assertDevClientAndroid() {
    const ownership = (Constants as any)?.appOwnership as string | undefined;
    if (Platform.OS !== 'android') {
      throw new Error('Solana payments require Android (Mobile Wallet Adapter).');
    }
    if (ownership === 'expo') {
      throw new Error('Requires Android Dev Client or standalone build — not Expo Go.');
    }
  }

  /**
   * Create a payment transaction for creating a public Mastermind group
   * @param recipientAddress - The address to receive the payment (platform)
   * @param amountSol - Amount in SOL to pay
   * @param payerAddress - The already-connected wallet address (optional, will authorize if not provided)
   * @returns Transaction signature
   */
  async payToCreateGroup(recipientAddress: string, amountSol: number, payerAddress?: string): Promise<string> {
    this.assertDevClientAndroid();
    
    try {
      // @ts-ignore lazy import
      const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol');
      const connection: Connection = getConnection();
      
      // Store signature outside transact callback so we can access it even if transact throws
      let capturedSignature: string | null = null;
      let transactError: any = null;

      try {
        const res = await transact(async (wallet: any) => {
          // Always authorize first to establish wallet session
          // This opens the wallet and allows us to send transactions
          // Even if we have payerAddress, we need authorization for the session
          const { accounts } = await wallet.authorize({ 
            cluster: CLUSTER, 
            identity: PaymentService.APP_IDENTITY as any 
          });
          
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts returned from wallet authorization');
          }

          const account = accounts[0];
          let finalPayerAddress = typeof account === 'string' ? account : (account.address || account.publicKey || account);
          
          // If payerAddress was provided, verify it matches the authorized account
          // This ensures the user is paying with the wallet they connected
          if (payerAddress) {
            const providedPayer = addressToPublicKey(payerAddress);
            const authorizedPayer = addressToPublicKey(finalPayerAddress);
            if (!providedPayer.equals(authorizedPayer)) {
              throw new Error('Authorized wallet does not match the provided payer address');
            }
          }
          
          if (!finalPayerAddress || typeof finalPayerAddress !== 'string') {
            throw new Error('Invalid payer address');
          }
          
          // Convert to base58 if needed
          const payer = addressToPublicKey(finalPayerAddress);
          const recipient = addressToPublicKey(recipientAddress);

          // Build transfer transaction
          const amountLamports = amountSol * LAMPORTS_PER_SOL;
          const transferIx = SystemProgram.transfer({
            fromPubkey: payer,
            toPubkey: recipient,
            lamports: amountLamports,
          });

          // Get recent blockhash and build transaction
          const { blockhash } = await connection.getLatestBlockhash('finalized');
          const tx = new Transaction({ feePayer: payer, recentBlockhash: blockhash }).add(transferIx);

          // Serialize transaction to Buffer/Uint8Array (unsigned - wallet will sign it)
          // Mobile Wallet Adapter REQUIRES transactions as base64-encoded strings
          const serializedTx = tx.serialize({
            requireAllSignatures: false,
            verifySignatures: false,
          });
          
          // Convert to base64 string - this is the format Mobile Wallet Adapter expects
          const base64Tx = toBase64(serializedTx);
          
          // Debug: Log transaction details (first 50 chars of base64)
          console.log('[PaymentService] Transaction serialized, base64 length:', base64Tx.length);
          console.log('[PaymentService] Transaction base64 preview:', base64Tx.substring(0, 50) + '...');
          
          // signAndSendTransactions expects "payloads" (not "transactions") - array of base64-encoded transaction strings
          // This will prompt the wallet for transaction approval (payment confirmation)
          // When the success modal appears, the transaction is confirmed and we should have the signature
          let signedTxs: any;
          let signature: string | null = null;
          
          try {
            signedTxs = await wallet.signAndSendTransactions({ 
              payloads: [base64Tx]
            });

            // Get signature from response
            // The wallet adapter returns { signatures: Base64EncodedSignature[] }
            if (signedTxs && typeof signedTxs === 'object' && 'signatures' in signedTxs) {
              // Response format: { signatures: string[] }
              const sigs = (signedTxs as any).signatures;
              if (Array.isArray(sigs) && sigs.length > 0) {
                signature = sigs[0];
              }
            } else if (Array.isArray(signedTxs) && signedTxs.length > 0) {
              // Fallback: direct array format
              signature = typeof signedTxs[0] === 'string' ? signedTxs[0] : signedTxs[0].signature || '';
            } else if (typeof signedTxs === 'string') {
              // Fallback: direct string
              signature = signedTxs;
            } else {
              signature = (signedTxs as any)?.signature || '';
            }
            
            // Capture signature immediately when we get it
            // Convert from base64 to base58 if needed (Mobile Wallet Adapter returns base64)
            if (signature) {
              // Convert base64 signature to base58 (Solana format)
              signature = base64ToBase58(signature);
              capturedSignature = signature;
              console.log('[PaymentService] Signature captured and converted to base58:', signature.substring(0, 20) + '...');
            }
          } catch (walletError: any) {
            // If wallet throws an error, check if transaction might have still succeeded
            // The success modal appearing means the transaction succeeded, even if wallet closes
            console.log('[PaymentService] Wallet error after transaction, checking if signature was returned...', walletError?.message);
            
            // Try to extract signature from error if present
            const errorString = JSON.stringify(walletError);
            const errorMsg = walletError?.message || String(walletError);
            
            // Check if error contains a signature (sometimes wallet returns it in error)
            const signatureMatch = errorString.match(/"signature":\s*"([^"]+)"/) || 
                                   errorMsg.match(/signature[:\s]+([A-Za-z0-9]{88,})/i);
            if (signatureMatch) {
              signature = signatureMatch[1];
              // Convert base64 signature to base58 (Solana format)
              signature = base64ToBase58(signature);
              capturedSignature = signature;
              console.log('[PaymentService] Found signature in error and converted to base58:', signature.substring(0, 20) + '...');
            }
            
            // Also check if signedTxs was set before the error (race condition)
            if (!signature && signedTxs) {
              console.log('[PaymentService] Checking signedTxs that was set before error...');
              // Try to extract signature from signedTxs even though we got an error
              if (signedTxs && typeof signedTxs === 'object' && 'signatures' in signedTxs) {
                const sigs = (signedTxs as any).signatures;
                if (Array.isArray(sigs) && sigs.length > 0) {
                  signature = sigs[0];
                  // Convert base64 signature to base58 (Solana format)
                  signature = base64ToBase58(signature);
                  capturedSignature = signature;
                  console.log('[PaymentService] Found signature in signedTxs and converted to base58:', signature.substring(0, 20) + '...');
                }
              }
            }
            
            // Store error but don't throw yet - we'll check if we have signature first
            transactError = walletError;
          }

          // If we have a signature, verify the transaction actually succeeded
          if (signature) {
            try {
              // Confirm transaction to ensure it was actually submitted
              await connection.confirmTransaction(signature, 'confirmed');
              console.log('[PaymentService] Transaction confirmed successfully:', signature.substring(0, 20) + '...');
              // Return signature - this means transaction succeeded
              return signature;
            } catch (confirmError: any) {
              console.error('[PaymentService] Transaction confirmation failed:', confirmError);
              // If confirmation fails, the transaction might not have been submitted
              throw new Error('Transaction was not successfully submitted to the network');
            }
          }

          // No signature found - transaction was likely cancelled
          throw new Error('No transaction signature returned from wallet. The transaction may have been cancelled.');
        });
        
        // If transact succeeded, return the result
        return res as string;
      } catch (e: any) {
        // If transact threw an error BUT we captured a signature, the transaction likely succeeded
        // The error is probably just from closing the wallet app after the success modal
        if (capturedSignature) {
          console.log('[PaymentService] Transact error but signature was captured - transaction likely succeeded');
          console.log('[PaymentService] Verifying captured signature:', capturedSignature.substring(0, 20) + '...');
          
          try {
            // Verify the transaction actually succeeded on-chain
            await connection.confirmTransaction(capturedSignature, 'confirmed');
            console.log('[PaymentService] Captured signature verified - transaction succeeded!');
            return capturedSignature;
          } catch (verifyError: any) {
            console.error('[PaymentService] Could not verify captured signature:', verifyError);
            // If we can't verify, fall through to error handling
          }
        }
        
        // If no signature was captured, handle the error normally
        transactError = e;
        throw e;
      }
    } catch (e: any) {
      const errorMsg = e?.message || e?.toString() || 'Unknown error';
      const lc = String(errorMsg).toLowerCase();
      const errorString = JSON.stringify(e);
      
      // Log full error for debugging
      console.error('[PaymentService] payToCreateGroup error:', {
        message: errorMsg,
        error: e,
        stringified: errorString,
        stack: e?.stack,
      });
      
      // Don't automatically treat cancellation errors as failures
      // The transaction might have succeeded even if the wallet app was closed
      // The error handling above already checks for actual transaction success
      
      // Provide more helpful error messages
      if (errorMsg.includes('not successfully submitted') || errorMsg.includes('No transaction signature')) {
        // These are the actual failure cases we detected
        throw e; // Re-throw the specific error we created
      }
      
      if (errorMsg.includes('CancellationException') || errorString.includes('CancellationException') || 
          errorMsg.includes('java.util.concurrent.CancellationException') || lc.includes('cancel')) {
        // Only throw cancellation error if we couldn't verify transaction success
        throw new Error('Payment was cancelled or the wallet app was closed before completion. Please try again and wait for the transaction to complete.');
      }
      
      if (lc.includes('requires android') || lc.includes('dev client')) {
        throw new Error('Payment requires Android Dev Client. Please build the app with: npx expo run:android');
      }
      
      if (lc.includes('invalid payload') || errorMsg.includes('-32602')) {
        // Include more details about the error
        console.error('[PaymentService] Transaction format error details:', errorString);
        throw new Error(`Transaction format error: ${errorMsg}. Please try again.`);
      }
      
      throw new Error(`Payment failed: ${errorMsg}`);
    }
  }

  /**
   * Create a payment transaction for joining a paid Mastermind group
   * This creates TWO payments: 1% to platform, 99% to group owner
   * @param groupOwnerAddress - The address to receive the majority of payment (group owner)
   * @param amountSol - Total amount in SOL to pay
   * @param platformAddress - Platform address to receive 1% fee
   * @param platformFeePercentage - Platform fee percentage (default 0.01 = 1%)
   * @returns Transaction signature (returns the platform fee signature, owner payment signature is separate)
   */
  async payToJoinGroup(groupOwnerAddress: string, amountSol: number, platformAddress: string, platformFeePercentage: number = 0.01, payerAddress?: string): Promise<{ platformSignature: string; ownerSignature: string }> {
    this.assertDevClientAndroid();
    try {
      // @ts-ignore lazy import
      const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol');
      const connection: Connection = getConnection();

      const res = await transact(async (wallet: any) => {
        // Always authorize first to establish wallet session
        // This opens the wallet and allows us to send transactions
        // Even if we have payerAddress, we need authorization for the session
        const { accounts } = await wallet.authorize({ 
          cluster: CLUSTER, 
          identity: PaymentService.APP_IDENTITY as any 
        });
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts returned from wallet authorization');
        }

        const account = accounts[0];
        let finalPayerAddress = typeof account === 'string' ? account : (account.address || account.publicKey || account);
        
        // If payerAddress was provided, verify it matches the authorized account
        // This ensures the user is paying with the wallet they connected
        if (payerAddress) {
          const providedPayer = addressToPublicKey(payerAddress);
          const authorizedPayer = addressToPublicKey(finalPayerAddress);
          if (!providedPayer.equals(authorizedPayer)) {
            throw new Error('Authorized wallet does not match the provided payer address');
          }
        }
        
        if (!finalPayerAddress || typeof finalPayerAddress !== 'string') {
          throw new Error('Invalid payer address');
        }
        
        // Convert to base58 if needed
        const payer = addressToPublicKey(finalPayerAddress);
        const ownerRecipient = addressToPublicKey(groupOwnerAddress);
        const platformRecipient = addressToPublicKey(platformAddress);

        // 2) Calculate split amounts
        const platformFee = amountSol * platformFeePercentage;
        const ownerAmount = amountSol - platformFee;

        // 3) Build two transfer instructions
        const platformFeeLamports = platformFee * LAMPORTS_PER_SOL;
        const ownerAmountLamports = ownerAmount * LAMPORTS_PER_SOL;

        const platformTransferIx = SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: platformRecipient,
          lamports: platformFeeLamports,
        });

        const ownerTransferIx = SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: ownerRecipient,
          lamports: ownerAmountLamports,
        });

        // 4) Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash('finalized');
        
        // 5) Create transaction with both transfers
        const tx = new Transaction({ feePayer: payer, recentBlockhash: blockhash })
          .add(platformTransferIx)
          .add(ownerTransferIx);

        // 6) Serialize transaction to Buffer/Uint8Array (unsigned - wallet will sign it)
        // Mobile Wallet Adapter REQUIRES transactions as base64-encoded strings
        const serializedTx = tx.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        });
        
        // Convert to base64 string - this is the format Mobile Wallet Adapter expects
        const base64Tx = toBase64(serializedTx);
        
        // signAndSendTransactions expects "payloads" (not "transactions") - array of base64-encoded transaction strings
        const signedTxs = await wallet.signAndSendTransactions({ 
          payloads: [base64Tx]
        });

        // 7) Get signature from response
        // The wallet adapter returns { signatures: Base64EncodedSignature[] }
        let signature: string;
        if (signedTxs && typeof signedTxs === 'object' && 'signatures' in signedTxs) {
          // Response format: { signatures: string[] }
          const sigs = (signedTxs as any).signatures;
          if (Array.isArray(sigs) && sigs.length > 0) {
            signature = base64ToBase58(sigs[0]);
          }
        } else if (Array.isArray(signedTxs) && signedTxs.length > 0) {
          // Fallback: direct array format
          signature = typeof signedTxs[0] === 'string' ? base64ToBase58(signedTxs[0]) : base64ToBase58(signedTxs[0].signature || '');
        } else if (typeof signedTxs === 'string') {
          // Fallback: direct string
          signature = base64ToBase58(signedTxs);
        } else {
          signature = base64ToBase58((signedTxs as any)?.signature || '');
        }

        if (!signature) {
          throw new Error('No transaction signature returned from wallet');
        }

        // 8) Confirm transaction
        await connection.confirmTransaction(signature, 'confirmed');

        // Return both signatures (same transaction, but we'll use it for both verifications)
        return { platformSignature: signature, ownerSignature: signature };
      });

      return res as { platformSignature: string; ownerSignature: string };
    } catch (e: any) {
      const errorMsg = e?.message || e?.toString() || 'Unknown error';
      const lc = String(errorMsg).toLowerCase();
      const errorString = JSON.stringify(e);
      
      // Log full error for debugging
      console.error('[PaymentService] payToJoinGroup error:', {
        message: errorMsg,
        error: e,
        stringified: errorString,
        stack: e?.stack,
      });
      
      if (errorMsg.includes('CancellationException') || errorString.includes('CancellationException') || 
          errorMsg.includes('java.util.concurrent.CancellationException') || lc.includes('cancel')) {
        throw new Error('Payment was cancelled. Please try again.');
      }
      
      if (lc.includes('invalid payload') || errorMsg.includes('-32602')) {
        // Include more details about the error
        console.error('[PaymentService] Transaction format error details:', errorString);
        throw new Error(`Transaction format error: ${errorMsg}. Please try again.`);
      }
      
      throw new Error(`Payment failed: ${errorMsg}`);
    }
  }

  /**
   * Verify a payment transaction was successful
   * @param signature - Transaction signature to verify
   * @param expectedRecipient - Expected recipient address
   * @param expectedAmount - Expected amount in SOL
   * @returns true if payment is valid
   */
  async verifyPayment(signature: string, expectedRecipient: string, expectedAmount: number): Promise<boolean> {
    try {
      const connection = getConnection();
      const tx = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.meta) {
        console.error('[PaymentService] Transaction not found or invalid');
        return false;
      }

      if (tx.meta.err) {
        console.error('[PaymentService] Transaction failed:', tx.meta.err);
        return false;
      }

      // Check if the transaction includes a transfer to the expected recipient
      const expectedAmountLamports = expectedAmount * LAMPORTS_PER_SOL;
      const recipientPubkey = new PublicKey(expectedRecipient);

      // Verify the transaction includes the expected transfer
      // This is a simplified check - in production, you'd want more thorough verification
      const preBalances = tx.meta.preBalances || [];
      const postBalances = tx.meta.postBalances || [];
      
      // Find the recipient account index
      const accountKeys = tx.transaction.message.staticAccountKeys || [];
      const recipientIndex = accountKeys.findIndex((key: PublicKey) => key.equals(recipientPubkey));
      
      if (recipientIndex >= 0 && recipientIndex < postBalances.length) {
        const balanceChange = postBalances[recipientIndex] - preBalances[recipientIndex];
        if (balanceChange >= expectedAmountLamports) {
          console.log('[PaymentService] Payment verified successfully');
          return true;
        }
      }

      console.error('[PaymentService] Payment verification failed - amount or recipient mismatch');
      return false;
    } catch (error) {
      console.error('[PaymentService] Error verifying payment:', error);
      return false;
    }
  }
}

