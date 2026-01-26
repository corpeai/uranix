'use client';

import { FC, ReactNode, useMemo, useCallback } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { API_CONFIG } from "../utils/apiConfig";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

const WalletProvider = ({ children }) => {
 // Determine network from environment
const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Devnet; 
  
  // Use Alchemy RPC endpoint from API_CONFIG
  const endpoint = useMemo(() => {
    return API_CONFIG.network === "mainnet"
      ? API_CONFIG.alchemy.mainnet
      : API_CONFIG.alchemy.devnet;
  }, []);

  // Configure wallet adapters
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider;
