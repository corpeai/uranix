'use client'

import React, { useMemo } from 'react'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'
import { API_CONFIG } from "../utils/apiConfig";

const WalletProvider = ({ children }) => {
  // Use Alchemy RPC endpoint from API_CONFIG
  const endpoint = useMemo(() => {
    return API_CONFIG.network === "mainnet"
      ? API_CONFIG.alchemy.mainnet
      : API_CONFIG.alchemy.devnet;
  }, []);


  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}

export default WalletProvider;
