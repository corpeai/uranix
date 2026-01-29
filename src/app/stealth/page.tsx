'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StealthTransfer } from '@/components/privacy/StealthTransfer';

export default function StealthPage() {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl mb-4">👻</div>
            <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
            <p className="text-zinc-400 max-w-md">
              Please connect your Solana wallet to use Stealth Mode transfers.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <span>👻</span>
              Stealth Mode Transfers
            </h1>
            <p className="text-zinc-400">
              Send private transactions with advanced cryptographic protection.
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/30 rounded-xl">
              <h3 className="text-lg font-semibold mb-3 text-purple-400">External Mode</h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">✓</span>
                  <span>Sender identity hidden using Groth16 ZK proofs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">✓</span>
                  <span>Amount and recipient remain visible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">✓</span>
                  <span>Best for withdrawals to exchanges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-1">✓</span>
                  <span>Faster transaction processing</span>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/30 rounded-xl">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Internal Mode</h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Everything hidden - maximum privacy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Amount encrypted with Bulletproofs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Sender and recipient both hidden</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Best for sensitive transactions</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Transfer Component */}
          <StealthTransfer />

          {/* Security Notice */}
          <div className="mt-8 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🔐</span>
              Security & Privacy
            </h3>
            <div className="space-y-3 text-sm text-zinc-400">
              <p>
                <span className="font-semibold text-zinc-300">Zero-Knowledge Proofs:</span> Your transactions
                use ZK-SNARKs and Bulletproofs to prove validity without revealing sensitive information.
              </p>
              <p>
                <span className="font-semibold text-zinc-300">On-Chain Verification:</span> All privacy
                operations are verified on Solana blockchain, ensuring trustless security.
              </p>
              <p>
                <span className="font-semibold text-zinc-300">No Middleman:</span> Your keys, your crypto.
                Shieldlane is a non-custodial wrapper - you always maintain control.
              </p>
              <p className="pt-3 border-t border-zinc-800 text-xs text-zinc-500">
                Note: Shieldlane is currently deployed on Solana devnet for testing purposes. Always verify
                transaction details before confirming.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
