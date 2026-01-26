/**
 * Privacy Cash Integration
 * Full browser-compatible implementation using Light Protocol SDK
 * Re-exports the browser client for use throughout the app
 */

export { PrivacyCashBrowserClient as PrivacyCashClient } from './privacy-cash-browser';
export type {
  PrivacyCashConfig,
  DepositResult,
  WithdrawResult,
} from './privacy-cash-browser';
export type {
  DecryptedUtxo,
  EncryptedUtxo,
} from './privacy-cash-browser/encryption';

/**
 * Legacy compatibility - kept for backward compatibility
 * Modern code should use PrivacyCashBrowserClient directly
 */
import { Connection } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { PrivacyCashBrowserClient } from './privacy-cash-browser';
import { connection } from './solana';

/**
 * Create a Privacy Cash client instance
 */
export function createPrivacyCashClient(
  wallet: WalletContextState,
  customConnection?: Connection
): PrivacyCashBrowserClient {
  return new PrivacyCashBrowserClient({
    connection: customConnection || connection,
    wallet,
  });
}
