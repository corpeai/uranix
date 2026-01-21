import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { API_CONFIG } from "../utils/apiConfig";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

const WalletProvider = ({ children }) => {
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
