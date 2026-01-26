import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

// Get Helius RPC endpoint or fallback to public endpoint
export const getConnection = (): Connection => {
  // Use full RPC URL if provided (safer - doesn't expose API key separately)
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

  console.log('[getConnection] Environment check:', {
    hasRpcUrl: !!rpcUrl,
    rpcUrlLength: rpcUrl?.length || 0,
    network,
  });

  let endpoint: string;

  if (rpcUrl && rpcUrl !== '') {
    // Use provided RPC URL (includes API key if needed)
    endpoint = rpcUrl;
    console.log('[getConnection] Using custom RPC URL');
  } else {
    // Fallback to public RPC
    endpoint = clusterApiUrl(network as 'devnet' | 'testnet' | 'mainnet-beta');
    console.log('[getConnection] Using public RPC:', endpoint);
  }

  return new Connection(endpoint, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });
};

// Initialize connection singleton
export const connection = getConnection();

// Utility functions
export const lamportsToSol = (lamports: number): number => {
  return lamports / LAMPORTS_PER_SOL;
};

export const solToLamports = (sol: number): number => {
  return Math.floor(sol * LAMPORTS_PER_SOL);
};

export const getBalance = async (publicKey: PublicKey): Promise<number> => {
  try {
    console.log('[getBalance] Fetching balance for:', publicKey.toBase58());
    const balance = await connection.getBalance(publicKey);
    console.log('[getBalance] Balance received:', balance, 'lamports =', lamportsToSol(balance), 'SOL');
    return lamportsToSol(balance);
  } catch (error) {
    console.error('[getBalance] Error fetching balance:', error);
    return 0;
  }
};

export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const isValidPublicKey = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// Format SOL amount with proper decimals
export const formatSol = (amount: number, decimals = 4): string => {
  return amount.toFixed(decimals);
};

// Get transaction explorer URL
export const getExplorerUrl = (signature: string, cluster?: string): string => {
  const network = cluster || process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  const clusterParam = network !== 'mainnet-beta' ? `?cluster=${network}` : '';
  return `https://explorer.solana.com/tx/${signature}${clusterParam}`;
};

// Get address explorer URL
export const getAddressExplorerUrl = (address: string, cluster?: string): string => {
  const network = cluster || process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  const clusterParam = network !== 'mainnet-beta' ? `?cluster=${network}` : '';
  return `https://explorer.solana.com/address/${address}${clusterParam}`;
};

// Constants
export const PRIVACY_CASH_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PRIVACY_CASH_PROGRAM_ID || '9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD'
);

export const MIN_SOL_BALANCE = 0.01; // Minimum SOL to keep for rent
export const DEFAULT_TRANSFER_AMOUNT = 0.1; // Default transfer amount in SOL
