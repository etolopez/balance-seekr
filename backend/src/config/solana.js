import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

const CLUSTER = process.env.SOLANA_CLUSTER || 'mainnet-beta';
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(CLUSTER);

export const connection = new Connection(RPC_URL, 'confirmed');

// Log RPC configuration on module load (for debugging)
if (process.env.NODE_ENV !== 'production' || process.env.LOG_RPC_CONFIG === 'true') {
  console.log('[Solana] RPC Configuration:', {
    cluster: CLUSTER,
    rpcUrl: RPC_URL?.substring(0, 60) + (RPC_URL?.length > 60 ? '...' : ''),
    hasCustomRpc: !!process.env.SOLANA_RPC_URL,
  });
}

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
    let transaction = null;
    try {
      transaction = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0, // Support versioned transactions (v0)
      });
    } catch (rpcError) {
      // RPC errors (like rate limiting) should be re-thrown for retry logic
      const errorMsg = rpcError?.message || String(rpcError);
      if (errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
        throw rpcError; // Re-throw for retry logic
      }
      console.error('[Solana] RPC error fetching transaction:', rpcError?.message);
      return false;
    }
    
    // If transaction not found, it might not be indexed yet or wrong cluster
    if (!transaction) {
      console.error('[Solana] Transaction not found for signature:', signature?.substring(0, 20) + '...');
      console.error('[Solana] Possible reasons:');
      console.error('  - Transaction not indexed yet (wait and retry)');
      console.error('  - Wrong cluster (frontend on devnet, backend on mainnet or vice versa)');
      console.error('  - Invalid signature');
      console.error('[Solana] Current RPC URL:', RPC_URL?.substring(0, 50) + '...');
      // Return false so retry logic can try again
      return false;
    }

    if (!transaction.meta) {
      console.error('[Solana] Transaction metadata not available');
      console.error('[Solana] Transaction structure:', {
        hasTransaction: !!transaction,
        hasMeta: !!transaction.meta,
        slot: transaction.slot,
        blockTime: transaction.blockTime,
      });
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
    if (transaction.transaction && transaction.transaction.message) {
      // Try legacy transaction format first
      if ('accountKeys' in transaction.transaction.message) {
        accountKeys = transaction.transaction.message.accountKeys;
      } 
      // Try versioned transaction format
      else if ('staticAccountKeys' in transaction.transaction.message) {
        accountKeys = transaction.transaction.message.staticAccountKeys;
      }
      // Try accessing via compiledMessage (for versioned transactions)
      else if (transaction.transaction.message.compiledInstructions) {
        // For versioned transactions, we might need to reconstruct account keys
        // Try to get from the transaction structure
        const msg = transaction.transaction.message;
        if (msg.addressTableLookups && msg.staticAccountKeys) {
          accountKeys = msg.staticAccountKeys;
        } else if (msg.accountKeys) {
          accountKeys = msg.accountKeys;
        }
      }
    }
    
    if (!accountKeys || accountKeys.length === 0) {
      console.error('[Solana] Could not extract account keys from transaction');
      console.error('[Solana] Transaction structure:', JSON.stringify({
        hasTransaction: !!transaction.transaction,
        hasMessage: !!(transaction.transaction && transaction.transaction.message),
        messageKeys: transaction.transaction?.message ? Object.keys(transaction.transaction.message) : [],
      }, null, 2));
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
    const errorMsg = error?.message || String(error);
    
    // Check if it's a rate limit error - rethrow so retry logic can handle it
    if (errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
      console.warn('[Solana] Rate limited by RPC endpoint');
      throw error; // Re-throw so retry logic can handle with longer backoff
    }
    
    console.error('[Solana] Error verifying payment:', error);
    console.error('[Solana] Error details:', {
      message: error?.message,
      stack: error?.stack,
    });
    return false;
  }
}

