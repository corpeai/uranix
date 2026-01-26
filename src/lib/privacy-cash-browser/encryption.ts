/**
 * Privacy Cash Browser-Compatible Encryption Service
 * Uses Web Crypto API for browser environments
 * Implements both V1 (AES-128-CTR) and V2 (AES-256-GCM) encryption
 */

import { keccak256 } from '@ethersproject/keccak256';
import { PublicKey } from '@solana/web3.js';

export interface EncryptedUtxo {
  ciphertext: string;
  iv: string;
  version: 'v1' | 'v2';
  authTag?: string; // Only for V2
}

export interface DecryptedUtxo {
  amount: number;
  assetId: string;
  blinding: string;
  merkleTree: string;
  nullifier: string;
}

export class BrowserEncryptionService {
  private crypto: SubtleCrypto;

  constructor() {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API not available. Ensure you are in a browser environment with HTTPS.');
    }
    this.crypto = window.crypto.subtle;
  }

  /**
   * Derive encryption key from wallet signature
   * Uses Keccak256 to hash the signature for key derivation
   */
  async deriveEncryptionKeyFromSignature(
    signature: Uint8Array,
    version: 'v1' | 'v2' = 'v2'
  ): Promise<CryptoKey> {
    // Hash the signature using Keccak256
    const hash = keccak256(signature);
    const hashBytes = new Uint8Array(Buffer.from(hash.slice(2), 'hex'));

    const keyLength = version === 'v2' ? 32 : 16; // 256 bits for V2, 128 bits for V1
    const keyBytes = hashBytes.slice(0, keyLength);

    // Import the derived key
    const algorithm = version === 'v2' ? 'AES-GCM' : 'AES-CTR';
    return await this.crypto.importKey(
      'raw',
      keyBytes,
      { name: algorithm, length: keyLength * 8 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data using AES-256-GCM (V2) or AES-128-CTR (V1)
   */
  async encrypt(
    data: Uint8Array,
    key: CryptoKey,
    version: 'v1' | 'v2' = 'v2'
  ): Promise<EncryptedUtxo> {
    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(version === 'v2' ? 12 : 16));

    let ciphertext: ArrayBuffer;
    let authTag: string | undefined;

    if (version === 'v2') {
      // AES-256-GCM
      const encrypted = await this.crypto.encrypt(
        {
          name: 'AES-GCM',
          iv,
          tagLength: 128,
        },
        key,
        data as BufferSource
      );
      ciphertext = encrypted;
      // GCM includes auth tag in the ciphertext
    } else {
      // AES-128-CTR
      const encrypted = await this.crypto.encrypt(
        {
          name: 'AES-CTR',
          counter: iv,
          length: 64,
        },
        key,
        data as BufferSource
      );
      ciphertext = encrypted;
    }

    return {
      ciphertext: Buffer.from(ciphertext).toString('base64'),
      iv: Buffer.from(iv).toString('base64'),
      version,
      authTag,
    };
  }

  /**
   * Decrypt data using AES-256-GCM (V2) or AES-128-CTR (V1)
   */
  async decrypt(
    encrypted: EncryptedUtxo,
    key: CryptoKey
  ): Promise<Uint8Array> {
    const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');
    const iv = Buffer.from(encrypted.iv, 'base64');

    let decrypted: ArrayBuffer;

    if (encrypted.version === 'v2') {
      // AES-256-GCM
      decrypted = await this.crypto.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as BufferSource,
          tagLength: 128,
        },
        key,
        ciphertext as BufferSource
      );
    } else {
      // AES-128-CTR
      decrypted = await this.crypto.decrypt(
        {
          name: 'AES-CTR',
          counter: iv as BufferSource,
          length: 64,
        },
        key,
        ciphertext as BufferSource
      );
    }

    return new Uint8Array(decrypted);
  }

  /**
   * Encrypt UTXO data
   */
  async encryptUtxo(
    utxo: DecryptedUtxo,
    key: CryptoKey,
    version: 'v1' | 'v2' = 'v2'
  ): Promise<EncryptedUtxo> {
    const utxoJson = JSON.stringify(utxo);
    const utxoBytes = new TextEncoder().encode(utxoJson);
    return await this.encrypt(utxoBytes, key, version);
  }

  /**
   * Decrypt UTXO data
   */
  async decryptUtxo(
    encrypted: EncryptedUtxo,
    key: CryptoKey
  ): Promise<DecryptedUtxo> {
    const decrypted = await this.decrypt(encrypted, key);
    const utxoJson = new TextDecoder().decode(decrypted);
    return JSON.parse(utxoJson);
  }

  /**
   * Generate a random blinding factor for UTXO commitment
   */
  generateBlinding(): string {
    const blinding = window.crypto.getRandomValues(new Uint8Array(32));
    return Buffer.from(blinding).toString('hex');
  }

  /**
   * Compute UTXO commitment
   * commitment = hash(amount || assetId || blinding)
   */
  computeCommitment(amount: number, assetId: string, blinding: string): string {
    const amountBytes = new Uint8Array(8);
    new DataView(amountBytes.buffer).setBigUint64(0, BigInt(amount), true);

    const assetIdBytes = new PublicKey(assetId).toBytes();
    const blindingBytes = Buffer.from(blinding, 'hex');

    const combined = new Uint8Array(
      amountBytes.length + assetIdBytes.length + blindingBytes.length
    );
    combined.set(amountBytes, 0);
    combined.set(assetIdBytes, amountBytes.length);
    combined.set(blindingBytes, amountBytes.length + assetIdBytes.length);

    return keccak256(combined);
  }

  /**
   * Compute nullifier for spending UTXO
   * nullifier = hash(commitment || secret)
   */
  computeNullifier(commitment: string, secret: string): string {
    const commitmentBytes = Buffer.from(commitment.slice(2), 'hex');
    const secretBytes = Buffer.from(secret, 'hex');

    const combined = new Uint8Array(commitmentBytes.length + secretBytes.length);
    combined.set(commitmentBytes, 0);
    combined.set(secretBytes, commitmentBytes.length);

    return keccak256(combined);
  }
}

// Singleton instance
let encryptionService: BrowserEncryptionService | null = null;

export function getEncryptionService(): BrowserEncryptionService {
  if (!encryptionService) {
    encryptionService = new BrowserEncryptionService();
  }
  return encryptionService;
}
