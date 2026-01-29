'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { surveillanceMonitor, simulateTrackerView } from '@/lib/surveillance';
import { SurveillanceData } from '@/types';

export const useSurveillance = () => {
  const { publicKey } = useWallet();
  const [data, setData] = useState<SurveillanceData | null>(null);
  const [trackerView, setTrackerView] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!publicKey) {
      setData(null);
      setTrackerView(null);
      return;
    }

    setLoading(true);

    try {
      // Analyze surveillance exposure
      const surveillanceData = await surveillanceMonitor.analyzeSurveillance(publicKey);
      setData(surveillanceData);

      // Simulate what trackers can see
      const trackerViewData = await simulateTrackerView(publicKey);
      setTrackerView(trackerViewData);
    } catch (error) {
      console.error('Error analyzing surveillance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyze();
  }, [publicKey]);

  return {
    data,
    trackerView,
    loading,
    refresh: analyze,
  };
};
