/**
 * Unified Privacy Service
 * Combines Privacy Cash (ZK-SNARKs) and ShadowWire (Bulletproofs + ElGamal)
 * Provides a single interface for all privacy operations
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { PrivacyCashBrowserClient, DepositResult, WithdrawResult } from './privacy-cash-browser';
import { ShadowWireClient } from './shadowwire';
import type { PrivacyMode } from '@/types';

export interface UnifiedPrivacyConfig {
  connection: Connection;
  wallet: WalletContextState;
  shadowPayApiKey?: string;
}

export interface PrivacyBalance {
  privacyCash: number; // ZK-SNARK shielded balance
  shadowPay: number; // Bulletproof shielded balance
  total: number;
}

export interface TransferResult {
  signature: string;
  method: 'privacy-cash' | 'shadow-pay';
  amount: number;
}

export class UnifiedPrivacyService {
  private privacyCash: PrivacyCashBrowserClient;
  private shadowWire: ShadowWireClient;
  private wallet: WalletContextState;
  private connection: Connection;

  constructor(config: UnifiedPrivacyConfig) {
    this.wallet = config.wallet;
    this.connection = config.connection;

    // Initialize Privacy Cash
    this.privacyCash = new PrivacyCashBrowserClient({
      connection: config.connection,
      wallet: config.wallet,
    });

    // Initialize ShadowWire
    this.shadowWire = new ShadowWireClient(config.shadowPayApiKey);
  }

  /**
   * Initialize both privacy services
   */
  async initialize(): Promise<void> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    // Initialize Privacy Cash encryption
    await this.privacyCash.initialize();

    // Initialize ShadowPay API key if not provided
    const apiKeyResult = await this.shadowWire.generateApiKey(
      this.wallet.publicKey.toBase58()
    );

    if (!apiKeyResult.success) {
      console.warn('Failed to generate ShadowPay API key:', apiKeyResult.error);
    }
  }

  /**
   * Get combined privacy balance from both services
   */
  async getPrivacyBalance(): Promise<PrivacyBalance> {
    if (!this.wallet.publicKey) {
      return { privacyCash: 0, shadowPay: 0, total: 0 };
    }

    const [privacyCashBalance, shadowPoolBalance, shadowEscrowBalance] = await Promise.all([
      this.privacyCash.getPrivateBalance().catch(() => 0),
      this.shadowWire.getPoolBalance(this.wallet.publicKey.toBase58()).catch(() => 0),
      this.shadowWire.getEscrowBalance(this.wallet.publicKey.toBase58()).catch(() => 0),
    ]);

    const shadowPayBalance = shadowPoolBalance + shadowEscrowBalance;

    return {
      privacyCash: privacyCashBalance,
      shadowPay: shadowPayBalance / 1e9, // Convert lamports to SOL
      total: privacyCashBalance + (shadowPayBalance / 1e9),
    };
  }

  /**
   * Deposit SOL using the specified privacy method
   */
  async deposit(
    amount: number,
    method: 'privacy-cash' | 'shadow-pay' = 'privacy-cash'
  ): Promise<DepositResult | TransferResult> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    if (method === 'privacy-cash') {
      return await this.privacyCash.deposit(amount);
    } else {
      const lamports = Math.floor(amount * 1e9);
      const result = await this.shadowWire.depositToPool(
        this.wallet.publicKey.toBase58(),
        lamports
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Deposit failed');
      }

      return {
        signature: result.data.transaction_id || 'shadow-pay-deposit',
        method: 'shadow-pay',
        amount,
      };
    }
  }

  /**
   * Withdraw SOL using the specified privacy method
   */
  async withdraw(
    amount: number,
    recipient?: PublicKey,
    method: 'privacy-cash' | 'shadow-pay' = 'privacy-cash'
  ): Promise<WithdrawResult | TransferResult> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const recipientKey = recipient || this.wallet.publicKey;

    if (method === 'privacy-cash') {
      return await this.privacyCash.withdraw(amount, recipientKey);
    } else {
      const lamports = Math.floor(amount * 1e9);
      const result = await this.shadowWire.withdrawFromPool(
        this.wallet.publicKey.toBase58(),
        lamports
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Withdrawal failed');
      }

      return {
        signature: result.data.transaction_id || 'shadow-pay-withdraw',
        method: 'shadow-pay',
        amount,
      };
    }
  }

  /**
   * Send private transfer using ShadowPay stealth mode
   */
  async sendStealthTransfer(
    recipient: string,
    amount: number,
    mode: PrivacyMode = 'external'
  ): Promise<TransferResult> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const lamports = Math.floor(amount * 1e9);
    const result = await this.shadowWire.executeStealthTransfer(
      mode,
      this.wallet.publicKey.toBase58(),
      recipient,
      lamports
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Transfer failed');
    }

    return {
      signature: result.data.transaction_id || 'shadow-pay-transfer',
      method: 'shadow-pay',
      amount,
    };
  }

  /**
   * Get transaction history from both services
   */
  async getTransactionHistory() {
    if (!this.wallet.publicKey) {
      return [];
    }

    const shadowPayHistory = await this.shadowWire.getTransferHistory(
      this.wallet.publicKey.toBase58()
    );

    return shadowPayHistory || [];
  }

  /**
   * Get privacy statistics and recommendations
   */
  async getPrivacyStats() {
    const balance = await this.getPrivacyBalance();
    const publicBalance = this.wallet.publicKey
      ? await this.connection.getBalance(this.wallet.publicKey)
      : 0;
    const publicBalanceSOL = publicBalance / 1e9;

    const privacyPercentage = balance.total > 0
      ? (balance.total / (balance.total + publicBalanceSOL)) * 100
      : 0;

    return {
      privacyBalance: balance,
      publicBalance: publicBalanceSOL,
      privacyPercentage,
      recommendations: this.getRecommendations(privacyPercentage, balance),
    };
  }

  /**
   * Get privacy recommendations based on current state
   */
  private getRecommendations(privacyPercentage: number, balance: PrivacyBalance): string[] {
    const recommendations: string[] = [];

    if (privacyPercentage < 50) {
      recommendations.push('Shield more of your balance using Privacy Cash for better privacy');
    }

    if (balance.privacyCash === 0) {
      recommendations.push('Deposit to Privacy Cash pool to use ZK-SNARK privacy');
    }

    if (balance.shadowPay === 0) {
      recommendations.push('Try ShadowPay for fast, bulletproof-based private transfers');
    }

    if (privacyPercentage > 80) {
      recommendations.push('Excellent privacy coverage! Your funds are well protected');
    }

    return recommendations;
  }

  /**
   * Reset all privacy data (clear cached UTXOs and keys)
   */
  async reset(): Promise<void> {
    await this.privacyCash.reset();
    // ShadowPay data is server-side, no local reset needed
  }

  /**
   * Get Privacy Cash client for advanced operations
   */
  getPrivacyCashClient(): PrivacyCashBrowserClient {
    return this.privacyCash;
  }

  /**
   * Get ShadowWire client for advanced operations
   */
  getShadowWireClient(): ShadowWireClient {
    return this.shadowWire;
  }
}

/**
 * Create unified privacy service instance
 */
export function createUnifiedPrivacyService(
  wallet: WalletContextState,
  connection: Connection,
  shadowPayApiKey?: string
): UnifiedPrivacyService {
  return new UnifiedPrivacyService({
    connection,
    wallet,
    shadowPayApiKey,
  });
}
