import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { API_CONFIG } from "./apiConfig";

// Initialize Alchemy connection
const getAlchemyConnection = () => {
  const endpoint =
    API_CONFIG.network === "mainnet"
      ? API_CONFIG.alchemy.mainnet
      : API_CONFIG.alchemy.devnet;
  return new Connection(endpoint, "confirmed");
};

/**
 * Get recent signatures with enhanced Alchemy APIs
 * This uses Alchemy's faster and more reliable endpoints
 */
export const getRecentSignatures = async (limit = 100) => {
  try {
    const connection = getAlchemyConnection();

    // Get recent slot
    const slot = await connection.getSlot();

    // Get signatures for the recent slot range
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey("11111111111111111111111111111111"), // System program to get all transactions
      {
        limit: limit,
        before: null,
      }
    );

    return signatures;
  } catch (error) {
    console.error("Error fetching recent signatures:", error);
    return [];
  }
};

/**
 * Get large SOL transfers using Alchemy's enhanced transaction parsing
 */
export const getLargeSOLTransfers = async (threshold = 100, limit = 20) => {
  try {
    const connection = getAlchemyConnection();

    // Sample recent transactions from high-activity wallets
    // This is a workaround since Solana doesn't have a direct "get all recent txs" API
    const recentSlot = await connection.getSlot();
    const block = await connection.getBlock(recentSlot, {
      maxSupportedTransactionVersion: 0,
      transactionDetails: "full",
      rewards: false,
    });

    if (!block || !block.transactions) {
      return [];
    }

    const largeTransfers = [];

    for (const tx of block.transactions) {
      if (!tx.meta || tx.meta.err) continue;

      const { preBalances, postBalances } = tx.meta;
      const accountKeys = tx.transaction.message.accountKeys;

      // Find transfers over threshold
      for (let i = 0; i < preBalances.length; i++) {
        const balanceChange =
          Math.abs(postBalances[i] - preBalances[i]) / LAMPORTS_PER_SOL;

        if (balanceChange >= threshold) {
          const account = accountKeys[i];
          const isSender = postBalances[i] < preBalances[i];

          largeTransfers.push({
            signature: tx.transaction.signatures[0],
            amount: balanceChange,
            from: isSender ? account.toString() : "Unknown",
            to: !isSender ? account.toString() : "Unknown",
            timestamp: block.blockTime,
            slot: recentSlot,
            type: isSender ? "send" : "receive",
          });

          break; // Only count once per transaction
        }
      }

      if (largeTransfers.length >= limit) break;
    }

    return largeTransfers;
  } catch (error) {
    console.error("Error fetching large transfers:", error);
    return [];
  }
};

/**
 * Monitor specific high-volume wallets for large movements
 * This is more efficient than scanning all transactions
 */
export const monitorHighVolumeWallets = async (threshold = 100) => {
  const HIGH_VOLUME_WALLETS = [
    // Binance hot wallets
    "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
    // FTX (historical)
    "FTX8xpCYxCbZfMJzPVnMf4SjHEKPZM5GhKGnPfLvxbxC",
    // Add more known high-volume addresses
  ];

  try {
    const connection = getAlchemyConnection();
    const largeTransfers = [];

    for (const walletAddress of HIGH_VOLUME_WALLETS) {
      try {
        const pubkey = new PublicKey(walletAddress);
        const signatures = await connection.getSignaturesForAddress(pubkey, {
          limit: 5,
        });

        for (const sig of signatures) {
          const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx || !tx.meta) continue;

          const { preBalances, postBalances } = tx.meta;

          for (let i = 0; i < preBalances.length; i++) {
            const change =
              Math.abs(postBalances[i] - preBalances[i]) / LAMPORTS_PER_SOL;

            if (change >= threshold) {
              largeTransfers.push({
                signature: sig.signature,
                amount: change,
                from: walletAddress,
                timestamp: sig.blockTime,
                slot: sig.slot,
              });
              break;
            }
          }
        }
      } catch (err) {
        console.error(`Error monitoring wallet ${walletAddress}:`, err);
      }
    }

    return largeTransfers.slice(0, 20);
  } catch (error) {
    console.error("Error monitoring high volume wallets:", error);
    return [];
  }
};

/**
 * Get transaction details with enhanced parsing
 */
export const getTransactionDetails = async (signature) => {
  try {
    const connection = getAlchemyConnection();
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    if (!tx) return null;

    return {
      signature,
      slot: tx.slot,
      blockTime: tx.blockTime,
      meta: tx.meta,
      transaction: tx.transaction,
    };
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    return null;
  }
};

/**
 * Use Alchemy's getSignaturesForAddress with better filtering
 */
export const getFilteredTransactions = async (address, options = {}) => {
  try {
    const connection = getAlchemyConnection();
    const pubkey = new PublicKey(address);

    const signatures = await connection.getSignaturesForAddress(pubkey, {
      limit: options.limit || 10,
      before: options.before,
      until: options.until,
    });

    return signatures;
  } catch (error) {
    console.error("Error fetching filtered transactions:", error);
    return [];
  }
};

/**
 * Batch fetch multiple transactions efficiently using Alchemy
 */
export const batchGetTransactions = async (signatures) => {
  try {
    const connection = getAlchemyConnection();

    const transactions = await Promise.all(
      signatures.map((sig) =>
        connection.getTransaction(sig, {
          maxSupportedTransactionVersion: 0,
        })
      )
    );

    return transactions.filter((tx) => tx !== null);
  } catch (error) {
    console.error("Error batch fetching transactions:", error);
    return [];
  }
};

export default {
  getRecentSignatures,
  getLargeSOLTransfers,
  monitorHighVolumeWallets,
  getTransactionDetails,
  getFilteredTransactions,
  batchGetTransactions,
};
