'use client';

import { FC, useState, useEffect, useRef } from 'react';
import { usePrivateBalance } from '@/hooks/usePrivateBalance';
import { formatCurrency } from '@/lib/utils';
import { DepositModal } from './DepositModal';
import { PrivacyCashDepositModal } from './PrivacyCashDepositModal';
import { PrivacyCashWithdrawModal } from './PrivacyCashWithdrawModal';

export const PrivateBalance: FC = () => {
  const { balance, loading, refresh } = usePrivateBalance();
  const [showActualBalance, setShowActualBalance] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showPrivacyCashModal, setShowPrivacyCashModal] = useState(false);
  const [showPrivacyCashWithdrawModal, setShowPrivacyCashWithdrawModal] = useState(false);
  const [showDepositDropdown, setShowDepositDropdown] = useState(false);
  const [showWithdrawDropdown, setShowWithdrawDropdown] = useState(false);
  const depositDropdownRef = useRef<HTMLDivElement>(null);
  const withdrawDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (depositDropdownRef.current && !depositDropdownRef.current.contains(event.target as Node)) {
        setShowDepositDropdown(false);
      }
      if (withdrawDropdownRef.current && !withdrawDropdownRef.current.contains(event.target as Node)) {
        setShowWithdrawDropdown(false);
      }
    };

    if (showDepositDropdown || showWithdrawDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDepositDropdown, showWithdrawDropdown]);

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Balance</h2>
        <button
          onClick={() => setShowActualBalance(!showActualBalance)}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <span>{showActualBalance ? '👁️ Hiding Actual' : '🔍 Show Actual'}</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* What Trackers See */}
        <div className="p-6 bg-gradient-to-br from-red-900/20 to-transparent border border-red-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-lg font-semibold text-red-400">What Trackers See</h3>
          </div>

          {loading ? (
            <div className="h-16 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Public Balance</p>
                <p className="text-3xl font-bold text-red-400">
                  {formatCurrency(balance.publicBalance)}
                </p>
              </div>

              <div className="pt-3 border-t border-red-500/20">
                <p className="text-xs text-zinc-500">
                  This is what appears on block explorers and what surveillance tools can track.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded">
                  Fully Exposed
                </span>
                <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded">
                  Trackable
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Your Actual Balance */}
        <div className="p-6 bg-gradient-to-br from-green-900/20 to-transparent border border-green-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🛡️</span>
            <h3 className="text-lg font-semibold text-green-400">Your Actual Balance</h3>
          </div>

          {loading ? (
            <div className="h-16 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Total Holdings</p>
                {showActualBalance ? (
                  <p className="text-3xl font-bold text-green-400">
                    {formatCurrency(balance.totalBalance)}
                  </p>
                ) : (
                  <p className="text-3xl font-bold text-zinc-500">••••••</p>
                )}
              </div>

              {showActualBalance && (
                <>
                  <div className="pt-3 border-t border-green-500/20 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Public</span>
                      <span className="text-zinc-300">{formatCurrency(balance.publicBalance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Privacy Cash</span>
                      <span className="text-green-400">{formatCurrency(balance.privacyCashBalance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">ShadowPay</span>
                      <span className="text-blue-400">{formatCurrency(balance.shadowPayBalance)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded">
                      Protected
                    </span>
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded">
                      Private
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Privacy Status Bar */}
      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Privacy Coverage</span>
          <span className="text-sm font-medium">
            {balance.totalBalance > 0
              ? Math.round((balance.privateBalance / balance.totalBalance) * 100)
              : 0}
            % Protected
          </span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{
              width: `${balance.totalBalance > 0 ? (balance.privateBalance / balance.totalBalance) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Deposit Dropdown Button */}
        <div className="relative" ref={depositDropdownRef}>
          <button
            onClick={() => setShowDepositDropdown(!showDepositDropdown)}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            <span>💰 Deposit</span>
            <svg
              className={`w-4 h-4 transition-transform ${showDepositDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Deposit Dropdown Menu */}
          {showDepositDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-10">
              <button
                onClick={() => {
                  setShowPrivacyCashModal(true);
                  setShowDepositDropdown(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-zinc-700 transition-colors border-b border-zinc-700"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔐</span>
                  <div>
                    <div className="font-medium">Privacy Cash</div>
                    <div className="text-xs text-zinc-400">Server-side encryption (Recommended)</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowDepositModal(true);
                  setShowDepositDropdown(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🌑</span>
                  <div>
                    <div className="font-medium">ShadowPay</div>
                    <div className="text-xs text-zinc-400">Mainnet only (Devnet unavailable)</div>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Withdraw Dropdown Button */}
        <div className="relative" ref={withdrawDropdownRef}>
          <button
            onClick={() => setShowWithdrawDropdown(!showWithdrawDropdown)}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            <span>💸 Withdraw</span>
            <svg
              className={`w-4 h-4 transition-transform ${showWithdrawDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Withdraw Dropdown Menu */}
          {showWithdrawDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-10">
              <button
                onClick={() => {
                  setShowPrivacyCashWithdrawModal(true);
                  setShowWithdrawDropdown(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-zinc-700 transition-colors"
                disabled={balance.privacyCashBalance === 0}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔓</span>
                  <div className="flex-1">
                    <div className="font-medium flex items-center justify-between">
                      <span>Privacy Cash</span>
                      {balance.privacyCashBalance > 0 && (
                        <span className="text-xs text-green-400">
                          {formatCurrency(balance.privacyCashBalance)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {balance.privacyCashBalance > 0
                        ? 'Server-side withdrawal'
                        : 'No balance available'}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={refresh}
          disabled={loading}
          className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Balances'}
        </button>
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={refresh}
      />
      <PrivacyCashDepositModal
        isOpen={showPrivacyCashModal}
        onClose={() => setShowPrivacyCashModal(false)}
        onSuccess={refresh}
      />
      <PrivacyCashWithdrawModal
        isOpen={showPrivacyCashWithdrawModal}
        onClose={() => setShowPrivacyCashWithdrawModal(false)}
        onSuccess={refresh}
        currentBalance={balance.privacyCashBalance}
      />
    </div>
  );
};
