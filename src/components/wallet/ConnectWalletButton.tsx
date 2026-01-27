'use client';

import { FC, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';

interface ConnectWalletButtonProps {
  children?: ReactNode;
  className?: string;
  connectedHref?: string;
  connectedText?: string;
}

export const ConnectWalletButton: FC<ConnectWalletButtonProps> = ({
  children,
  className = '',
  connectedHref = '/dashboard',
  connectedText = 'Go to Dashboard',
}) => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = () => {
    if (!connected) {
      setVisible(true);
    }
  };

  if (connected) {
    return (
      <Link href={connectedHref} className={className}>
        {children || connectedText}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={className}>
      {children || 'Connect Wallet'}
    </button>
  );
};
