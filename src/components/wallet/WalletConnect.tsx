'use client';

import { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { shortenAddress } from '@/lib/solana';

export const WalletConnect: FC = () => {
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-10 w-32 bg-zinc-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {connected && publicKey && (
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-zinc-400">
            {shortenAddress(publicKey.toBase58())}
          </span>
        </div>
      )}
      <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !rounded-lg !h-10 !px-4 !text-sm !font-medium !transition-all" />
    </div>
  );
};
