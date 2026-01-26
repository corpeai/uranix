import axios, { AxiosInstance } from 'axios';
import {
  ApiResponse,
  ShadowPayApiKeyResponse,
  ShadowIdRegistrationResponse,
  DepositResponse,
  BalanceResponse,
  PrivacyMode,
} from '@/types';

/**
 * ShadowWire/ShadowPay API Client
 * Uses Bulletproofs and ElGamal encryption for private transfers
 * API Docs: https://registry.scalar.com/@radr/apis/shadowpay-api
 * GitHub: https://github.com/radrdotfun
 */

const SHADOWPAY_API_BASE =
  process.env.NEXT_PUBLIC_SHADOWPAY_API_BASE || 'https://shadow.radr.fun/shadowpay';

export class ShadowWireClient {
  private apiClient: AxiosInstance;
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;

    this.apiClient = axios.create({
      baseURL: SHADOWPAY_API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add API key to requests if available
    this.apiClient.interceptors.request.use((config) => {
      if (this.apiKey) {
        config.headers['X-API-Key'] = this.apiKey;
      }
      return config;
    });
  }

  /**
   * Generate API key for wallet
   * No authentication required
   */
  async generateApiKey(walletAddress: string): Promise<ApiResponse<ShadowPayApiKeyResponse>> {
    try {
      const response = await this.apiClient.post('/v1/keys/new', {
        wallet_address: walletAddress,
      });

      this.apiKey = response.data.api_key;

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error generating API key:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to generate API key',
      };
    }
  }

  /**
   * Register ShadowID for enhanced privacy
   * Requires wallet signature
   */
  async registerShadowId(
    walletAddress: string,
    signature: string,
    message: string = 'ShadowPay Registration'
  ): Promise<ApiResponse<ShadowIdRegistrationResponse>> {
    try {
      const response = await this.apiClient.post('/api/shadowid/auto-register', {
        wallet_address: walletAddress,
        signature: signature,
        message: message,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error registering ShadowID:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to register ShadowID',
      };
    }
  }

  /**
   * Deposit funds to privacy pool
   * Amount in lamports
   */
  async depositToPool(
    walletAddress: string,
    amount: number
  ): Promise<ApiResponse<DepositResponse>> {
    try {
      const response = await this.apiClient.post('/api/pool/deposit', {
        wallet: walletAddress,
        amount: amount, // lamports
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error depositing to pool:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to deposit to pool',
      };
    }
  }

  /**
   * Withdraw funds from privacy pool
   */
  async withdrawFromPool(
    walletAddress: string,
    amount: number
  ): Promise<ApiResponse<any>> {
    try {
      const response = await this.apiClient.post('/api/pool/withdraw', {
        wallet: walletAddress,
        amount: amount,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error withdrawing from pool:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to withdraw from pool',
      };
    }
  }

  /**
   * Get pool balance for wallet
   */
  async getPoolBalance(walletAddress: string): Promise<number> {
    try {
      const response = await this.apiClient.get(`/api/pool/balance/${walletAddress}`);
      return response.data.balance || 0;
    } catch (error: any) {
      console.error('Error fetching pool balance:', error);
      return 0;
    }
  }

  /**
   * Get escrow balance for wallet
   */
  async getEscrowBalance(walletAddress: string): Promise<number> {
    try {
      const response = await this.apiClient.get(`/api/escrow/balance/${walletAddress}`);
      return response.data.balance || 0;
    } catch (error: any) {
      console.error('Error fetching escrow balance:', error);
      return 0;
    }
  }

  /**
   * Execute stealth transfer
   *
   * @param mode - 'external' (sender hidden) or 'internal' (everything hidden)
   * @param sender - Sender wallet address
   * @param recipient - Recipient wallet address
   * @param amount - Amount in lamports
   */
  async executeStealthTransfer(
    mode: PrivacyMode,
    sender: string,
    recipient: string,
    amount: number
  ): Promise<ApiResponse<any>> {
    try {
      const endpoint = mode === 'external' ? '/api/transfer/external' : '/api/transfer/internal';

      const response = await this.apiClient.post(endpoint, {
        sender: sender,
        recipient: recipient,
        amount: amount,
      });

      return {
        success: true,
        data: response.data,
        message: `${mode === 'external' ? 'External' : 'Internal'} transfer initiated`,
      };
    } catch (error: any) {
      console.error('Error executing stealth transfer:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to execute stealth transfer',
      };
    }
  }

  /**
   * Get transfer history
   */
  async getTransferHistory(walletAddress: string): Promise<any[]> {
    try {
      const response = await this.apiClient.get(`/api/transfers/${walletAddress}`);
      return response.data.transfers || [];
    } catch (error: any) {
      console.error('Error fetching transfer history:', error);
      return [];
    }
  }

  /**
   * Verify Bulletproof range proof
   * Used to ensure encrypted amounts are within valid range
   */
  async verifyRangeProof(proof: any): Promise<boolean> {
    try {
      const response = await this.apiClient.post('/api/verify/range-proof', {
        proof: proof,
      });
      return response.data.valid || false;
    } catch (error: any) {
      console.error('Error verifying range proof:', error);
      return false;
    }
  }

  /**
   * Get ShadowPay statistics
   */
  async getStats(): Promise<{
    totalUsers: number;
    totalTransfers: number;
    totalVolume: number;
  }> {
    try {
      const response = await this.apiClient.get('/api/stats');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      return {
        totalUsers: 0,
        totalTransfers: 0,
        totalVolume: 0,
      };
    }
  }

  /**
   * Set API key for authenticated requests
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Get current API key
   */
  getApiKey(): string | null {
    return this.apiKey;
  }
}

// Export singleton instance
export const shadowWireClient = new ShadowWireClient();

// Utility functions for Bulletproofs and encryption
export const createBulletproofRangeProof = (
  amount: number,
  blindingFactor: string
): any => {
  // In production: implement actual Bulletproof generation
  // This proves amount is in valid range without revealing exact value
  return {
    proof: 'bulletproof-placeholder',
    commitment: 'commitment-placeholder',
  };
};

export const encryptAmount = (amount: number, publicKey: string): any => {
  // In production: implement ElGamal encryption on BN254 curve
  return {
    encrypted: 'encrypted-amount-placeholder',
    publicKey: publicKey,
  };
};

export const decryptAmount = (encrypted: any, privateKey: string): number => {
  // In production: implement ElGamal decryption
  return 0;
};
