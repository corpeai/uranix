import { ShadowWireClient } from "@radr/shadowwire";

// NOTE: This service now uses the connection from wallet adapter context
// No need to create separate connections - reuse what's already available

/**
 * Initialize ShadowWire client with provided connection
 */
export const initializeShadowWire = (connection) => {
  return new ShadowWireClient({
    connection, // Use the connection from wallet adapter
  });
};

/**
 * Register wallet as ShadowWire recipient
 * Required before receiving private transfers
 */
export const registerAsRecipient = async (
  walletAddress,
  connection,
  wallet
) => {
  try {
    const client = initializeShadowWire(connection);

    // Check if register method exists
    if (typeof client.register !== "function") {
      throw new Error(
        "ShadowWire register method not available. Check SDK documentation. " +
          "Your wallet may already be registered, or registration may not be required."
      );
    }

    const result = await client.register({
      address: walletAddress,
      wallet: wallet, // For signing
    });

    return {
      success: true,
      signature: result.signature || result.txId,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error registering as recipient:", error);
    throw error;
  }
};

/**
 * Deposit SOL into ShadowWire privacy pool
 */
export const depositToShadowWire = async (
  walletAddress,
  amount,
  connection,
  wallet
) => {
  try {
    const client = initializeShadowWire(connection);

    // Check if deposit method exists
    if (typeof client.deposit !== "function") {
      throw new Error(
        "ShadowWire deposit method not available. Check SDK documentation. " +
          "Run: npm install @radr/shadowwire"
      );
    }

    const result = await client.deposit({
      from: walletAddress,
      amount: amount,
      wallet: wallet, // For signing
    });

    return {
      success: true,
      signature: result.signature || result.txId,
      amount: amount,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error depositing to ShadowWire:", error);
    throw error;
  }
};

/**
 * Withdraw SOL from ShadowWire back to wallet
 */
export const withdrawFromShadowWire = async (
  walletAddress,
  amount,
  connection,
  wallet
) => {
  try {
    const client = initializeShadowWire(connection);

    // Check if withdraw method exists
    if (typeof client.withdraw !== "function") {
      throw new Error(
        "ShadowWire withdraw method not available. Check SDK documentation. " +
          "Run: npm install @radr/shadowwire"
      );
    }

    const result = await client.withdraw({
      to: walletAddress,
      amount: amount,
      wallet: wallet, // For signing
    });

    return {
      success: true,
      signature: result.signature || result.txId,
      amount: amount,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error withdrawing from ShadowWire:", error);
    throw error;
  }
};

/**
 * Get wallet balance using ShadowWire (with fallback to regular Solana)
 * @param {string} walletAddress - Wallet address
 * @param {Connection} connection - Connection from useConnection() hook
 */
export const getShadowWireBalance = async (walletAddress, connection) => {
  try {
    // Try ShadowWire first
    try {
      const client = initializeShadowWire(connection);
      const balance = await client.getBalance(walletAddress);

      return {
        available: balance.available / 1e9,
        locked: balance.locked ? balance.locked / 1e9 : 0,
        total: (balance.available + (balance.locked || 0)) / 1e9,
      };
    } catch (shadowWireError) {
      console.warn(
        "ShadowWire balance fetch failed, using regular Solana method:",
        shadowWireError
      );

      // Fallback to regular Solana balance check
      const { PublicKey, LAMPORTS_PER_SOL } = await import("@solana/web3.js");
      const publicKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;

      return {
        available: solBalance,
        locked: 0,
        total: solBalance,
      };
    }
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw error;
  }
};

/**
 * Make a private transfer using ShadowWire
 * NOTE: Requires @radr/shadowwire package to be installed and configured
 * @param {object} params - Transfer parameters
 * @param {Connection} connection - Connection from useConnection() hook
 * @param {Wallet} wallet - Wallet from useWallet() hook
 */
export const makePrivateTransfer = async (
  { sender, recipient, amount, token = "SOL", type = "internal", memo = "" },
  connection,
  wallet
) => {
  try {
    const client = initializeShadowWire(connection);

    // Check if ShadowWire client has transfer method
    if (typeof client.transfer !== "function") {
      throw new Error(
        "ShadowWire SDK not properly configured. Please ensure @radr/shadowwire is installed."
      );
    }

    // Check available balance first
    const balance = await getShadowWireBalance(sender, connection);
    if (amount > balance.available) {
      throw new Error(
        `Insufficient ShadowWire balance. Available: ${balance.available.toFixed(
          4
        )} SOL. ` + `Please deposit SOL to ShadowWire first.`
      );
    }

    const result = await client.transfer({
      sender,
      recipient,
      amount,
      token,
      type,
      memo,
      wallet, // Pass the wallet for signing
    });

    return {
      success: true,
      signature: result.signature || result.txId,
      txId: result.txId || result.signature,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error making private transfer:", error);

    // Provide more helpful error messages
    if (error.message.includes("not a function")) {
      throw new Error(
        "ShadowWire SDK is not installed or configured correctly. Run: npm install @radr/shadowwire"
      );
    }

    throw error;
  }
};

/**
 * Get transfer history using regular Solana methods
 * (ShadowWire client doesn't have getTransferHistory method)
 * @param {string} walletAddress - Wallet address
 * @param {Connection} connection - Connection from useConnection() hook
 * @param {number} limit - Number of transactions to fetch
 */
export const getTransferHistory = async (
  walletAddress,
  connection,
  limit = 10
) => {
  try {
    const { PublicKey, LAMPORTS_PER_SOL } = await import("@solana/web3.js");
    const publicKey = new PublicKey(walletAddress);

    // Fetch transaction signatures
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit,
    });

    // Fetch full transaction details
    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        try {
          const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx || !tx.meta) return null;

          // Determine transaction type
          const { preBalances, postBalances } = tx.meta;
          const balanceChange = postBalances[0] - preBalances[0];
          const type = balanceChange > 0 ? "receive" : "send";
          const amount = Math.abs(balanceChange) / LAMPORTS_PER_SOL;

          return {
            signature: sig.signature,
            type: type,
            amount: amount.toFixed(4),
            token: "SOL",
            from:
              tx.transaction.message.accountKeys[0]?.toString() || "Unknown",
            to: tx.transaction.message.accountKeys[1]?.toString() || "Unknown",
            timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
            status: sig.err ? "failed" : "success",
            isPrivate: false, // Regular Solana transactions are public
          };
        } catch (error) {
          console.error("Error fetching transaction details:", error);
          return null;
        }
      })
    );

    return transactions.filter((tx) => tx !== null);
  } catch (error) {
    console.error("Error fetching transfer history:", error);
    return [];
  }
};

