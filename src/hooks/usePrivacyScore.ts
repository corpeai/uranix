'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { surveillanceMonitor } from '@/lib/surveillance';
import { usePrivacyStore } from '@/store/privacy-store';
import { PrivacyScore } from '@/types';

export const usePrivacyScore = () => {
  const { publicKey } = useWallet();
  const { isPrivacyEnabled, currentMode } = usePrivacyStore();
  const [score, setScore] = useState<PrivacyScore | null>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    if (!publicKey) {
      setScore(null);
      return;
    }

    setLoading(true);

    try {
      const privacyScore = await surveillanceMonitor.calculatePrivacyScore(
        publicKey,
        isPrivacyEnabled,
        currentMode === 'internal'
      );

      setScore(privacyScore);
    } catch (error) {
      console.error('Error calculating privacy score:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculate();
  }, [publicKey, isPrivacyEnabled, currentMode]);

  return {
    score,
    loading,
    refresh: calculate,
  };
};
