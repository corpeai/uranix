/**
 * Privacy Cash Browser Client
 * Full integration with Light Protocol SDK for browser environments
 */

import { Connection, PublicKey, TransactionSignature } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import {
  getEncryptionService,
  type DecryptedUtxo,
  type EncryptedUtxo,
} from './encryption';
import { getStorageAdapter } from './storage';

export interface PrivacyCashConfig {
  connection: Connection;
  wallet: WalletContextState;
  rpcEndpoint?: string;
}

export interface DepositResult {
  signature: TransactionSignature;
  commitment: string;
  leafIndex: number;
  merkleTree: string;
}

export interface WithdrawResult {
  signature: TransactionSignature;
  amount: number;
}

export class PrivacyCashBrowserClient {
  private wallet: WalletContextState;
  private encryption = getEncryptionService();
  private storage = getStorageAdapter();
  private encryptionKey: CryptoKey | null = null;

  constructor(config: PrivacyCashConfig) {
    this.wallet = config.wallet;
  }

  /**
   * Initialize the client by deriving encryption key from wallet signature
   */
  async initialize(): Promise<void> {
    if (!this.wallet.publicKey || !this.wallet.signMessage) {
      throw new Error('Wallet not connected');
    }

    // Request wallet signature for encryption key derivation
    const message = new TextEncoder().encode(
      `Sign this message to derive your Privacy Cash encryption key.\n\nThis signature is used locally to encrypt your private transaction data.\n\nWallet: ${this.wallet.publicKey.toBase58()}\nTimestamp: ${Date.now()}`
    );

    const signature = await this.wallet.signMessage(message);

    // Derive encryption key from signature
    this.encryptionKey = await this.encryption.deriveEncryptionKeyFromSignature(
      signature,
      'v2' // Use V2 (AES-256-GCM)
    );
  }

  /**
   * Deposit SOL into Privacy Cash pool (shield)
   * Uses Supabase backend to manage server-side keypairs
   */
  async deposit(amount: number): Promise<DepositResult> {
    if (!this.wallet.publicKey || !this.wallet.signMessage) {
      throw new Error('Wallet not connected');
    }

    // Get wallet signature for authorization
    const message = `Privacy Cash Deposit\nAmount: ${amount} lamports\nTimestamp: ${Date.now()}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = await this.wallet.signMessage(messageBytes);
    const signatureBase58 = Buffer.from(signature).toString('base64');

    // Call API to create unsigned transaction
    const response = await fetch('/api/privacy-cash/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: this.wallet.publicKey.toBase58(),
        amount,
        signature: signatureBase58,
        message,
      }),
    });

    const result = await response.json();

    if (!result.success || !result.unsigned_tx_base64) {
      throw new Error(result.error || 'Failed to create deposit transaction');
    }

    // Return deposit result with placeholder values
    // (actual signature will be generated when user signs and broadcasts)
    return {
      signature: 'pending' as TransactionSignature,
      commitment: result.unsigned_tx_base64,
      leafIndex: 0,
      merkleTree: result.privacyPubkey,
    };
  }

  /**
   * Withdraw SOL from Privacy Cash pool (unshield)
   * Server-side signing using encrypted keypair stored in Supabase
   */
  async withdraw(amount: number, recipient?: PublicKey): Promise<WithdrawResult> {
    if (!this.wallet.publicKey || !this.wallet.signMessage) {
      throw new Error('Wallet not connected');
    }

    const recipientAddress = recipient?.toBase58() || this.wallet.publicKey.toBase58();

    // Get wallet signature for authorization
    const message = `Privacy Cash Withdrawal\nAmount: ${amount} lamports\nRecipient: ${recipientAddress}\nTimestamp: ${Date.now()}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = await this.wallet.signMessage(messageBytes);
    const signatureBase58 = Buffer.from(signature).toString('base64');

    // Call API to execute withdrawal (server-side signing)
    const response = await fetch('/api/privacy-cash/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: this.wallet.publicKey.toBase58(),
        amount,
        recipient: recipientAddress,
        signature: signatureBase58,
        message,
      }),
    });

    const result = await response.json();

    if (!result.success || !result.signature) {
      throw new Error(result.error || 'Failed to withdraw');
    }

    return {
      signature: result.signature as TransactionSignature,
      amount,
    };
  }

  /**
   * Get private balance from Privacy Cash account
   */
  async getPrivateBalance(): Promise<number> {
    if (!this.wallet.publicKey) {
      return 0;
    }

    try {
      const response = await fetch(
        `/api/privacy-cash/balance?walletAddress=${this.wallet.publicKey.toBase58()}`
      );

      const result = await response.json();

      if (!result.success) {
        console.error('Failed to get balance:', result.error);
        return 0;
      }

      // Return balance in SOL (API returns lamports)
      return (result.balance || 0) / 1e9;
    } catch (error) {
      console.error('Failed to get private balance:', error);
      return 0;
    }
  }

  /**
   * Get all UTXOs (for debugging/display)
   */
  async getUtxos(): Promise<DecryptedUtxo[]> {
    if (!this.wallet.publicKey || !this.encryptionKey) {
      return [];
    }

    const storedUtxos = await this.storage.getUnspentUtxos(
      this.wallet.publicKey.toBase58()
    );

    const decrypted: DecryptedUtxo[] = [];
    for (const stored of storedUtxos) {
      try {
        const utxo = await this.encryption.decryptUtxo(
          stored.encrypted,
          this.encryptionKey
        );
        decrypted.push(utxo);
      } catch (error) {
        console.error('Failed to decrypt UTXO:', error);
      }
    }

    return decrypted;
  }

  /**
   * Clear all cached UTXOs (reset)
   */
  async reset(): Promise<void> {
    if (!this.wallet.publicKey) {
      return;
    }

    await this.storage.clearUtxos(this.wallet.publicKey.toBase58());
    this.encryptionKey = null;
  }
}
