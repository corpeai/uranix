'use client';

import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { connection } from '@/lib/solana';
import { PrivacyCashBrowserClient } from '@/lib/privacy-cash-browser';

interface PrivacyCashDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PrivacyCashDepositModal: FC<PrivacyCashDepositModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const wallet = useWallet();
  const { publicKey, signTransaction } = wallet;
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDeposit = async () => {
    if (!publicKey) {
      setError('Wallet not connected');
      return;
    }

    if (!signTransaction) {
      setError('Wallet does not support transaction signing');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Minimum deposit: 0.001 SOL
    if (amountNum < 0.001) {
      setError('Minimum deposit is 0.001 SOL');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('[PrivacyCashDeposit] Step 1: Creating Privacy Cash client');
      const privacyCash = new PrivacyCashBrowserClient({
        connection,
        wallet: wallet as any,
      });

      console.log('[PrivacyCashDeposit] Step 2: Requesting unsigned transaction from API');
      const lamports = Math.floor(amountNum * 1e9);
      console.log('[PrivacyCashDeposit] Amount:', amountNum, 'SOL =', lamports, 'lamports');

      // Get unsigned transaction from API
      const depositResult = await privacyCash.deposit(lamports);

      if (!depositResult.commitment) {
        throw new Error('Failed to create deposit transaction');
      }

      console.log('[PrivacyCashDeposit] Step 3: Deserializing transaction');
      const txBuffer = Buffer.from(depositResult.commitment, 'base64');
      const transaction = Transaction.from(txBuffer);

      console.log('[PrivacyCashDeposit] Step 4: Signing transaction with wallet');
      const signedTx = await signTransaction(transaction);

      console.log('[PrivacyCashDeposit] Step 5: Broadcasting transaction to network');
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      console.log('[PrivacyCashDeposit] Transaction sent:', signature);

      console.log('[PrivacyCashDeposit] Step 6: Confirming transaction...');
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log('[PrivacyCashDeposit] Transaction confirmed on blockchain!');

      // Step 7: Update backend with transaction signature
      console.log('[PrivacyCashDeposit] Step 7: Updating backend with signature...');
      const confirmResponse = await fetch('/api/privacy-cash/confirm-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          signature,
          amount: lamports,
        }),
      });

      const confirmResult = await confirmResponse.json();

      if (!confirmResult.success) {
        console.error('[PrivacyCashDeposit] Failed to confirm with backend:', confirmResult.error);
        // Don't fail the whole operation - the blockchain tx succeeded
        // Just log the warning
      } else {
        console.log('[PrivacyCashDeposit] Backend updated successfully');
      }

      setSuccess(
        `Successfully deposited ${amountNum} SOL to Privacy Cash! Transaction: ${signature}`
      );
      setAmount('');

      // Call onSuccess after a brief delay to show the success message
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('[PrivacyCashDeposit] Error:', err);
      setError(err.message || 'Failed to deposit');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full border border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>🔐</span> Privacy Cash Deposit
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-300">
            <p className="font-medium mb-1">What is Privacy Cash?</p>
            <p className="text-xs text-blue-200/80">
              Privacy Cash uses server-side keypairs to shield your SOL. Your funds are encrypted
              and stored in a separate account that cannot be linked to your public wallet.
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount (SOL)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
              min="0.001"
              step="0.001"
              disabled={loading}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <p className="text-xs text-zinc-500 mt-1">Minimum: 0.001 SOL</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-300">
              {success}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeposit}
              disabled={loading || !amount}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                'Deposit'
              )}
            </button>
          </div>

          {/* Privacy Notice */}
          <div className="pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              🔒 Your funds will be transferred to an encrypted Privacy Cash account. Only you can
              withdraw them using your wallet signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
