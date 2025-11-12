import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

const CLUSTER = process.env.SOLANA_CLUSTER || 'mainnet-beta';
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(CLUSTER);

export const connection = new Connection(RPC_URL, 'confirmed');

/**
 * Verify a Solana transaction signature
 * @param {string} signature - Transaction signature
 * @returns {Promise<Object|null>} Transaction details or null if invalid
 */
export async function verifyTransaction(signature) {
  try {
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return null;
    }

    return {
      signature,
      blockTime: transaction.blockTime,
      slot: transaction.slot,
      fee: transaction.meta?.fee,
      success: transaction.meta?.err === null,
    };
  } catch (error) {
    console.error('[Solana] Error verifying transaction:', error);
    return null;
  }
}

/**
 * Verify a payment transaction
 * @param {string} signature - Transaction signature (base58 encoded)
 * @param {string} expectedRecipient - Expected recipient address
 * @param {number} minAmount - Minimum amount in SOL
 * @returns {Promise<boolean>} True if payment is valid
 */
export async function verifyPayment(signature, expectedRecipient, minAmount) {
  try {
    console.log('[Solana] Verifying payment:', {
      signature: signature?.substring(0, 20) + '...',
      expectedRecipient: expectedRecipient?.substring(0, 10) + '...',
      minAmount,
    });

    // Try to get transaction with versioned transaction support
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0, // Support versioned transactions
    });

    if (!transaction) {
      console.error('[Solana] Transaction not found for signature:', signature?.substring(0, 20) + '...');
      return false;
    }

    if (!transaction.meta) {
      console.error('[Solana] Transaction metadata not available');
      return false;
    }

    if (transaction.meta.err !== null) {
      console.error('[Solana] Transaction failed:', transaction.meta.err);
      return false;
    }

    const recipientPubkey = new PublicKey(expectedRecipient);
    const minAmountLamports = Math.floor(minAmount * 1e9); // Convert SOL to lamports (use floor to avoid floating point issues)

    // Handle both legacy and versioned transactions
    let accountKeys;
    if (transaction.transaction.message && 'accountKeys' in transaction.transaction.message) {
      // Legacy transaction
      accountKeys = transaction.transaction.message.accountKeys;
    } else if (transaction.transaction && 'staticAccountKeys' in transaction.transaction.message) {
      // Versioned transaction
      accountKeys = transaction.transaction.message.staticAccountKeys;
    } else {
      console.error('[Solana] Could not extract account keys from transaction');
      return false;
    }

    // Check if transaction contains a transfer to the expected recipient
    const preBalances = transaction.meta.preBalances || [];
    const postBalances = transaction.meta.postBalances || [];

    // Find the recipient account index
    const recipientIndex = accountKeys.findIndex(
      (key) => key.toString() === recipientPubkey.toString()
    );

    if (recipientIndex === -1) {
      console.error('[Solana] Recipient not found in transaction accounts:', {
        expectedRecipient: expectedRecipient?.substring(0, 10) + '...',
        accountCount: accountKeys.length,
      });
      return false;
    }

    // Check if recipient received the expected amount
    const amountReceived = postBalances[recipientIndex] - preBalances[recipientIndex];

    console.log('[Solana] Payment verification details:', {
      recipientIndex,
      amountReceived,
      minAmountLamports,
      isValid: amountReceived >= minAmountLamports,
    });

    if (amountReceived < minAmountLamports) {
      console.error('[Solana] Insufficient payment:', {
        received: amountReceived,
        required: minAmountLamports,
        difference: minAmountLamports - amountReceived,
      });
      return false;
    }

    console.log('[Solana] Payment verified successfully');
    return true;
  } catch (error) {
    console.error('[Solana] Error verifying payment:', error);
    console.error('[Solana] Error details:', {
      message: error?.message,
      stack: error?.stack,
    });
    return false;
  }
}

