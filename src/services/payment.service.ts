import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, VersionedTransaction } from '@solana/web3.js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getConnection, CLUSTER } from '../config/solana';

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
    name: 'Solana Seeker',
    uri: 'https://solanaseeker.app',
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
   * @param recipientAddress - The address to receive the payment (group creator or platform)
   * @param amountSol - Amount in SOL to pay
   * @returns Transaction signature
   */
  async payToCreateGroup(recipientAddress: string, amountSol: number): Promise<string> {
    this.assertDevClientAndroid();
    try {
      // @ts-ignore lazy import
      const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol');
      const connection: Connection = getConnection();

      const res = await transact(async (wallet: any) => {
        // 1) Authorize with cluster
        console.log('[PaymentService] Authorizing wallet for group creation payment...');
        const { accounts } = await wallet.authorize({ 
          cluster: CLUSTER, 
          identity: PaymentService.APP_IDENTITY as any 
        });
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts returned from wallet authorization');
        }

        const account = accounts[0];
        // Extract address - handle both string and object formats
        const payerAddress = typeof account === 'string' ? account : (account.address || account.publicKey || account);
        if (!payerAddress || typeof payerAddress !== 'string') {
          console.error('[PaymentService] Invalid account format:', account);
          throw new Error('Invalid account format returned from wallet');
        }
        
        console.log('[PaymentService] Payer address:', payerAddress);
        const payer = addressToPublicKey(payerAddress);
        const recipient = addressToPublicKey(recipientAddress);

        // 2) Build transfer transaction
        const amountLamports = amountSol * LAMPORTS_PER_SOL;
        const transferIx = SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: recipient,
          lamports: amountLamports,
        });

        // 3) Get recent blockhash and build transaction
        const { blockhash } = await connection.getLatestBlockhash('finalized');
        const tx = new Transaction({ feePayer: payer, recentBlockhash: blockhash }).add(transferIx);

        // 4) Sign and send transaction
        // Use Transaction directly - Mobile Wallet Adapter handles both Transaction and VersionedTransaction
        console.log('[PaymentService] Signing and sending payment transaction...');
        const signedTxs = await wallet.signAndSendTransactions({ 
          transactions: [tx] 
        });

        // 5) Get signature from response
        // The wallet adapter returns signatures in different formats
        let signature: string;
        if (Array.isArray(signedTxs) && signedTxs.length > 0) {
          signature = typeof signedTxs[0] === 'string' ? signedTxs[0] : signedTxs[0].signature || '';
        } else if (typeof signedTxs === 'string') {
          signature = signedTxs;
        } else {
          signature = (signedTxs as any)?.signature || '';
        }

        if (!signature) {
          throw new Error('No transaction signature returned from wallet');
        }

        // 6) Confirm transaction
        console.log('[PaymentService] Confirming transaction:', signature);
        await connection.confirmTransaction(signature, 'confirmed');

        return signature;
      });

      return res as string;
    } catch (e: any) {
      const errorMsg = e?.message || e?.toString() || 'Unknown error';
      const lc = String(errorMsg).toLowerCase();
      const errorString = JSON.stringify(e);
      console.error('[PaymentService] payToCreateGroup error:', errorMsg, errorString, e);
      
      if (errorMsg.includes('CancellationException') || errorString.includes('CancellationException') || 
          errorMsg.includes('java.util.concurrent.CancellationException') || lc.includes('cancel')) {
        throw new Error('Payment was cancelled. Please try again.');
      }
      
      throw new Error(errorMsg || 'Payment failed');
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
  async payToJoinGroup(groupOwnerAddress: string, amountSol: number, platformAddress: string, platformFeePercentage: number = 0.01): Promise<{ platformSignature: string; ownerSignature: string }> {
    this.assertDevClientAndroid();
    try {
      // @ts-ignore lazy import
      const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol');
      const connection: Connection = getConnection();

      const res = await transact(async (wallet: any) => {
        // 1) Authorize with cluster
        console.log('[PaymentService] Authorizing wallet for group join payment (split payment)...');
        const { accounts } = await wallet.authorize({ 
          cluster: CLUSTER, 
          identity: PaymentService.APP_IDENTITY as any 
        });
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts returned from wallet authorization');
        }

        const account = accounts[0];
        // Extract address - handle both string and object formats
        const payerAddress = typeof account === 'string' ? account : (account.address || account.publicKey || account);
        if (!payerAddress || typeof payerAddress !== 'string') {
          console.error('[PaymentService] Invalid account format:', account);
          throw new Error('Invalid account format returned from wallet');
        }
        
        console.log('[PaymentService] Payer address:', payerAddress);
        const payer = addressToPublicKey(payerAddress);
        const ownerRecipient = addressToPublicKey(groupOwnerAddress);
        const platformRecipient = addressToPublicKey(platformAddress);

        // 2) Calculate split amounts
        const platformFee = amountSol * platformFeePercentage;
        const ownerAmount = amountSol - platformFee;

        console.log(`[PaymentService] Split payment: Total=${amountSol} SOL, Platform=${platformFee} SOL (${platformFeePercentage * 100}%), Owner=${ownerAmount} SOL`);

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

        // 6) Sign and send transaction
        // Use Transaction directly - Mobile Wallet Adapter handles both Transaction and VersionedTransaction
        console.log('[PaymentService] Signing and sending split payment transaction...');
        const signedTxs = await wallet.signAndSendTransactions({ 
          transactions: [tx] 
        });

        // 7) Get signature from response
        let signature: string;
        if (Array.isArray(signedTxs) && signedTxs.length > 0) {
          signature = typeof signedTxs[0] === 'string' ? signedTxs[0] : signedTxs[0].signature || '';
        } else if (typeof signedTxs === 'string') {
          signature = signedTxs;
        } else {
          signature = (signedTxs as any)?.signature || '';
        }

        if (!signature) {
          throw new Error('No transaction signature returned from wallet');
        }

        // 8) Confirm transaction
        console.log('[PaymentService] Confirming split payment transaction:', signature);
        await connection.confirmTransaction(signature, 'confirmed');

        // Return both signatures (same transaction, but we'll use it for both verifications)
        return { platformSignature: signature, ownerSignature: signature };
      });

      return res as { platformSignature: string; ownerSignature: string };
    } catch (e: any) {
      const errorMsg = e?.message || e?.toString() || 'Unknown error';
      const lc = String(errorMsg).toLowerCase();
      const errorString = JSON.stringify(e);
      console.error('[PaymentService] payToJoinGroup error:', errorMsg, errorString, e);
      
      if (errorMsg.includes('CancellationException') || errorString.includes('CancellationException') || 
          errorMsg.includes('java.util.concurrent.CancellationException') || lc.includes('cancel')) {
        throw new Error('Payment was cancelled. Please try again.');
      }
      
      throw new Error(errorMsg || 'Payment failed');
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

