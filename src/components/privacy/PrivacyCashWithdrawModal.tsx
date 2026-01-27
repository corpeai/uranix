'use client';

import { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PrivacyCashBrowserClient } from '@/lib/privacy-cash-browser';
import { connection } from '@/lib/solana';

interface PrivacyCashWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance: number; // Privacy Cash balance in SOL
}

export const PrivacyCashWithdrawModal: FC<PrivacyCashWithdrawModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance,
}) => {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleWithdraw = async () => {
    if (!publicKey) {
      setError('Wallet not connected');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Minimum withdrawal: 0.001 SOL
    if (amountNum < 0.001) {
      setError('Minimum withdrawal is 0.001 SOL');
      return;
    }

    // Check if amount exceeds balance (accounting for fee)
    const estimatedFee = 0.000005; // 5000 lamports
    if (amountNum + estimatedFee > currentBalance) {
      setError(
        `Insufficient balance. You have ${currentBalance.toFixed(4)} SOL but need ${(amountNum + estimatedFee).toFixed(6)} SOL (including ~${estimatedFee.toFixed(6)} SOL fee)`
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('[PrivacyCashWithdraw] Step 1: Creating Privacy Cash client');
      const privacyCash = new PrivacyCashBrowserClient({
        connection,
        wallet: wallet as any,
      });

      const lamports = Math.floor(amountNum * 1e9);
      console.log('[PrivacyCashWithdraw] Amount:', amountNum, 'SOL =', lamports, 'lamports');
      console.log(
        '[PrivacyCashWithdraw] Recipient:',
        recipient || publicKey.toBase58(),
        recipient ? '(custom)' : '(same wallet)'
      );

      console.log('[PrivacyCashWithdraw] Step 2: Requesting wallet signature for authorization');
      console.log('[PrivacyCashWithdraw] Step 3: Calling withdraw API (server-side signing)');

      // Call withdraw - this handles signature request and API call
      const result = await privacyCash.withdraw(
        lamports,
        recipient ? new (await import('@solana/web3.js')).PublicKey(recipient) : undefined
      );

      console.log('[PrivacyCashWithdraw] Withdrawal completed:', result.signature);

      setSuccess(
        `Successfully withdrew ${amountNum} SOL from Privacy Cash! Transaction: ${result.signature}`
      );
      setAmount('');
      setRecipient('');

      // Call onSuccess after a brief delay to show the success message
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('[PrivacyCashWithdraw] Error:', err);
      setError(err.message || 'Failed to withdraw');
    } finally {
      setLoading(false);
    }
  };

  const handleMaxClick = () => {
    // Max is current balance minus estimated fee
    const estimatedFee = 0.000005; // 5000 lamports
    const maxAmount = Math.max(0, currentBalance - estimatedFee);
    setAmount(maxAmount.toFixed(6));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full border border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>🔓</span> Privacy Cash Withdrawal
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
          {/* Balance Info */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-300">Available Balance</span>
              <span className="text-lg font-bold text-blue-400">
                {currentBalance.toFixed(4)} SOL
              </span>
            </div>
            <p className="text-xs text-blue-200/60 mt-1">
              Note: Estimated fee of ~0.000005 SOL will be deducted
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Amount (SOL)</label>
              <button
                onClick={handleMaxClick}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                disabled={loading}
              >
                MAX
              </button>
            </div>
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

          {/* Recipient Input (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Recipient Address{' '}
              <span className="text-zinc-500 font-normal">(optional - defaults to your wallet)</span>
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={publicKey?.toBase58() || 'Your wallet address'}
              disabled={loading}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 font-mono text-sm"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Leave empty to withdraw to your connected wallet
            </p>
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
              onClick={handleWithdraw}
              disabled={loading || !amount}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                'Withdraw'
              )}
            </button>
          </div>

          {/* Privacy Notice */}
          <div className="pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              🔓 Funds will be withdrawn from your encrypted Privacy Cash account. The transaction
              will be signed server-side using your encrypted keypair. You need to approve this
              action with your wallet signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
