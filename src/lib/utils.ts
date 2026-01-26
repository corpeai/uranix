import { type ClassValue, clsx } from 'clsx';

// Utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format number with commas
export const formatNumber = (num: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// Format currency
export const formatCurrency = (amount: number, currency = 'SOL'): string => {
  return `${formatNumber(amount, 4)} ${currency}`;
};

// Format date/time
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

// Privacy score calculator
export const calculatePrivacyScore = (
  protectedTransactions: number,
  totalTransactions: number,
  hasPrivateBalance: boolean,
  usesStealthMode: boolean
): number => {
  let score = 0;

  // Base score from transaction privacy (60% weight)
  if (totalTransactions > 0) {
    const privacyRatio = protectedTransactions / totalTransactions;
    score += privacyRatio * 60;
  }

  // Balance privacy (20% weight)
  if (hasPrivateBalance) {
    score += 20;
  }

  // Stealth mode usage (20% weight)
  if (usesStealthMode) {
    score += 20;
  }

  return Math.min(100, Math.round(score));
};

// Get privacy level based on score
export const getPrivacyLevel = (
  score: number
): { level: string; color: string; description: string } => {
  if (score >= 80) {
    return {
      level: 'Excellent',
      color: 'text-green-500',
      description: 'Your privacy is well protected',
    };
  } else if (score >= 60) {
    return {
      level: 'Good',
      color: 'text-blue-500',
      description: 'Good privacy, but room for improvement',
    };
  } else if (score >= 40) {
    return {
      level: 'Fair',
      color: 'text-yellow-500',
      description: 'Your activity is partially exposed',
    };
  } else {
    return {
      level: 'Poor',
      color: 'text-red-500',
      description: 'Your activity is highly exposed',
    };
  }
};

// Copy to clipboard utility
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Sleep utility
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Generate random ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Validate SOL amount
export const isValidSolAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < 1000000;
};

// Format large numbers (K, M, B)
export const formatLargeNumber = (num: number): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

// Get risk level color
export const getRiskColor = (risk: 'low' | 'medium' | 'high'): string => {
  switch (risk) {
    case 'low':
      return 'text-green-500 bg-green-500/10';
    case 'medium':
      return 'text-yellow-500 bg-yellow-500/10';
    case 'high':
      return 'text-red-500 bg-red-500/10';
    default:
      return 'text-gray-500 bg-gray-500/10';
  }
};
