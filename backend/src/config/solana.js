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
 * @param {string} signature - Transaction signature
 * @param {string} expectedRecipient - Expected recipient address
 * @param {number} minAmount - Minimum amount in SOL (lamports)
 * @returns {Promise<boolean>} True if payment is valid
 */
export async function verifyPayment(signature, expectedRecipient, minAmount) {
  try {
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction || !transaction.meta || transaction.meta.err !== null) {
      return false;
    }

    const recipientPubkey = new PublicKey(expectedRecipient);
    const minAmountLamports = minAmount * 1e9; // Convert SOL to lamports

    // Check if transaction contains a transfer to the expected recipient
    const preBalances = transaction.meta.preBalances;
    const postBalances = transaction.meta.postBalances;
    const accountKeys = transaction.transaction.message.accountKeys;

    // Find the recipient account index
    const recipientIndex = accountKeys.findIndex(
      (key) => key.toString() === recipientPubkey.toString()
    );

    if (recipientIndex === -1) {
      return false;
    }

    // Check if recipient received the expected amount
    const amountReceived = postBalances[recipientIndex] - preBalances[recipientIndex];

    return amountReceived >= minAmountLamports;
  } catch (error) {
    console.error('[Solana] Error verifying payment:', error);
    return false;
  }
}

