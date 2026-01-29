'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { shadowWireClient } from '@/lib/shadowwire';
import { PrivacyMode, StealthTransfer } from '@/types';
import toast from 'react-hot-toast';

export const useStealthMode = () => {
  const { publicKey, signMessage } = useWallet();
  const [loading, setLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<PrivacyMode>('external');

  const executeTransfer = async (transfer: StealthTransfer): Promise<boolean> => {
    if (!publicKey || !signMessage) {
      toast.error('Please connect your wallet first');
      return false;
    }

    setLoading(true);

    try {
      // Validate recipient address
      let recipientKey: PublicKey;
      try {
        recipientKey = new PublicKey(transfer.recipient);
      } catch {
        toast.error('Invalid recipient address');
        return false;
      }

      // Convert SOL to lamports
      const lamports = Math.floor(transfer.amount * 1e9);

      // Execute stealth transfer
      const result = await shadowWireClient.executeStealthTransfer(
        transfer.mode,
        publicKey.toBase58(),
        transfer.recipient,
        lamports
      );

      if (result.success) {
        toast.success(`${transfer.mode === 'external' ? 'External' : 'Internal'} transfer successful!`);
        return true;
      } else {
        toast.error(result.error || 'Transfer failed');
        return false;
      }
    } catch (error: any) {
      console.error('Stealth transfer error:', error);
      toast.error(error.message || 'Transfer failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode: PrivacyMode) => {
    setCurrentMode(mode);
    toast.success(`Switched to ${mode === 'external' ? 'External' : 'Internal'} mode`);
  };

  return {
    currentMode,
    loading,
    executeTransfer,
    switchMode,
  };
};
