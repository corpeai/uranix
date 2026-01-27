'use client';

import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { connection } from '@/lib/solana';
import { shadowWireClient } from '@/lib/shadowwire';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DepositModal: FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { publicKey, signTransaction } = useWallet();
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

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('[DepositModal] Step 1: Requesting unsigned transaction from ShadowPay API');
      console.log('[DepositModal] Amount:', amountNum, 'SOL');

      // Step 1: Get unsigned transaction from ShadowPay API
      const lamports = Math.floor(amountNum * 1e9);
      const result = await shadowWireClient.depositToPool(
        publicKey.toBase58(),
        lamports
      );

      console.log('[DepositModal] API Response:', result);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get transaction from API');
      }

      // Step 2: Deserialize the transaction
      console.log('[DepositModal] Step 2: Looking for transaction in response');
      console.log('[DepositModal] Response data structure:', Object.keys(result.data));

      let transactionData: string | null = null;

      // Try to find the transaction data in various possible formats
      if (typeof result.data === 'string') {
        // Entire response is a base64 string
        transactionData = result.data;
      } else if (result.data.unsigned_tx_base64) {
        // ShadowPay API format
        transactionData = result.data.unsigned_tx_base64;
        console.log('[DepositModal] Found unsigned_tx_base64 field');
      } else if (result.data.transaction) {
        // Alternative: 'transaction' field
        transactionData = result.data.transaction;
      } else if (result.data.serialized_transaction) {
        // Alternative: 'serialized_transaction' field
        transactionData = result.data.serialized_transaction;
      } else {
        // API doesn't return an unsigned transaction - show detailed error
        console.error('[DepositModal] API response does not contain transaction data');
        console.error('[DepositModal] Available fields:', Object.keys(result.data));
        console.error('[DepositModal] Full response:', result.data);
        throw new Error(
          `ShadowPay API returned success but no transaction to sign. ` +
          `Response contains: ${Object.keys(result.data).join(', ')}. ` +
          `This API may not support client-side transaction signing yet.`
        );
      }

      if (!transactionData) {
        throw new Error('Transaction data is null after extraction');
      }

      console.log('[DepositModal] Found transaction data, deserializing...');
      console.log('[DepositModal] Transaction length:', transactionData.length, 'characters');

      let transaction: Transaction | VersionedTransaction;
      try {
        // Try legacy Transaction first
        transaction = Transaction.from(Buffer.from(transactionData, 'base64'));
        console.log('[DepositModal] Deserialized as legacy Transaction');
      } catch (legacyError) {
        try {
          // Try VersionedTransaction if legacy fails
          transaction = VersionedTransaction.deserialize(Buffer.from(transactionData, 'base64'));
          console.log('[DepositModal] Deserialized as VersionedTransaction');
        } catch (versionedError) {
          console.error('[DepositModal] Failed to deserialize as legacy:', legacyError);
          console.error('[DepositModal] Failed to deserialize as versioned:', versionedError);
          throw new Error('Failed to deserialize transaction from API response');
        }
      }

      console.log('[DepositModal] Transaction deserialized successfully');

      // Step 2.5: Refresh blockhash to prevent expiration
      console.log('[DepositModal] Step 2.5: Refreshing blockhash...');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

      // Update transaction with fresh blockhash
      if (transaction instanceof Transaction) {
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        console.log('[DepositModal] Updated legacy transaction with fresh blockhash');
      } else {
        // VersionedTransaction - need to reconstruct message with new blockhash
        console.log('[DepositModal] Cannot update VersionedTransaction blockhash - using as-is');
      }

      // Step 3: Sign the transaction with wallet
      console.log('[DepositModal] Step 3: Requesting wallet signature');
      const signedTransaction = await signTransaction(transaction);
      console.log('[DepositModal] Transaction signed');

      // Step 4: Send the signed transaction to the blockchain
      console.log('[DepositModal] Step 4: Broadcasting transaction to Solana');
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      console.log('[DepositModal] Transaction sent. Signature:', signature);

      // Step 5: Wait for confirmation
      console.log('[DepositModal] Step 5: Waiting for confirmation...');
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: blockhash,
        lastValidBlockHeight: lastValidBlockHeight,
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log('[DepositModal] Transaction confirmed!');
      setSuccess(`Successfully deposited ${amountNum} SOL to ShadowPay pool! Signature: ${signature.slice(0, 8)}...`);
      setAmount('');

      // Wait 2 seconds then close and refresh
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('[DepositModal] Error:', err);

      // Provide more helpful error messages
      let errorMessage = err.message || 'Failed to deposit';

      if (errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (errorMessage.includes('Blockhash not found')) {
        errorMessage = 'Transaction expired. Please try again.';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance for this transaction';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Deposit to ShadowPay</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-zinc-300">
            Deposit SOL into the ShadowPay privacy pool. Your funds will be protected using
            Bulletproofs and ElGamal encryption.
          </p>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Amount (SOL)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            disabled={loading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeposit}
            disabled={loading || !amount}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
          >
            {loading ? 'Depositing...' : 'Deposit'}
          </button>
        </div>
      </div>
    </div>
  );
};
