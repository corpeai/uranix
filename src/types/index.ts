import { PublicKey } from '@solana/web3.js';

// Privacy Mode Types
export type PrivacyMode = 'external' | 'internal';

export interface PrivateBalance {
  publicBalance: number;
  privateBalance: number;
  privacyCashBalance: number;
  shadowPayBalance: number;
  totalBalance: number;
}

export interface PrivacyScore {
  score: number; // 0-100
  exposedDataPoints: string[];
  protectedDataPoints: string[];
  recommendations: string[];
}

// Transaction Types
export interface StealthTransfer {
  recipient: string;
  amount: number;
  mode: PrivacyMode;
  memo?: string;
}

export interface TransactionHistory {
  signature: string;
  timestamp: number;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  isPrivate: boolean;
}

// Surveillance Types
export interface SurveillanceData {
  walletAddress: string;
  exposedTransactions: number;
  protectedTransactions: number;
  balanceExposed: boolean;
  trackingRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
}

// Privacy Cash Types
export interface PrivacyCashDeposit {
  amount: number;
  commitment?: string;
  nullifier?: string;
}

export interface PrivacyCashWithdraw {
  amount: number;
  recipient: PublicKey;
  proof?: any;
}

// ShadowWire Types
export interface ShadowWireConfig {
  apiKey: string;
  shadowId?: string;
  registered: boolean;
}

export interface ShadowPayTransfer {
  sender: string;
  recipient: string;
  amount: number;
  mode: PrivacyMode;
  encrypted: boolean;
}

export interface PoolBalance {
  wallet: string;
  poolBalance: number;
  escrowBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

// UI State Types
export interface PrivacyState {
  isPrivacyEnabled: boolean;
  currentMode: PrivacyMode;
  showPublicView: boolean;
  privacyScore: PrivacyScore | null;
  shadowWireConfig: ShadowWireConfig | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ShadowPayApiKeyResponse {
  api_key: string;
  wallet_address: string;
  created_at: string;
}

export interface ShadowIdRegistrationResponse {
  shadow_id: string;
  wallet_address: string;
  status: string;
}

export interface DepositResponse {
  success: boolean;
  amount: number;
  unsigned_tx_base64: string; // Base64 encoded unsigned transaction
  pool_address: string;
  user_balance_pda: string;
  // Optional alternative field names for compatibility
  transaction?: string;
  serialized_transaction?: string;
  transaction_id?: string;
  status?: string;
}

export interface BalanceResponse {
  wallet: string;
  balance: number;
  currency: string;
}

// Educational Content Types
export interface EducationalSection {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

// Wallet Types
export interface WalletInfo {
  address: string;
  balance: number;
  connected: boolean;
  network: string;
}
