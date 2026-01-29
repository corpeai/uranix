'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getBalance, connection } from '@/lib/solana';
import { PrivacyCashClient } from '@/lib/privacy-cash';
import { shadowWireClient } from '@/lib/shadowwire';
import { PrivateBalance } from '@/types';

export const usePrivateBalance = () => {
  const { publicKey, wallet } = useWallet();
  const [balance, setBalance] = useState<PrivateBalance>({
    publicBalance: 0,
    privateBalance: 0,
    privacyCashBalance: 0,
    shadowPayBalance: 0,
    totalBalance: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    if (!publicKey) {
      setBalance({
        publicBalance: 0,
        privateBalance: 0,
        privacyCashBalance: 0,
        shadowPayBalance: 0,
        totalBalance: 0,
      });
      return;
    }

    console.log('[usePrivateBalance] Starting balance fetch for:', publicKey.toBase58());
    setLoading(true);
    setError(null);

    try {
      // Get public balance
      console.log('[usePrivateBalance] Fetching public balance...');
      const publicBalance = await getBalance(publicKey);
      console.log('[usePrivateBalance] Public balance:', publicBalance);

      // Get Privacy Cash balance
      console.log('[usePrivateBalance] Fetching Privacy Cash balance...');
      let privacyCashBalance = 0;

      if (wallet && publicKey) {
        try {
          const response = await fetch(
            `/api/privacy-cash/balance?walletAddress=${publicKey.toBase58()}`
          );
          const result = await response.json();

          if (result.success && result.balance !== undefined) {
            privacyCashBalance = result.balance / 1e9; // Convert lamports to SOL
            console.log('[usePrivateBalance] Privacy Cash balance:', privacyCashBalance, 'SOL');
          } else {
            console.warn('[usePrivateBalance] Privacy Cash API returned:', result);
          }
        } catch (error) {
          console.error('[usePrivateBalance] Failed to fetch Privacy Cash balance:', error);
        }
      } else {
        console.log('[usePrivateBalance] Wallet not fully connected, skipping Privacy Cash balance');
      }

      // Get ShadowPay pool balance
      const shadowPayBalance = await shadowWireClient.getPoolBalance(publicKey.toBase58());

      // Calculate totals
      const privateBalance = privacyCashBalance + shadowPayBalance;
      const totalBalance = publicBalance + privateBalance;

      console.log('[usePrivateBalance] Setting balance state:', {
        publicBalance,
        privateBalance,
        privacyCashBalance,
        shadowPayBalance,
        totalBalance,
      });

      setBalance({
        publicBalance,
        privateBalance,
        privacyCashBalance,
        shadowPayBalance,
        totalBalance,
      });
    } catch (err: any) {
      console.error('Error fetching balances:', err);
      setError(err.message || 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  return {
    balance,
    loading,
    error,
    refresh: fetchBalances,
  };
};
