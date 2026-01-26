/**
 * Privacy Cash Browser Storage Adapter
 * Uses localStorage for UTXO caching in browser environments
 */

import { EncryptedUtxo } from './encryption';

export interface StoredUtxo {
  encrypted: EncryptedUtxo;
  merkleTree: string;
  leafIndex: number;
  timestamp: number;
  spent: boolean;
}

export class BrowserStorageAdapter {
  private readonly STORAGE_KEY_PREFIX = 'privacy_cash_utxos_';

  /**
   * Get storage key for a specific wallet
   */
  private getStorageKey(walletAddress: string): string {
    return `${this.STORAGE_KEY_PREFIX}${walletAddress}`;
  }

  /**
   * Save UTXOs to localStorage
   */
  async saveUtxos(walletAddress: string, utxos: StoredUtxo[]): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage not available');
    }

    const key = this.getStorageKey(walletAddress);
    const data = JSON.stringify(utxos);

    try {
      window.localStorage.setItem(key, data);
    } catch (error) {
      console.error('Failed to save UTXOs to localStorage:', error);
      throw new Error('Storage quota exceeded or localStorage unavailable');
    }
  }

  /**
   * Load UTXOs from localStorage
   */
  async loadUtxos(walletAddress: string): Promise<StoredUtxo[]> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    const key = this.getStorageKey(walletAddress);
    const data = window.localStorage.getItem(key);

    if (!data) {
      return [];
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse stored UTXOs:', error);
      return [];
    }
  }

  /**
   * Add a new UTXO to storage
   */
  async addUtxo(walletAddress: string, utxo: StoredUtxo): Promise<void> {
    const utxos = await this.loadUtxos(walletAddress);
    utxos.push(utxo);
    await this.saveUtxos(walletAddress, utxos);
  }

  /**
   * Mark a UTXO as spent
   */
  async markUtxoSpent(
    walletAddress: string,
    merkleTree: string,
    leafIndex: number
  ): Promise<void> {
    const utxos = await this.loadUtxos(walletAddress);
    const utxo = utxos.find(
      (u) => u.merkleTree === merkleTree && u.leafIndex === leafIndex
    );

    if (utxo) {
      utxo.spent = true;
      await this.saveUtxos(walletAddress, utxos);
    }
  }

  /**
   * Get unspent UTXOs
   */
  async getUnspentUtxos(walletAddress: string): Promise<StoredUtxo[]> {
    const utxos = await this.loadUtxos(walletAddress);
    return utxos.filter((u) => !u.spent);
  }

  /**
   * Clear all UTXOs for a wallet
   */
  async clearUtxos(walletAddress: string): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const key = this.getStorageKey(walletAddress);
    window.localStorage.removeItem(key);
  }

  /**
   * Get total number of stored UTXOs
   */
  async getUtxoCount(walletAddress: string): Promise<number> {
    const utxos = await this.loadUtxos(walletAddress);
    return utxos.length;
  }

  /**
   * Get storage size estimate in bytes
   */
  getStorageSizeEstimate(walletAddress: string): number {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 0;
    }

    const key = this.getStorageKey(walletAddress);
    const data = window.localStorage.getItem(key);
    return data ? new Blob([data]).size : 0;
  }
}

// Singleton instance
let storageAdapter: BrowserStorageAdapter | null = null;

export function getStorageAdapter(): BrowserStorageAdapter {
  if (!storageAdapter) {
    storageAdapter = new BrowserStorageAdapter();
  }
  return storageAdapter;
}