/**
 * Validate wallet address
 */
export const validateAddress = (address) => {
  try {
    // Basic Solana address validation
    return address.length >= 32 && address.length <= 44;
  } catch (error) {
    return false;
  }
};

/**
 * Check if recipient wallet exists on chain
 * @param {string} address - Wallet address to check
 * @param {Connection} connection - Connection from useConnection() hook
 */
export const checkRecipientExists = async (address, connection) => {
  try {
    if (!validateAddress(address)) {
      return { exists: false, error: "Invalid address format" };
    }

    const { PublicKey } = await import("@solana/web3.js");
    const publicKey = new PublicKey(address);

    // Check if account exists by fetching account info
    const accountInfo = await connection.getAccountInfo(publicKey);

    if (accountInfo === null) {
      return {
        exists: false,
        error: "Wallet does not exist on chain",
        needsActivation: true,
      };
    }

    return {
      exists: true,
      balance: accountInfo.lamports / 1e9,
      isInitialized: true,
    };
  } catch (error) {
    console.error("Error checking recipient:", error);
    return {
      exists: false,
      error: error.message || "Failed to verify recipient",
    };
  }
};

/**
 * Get supported tokens
 */
export const getSupportedTokens = () => {
  return [
    {
      symbol: "SOL",
      name: "Solana",
      decimals: 9,
      icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    },
      {
      symbol: "RADR",
      name: "RADR Coin",
      decimals: 9,
      icon: "https://www.radrlabs.io/icons/radricon.jpg",
    },
    {
      symbol: "WLFI",
      name: "WLFI",
      decimals: 6,
      icon: "https://www.radrlabs.io/icons/wlfi.png",
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      icon: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg",
    },
  ];
};

/**
 * Format transaction amount
 */
export const formatTransferAmount = (amount, decimals = 9) => {
  const value = amount / Math.pow(10, decimals);
  return value.toFixed(decimals === 9 ? 4 : 2);
};

export default {
  initializeShadowWire,
  registerAsRecipient,
  depositToShadowWire,
  withdrawFromShadowWire,
  getShadowWireBalance,
  makePrivateTransfer,
  getTransferHistory,
  validateAddress,
  checkRecipientExists,
  getSupportedTokens,
  formatTransferAmount,
};
