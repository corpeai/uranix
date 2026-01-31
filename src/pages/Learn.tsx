import React, { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Send,
  Wallet,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  AlertCircle,
  Loader,
  History,
  Copy,
  ExternalLink,
} from "lucide-react";

const Learn = () => {
  const { connected, publicKey, signMessage } = useWallet();
  
  const [activeSection, setActiveSection] = useState('basics');

  const sections = [
    {
      id: 'basics',
      title: 'Privacy Basics',
      icon: '📚',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4">Why Privacy Matters on Blockchain</h3>
            <p className="text-zinc-400 mb-4">
              While blockchain transparency is important for verification, complete visibility of all
              transactions creates serious risks for users:
            </p>
            <div className="grid gap-4">
              <div className="p-4 bg-zinc-900 rounded-lg">
                <h4 className="font-semibold text-purple-400 mb-2">🎯 Front-Running</h4>
                <p className="text-sm text-zinc-400">
                  When your transactions are visible in the mempool, sophisticated traders can see your
                  pending trades and front-run them, extracting value at your expense.
                </p>
              </div>
              <div className="p-4 bg-zinc-900 rounded-lg">
                <h4 className="font-semibold text-blue-400 mb-2">💰 Wealth Exposure</h4>
                <p className="text-sm text-zinc-400">
                  Your total holdings become public knowledge, making you a target for scams, phishing,
                  and potentially physical security risks if holdings are substantial.
                </p>
              </div>
              <div className="p-4 bg-zinc-900 rounded-lg">
                <h4 className="font-semibold text-green-400 mb-2">📊 Strategy Leakage</h4>
                <p className="text-sm text-zinc-400">
                  Your trading patterns, DeFi strategies, and portfolio allocations are all visible,
                  allowing others to copy or counter your moves.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/30 rounded-xl">
            <h4 className="font-semibold mb-3">💡 Key Insight</h4>
            <p className="text-sm text-zinc-300">
              Privacy on blockchain isn't about hiding illegal activity - it's about protecting yourself
              from predatory actors who can exploit your visible transactions and holdings.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'surveillance',
      title: 'Surveillance Methods',
      icon: '👁️',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4">How Wallet Surveillance Works</h3>
            <p className="text-zinc-400 mb-6">
              Multiple sophisticated techniques are used to track and analyze blockchain users:
            </p>

            <div className="space-y-6">
              <div className="p-6 bg-zinc-900 rounded-xl">
                <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <span>🔍</span>
                  Transaction Graph Analysis
                </h4>
                <p className="text-sm text-zinc-400 mb-4">
                  Every transaction creates links between addresses. By analyzing these connections,
                  surveillance tools build comprehensive maps of fund flows.
                </p>
                <div className="p-4 bg-zinc-950 rounded-lg">
                  <pre className="text-xs text-zinc-500 overflow-x-auto">
                    {`Wallet A --> Wallet B --> Wallet C
                    ↓
                 Exchange
                    ↓
                [Identity Revealed]`}
                  </pre>
                </div>
              </div>

              <div className="p-6 bg-zinc-900 rounded-xl">
                <h4 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                  <span>🔗</span>
                  Address Clustering
                </h4>
                <p className="text-sm text-zinc-400 mb-4">
                  Heuristics link multiple addresses to the same owner:
                </p>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>
                      <strong className="text-zinc-300">Common Input Ownership:</strong> Multiple inputs in
                      same transaction likely owned by same person
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>
                      <strong className="text-zinc-300">Change Address Detection:</strong> Identifying
                      change outputs to link addresses
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>
                      <strong className="text-zinc-300">Timing Analysis:</strong> Correlated transaction
                      timing suggests common ownership
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-zinc-900 rounded-xl">
                <h4 className="font-semibold text-orange-400 mb-3 flex items-center gap-2">
                  <span>📈</span>
                  Machine Learning & Pattern Recognition
                </h4>
                <p className="text-sm text-zinc-400 mb-4">
                  Advanced algorithms detect patterns in your on-chain behavior:
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-zinc-950 rounded">
                    <strong className="text-zinc-300">Trading Patterns:</strong>
                    <p className="text-zinc-500 text-xs mt-1">
                      Entry/exit timing, position sizing, preferred DEXs
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded">
                    <strong className="text-zinc-300">Behavioral Fingerprints:</strong>
                    <p className="text-zinc-500 text-xs mt-1">
                      Gas price preferences, transaction batching habits
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'technology',
      title: 'Privacy Technology',
      icon: '🔐',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4">How Shieldlane Protects You</h3>
            <p className="text-zinc-400 mb-6">
              Shieldlane uses multiple cutting-edge cryptographic techniques to preserve your privacy:
            </p>

            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/30 rounded-xl">
                <h4 className="font-semibold text-purple-400 mb-3 text-lg flex items-center gap-2">
                  <span>🔮</span>
                  ZK-SNARKs (Privacy Cash)
                </h4>
                <p className="text-sm text-zinc-400 mb-4">
                  Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge allow you to prove you
                  have the right to withdraw funds without revealing which deposit is yours.
                </p>
                <div className="p-4 bg-zinc-900 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-500 mt-1">✓</span>
                    <div>
                      <strong className="text-sm text-zinc-300">Deposit:</strong>
                      <p className="text-xs text-zinc-500 mt-1">
                        Your deposit generates a commitment added to a Merkle tree. Nobody can link this
                        to your identity.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-500 mt-1">✓</span>
                    <div>
                      <strong className="text-sm text-zinc-300">Withdraw:</strong>
                      <p className="text-xs text-zinc-500 mt-1">
                        You prove knowledge of a commitment in the tree without revealing which one,
                        breaking the link to your deposit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/30 rounded-xl">
                <h4 className="font-semibold text-blue-400 mb-3 text-lg flex items-center gap-2">
                  <span>🎯</span>
                  Bulletproofs (ShadowWire)
                </h4>
                <p className="text-sm text-zinc-400 mb-4">
                  Short non-interactive zero-knowledge proofs that prove a value is in a certain range
                  without revealing the value itself.
                </p>
                <div className="p-4 bg-zinc-900 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 mt-1">✓</span>
                    <div>
                      <strong className="text-sm text-zinc-300">Amount Hiding:</strong>
                      <p className="text-xs text-zinc-500 mt-1">
                        Transaction amounts are encrypted with ElGamal encryption on BN254 curve
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 mt-1">✓</span>
                    <div>
                      <strong className="text-sm text-zinc-300">Range Proof:</strong>
                      <p className="text-xs text-zinc-500 mt-1">
                        Bulletproofs prove the encrypted amount is positive and doesn't exceed your
                        balance
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-zinc-900 rounded-xl">
                <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <span>🔒</span>
                  Pedersen Commitments
                </h4>
                <p className="text-sm text-zinc-400">
                  Cryptographic commitments that hide values while allowing mathematical operations. Used
                  to commit to amounts without revealing them, with homomorphic properties that enable
                  privacy-preserving arithmetic.
                </p>
              </div>

              <div className="p-6 bg-zinc-900 rounded-xl">
                <h4 className="font-semibold text-orange-400 mb-3 flex items-center gap-2">
                  <span>🔐</span>
                  ElGamal Encryption
                </h4>
                <p className="text-sm text-zinc-400">
                  Public-key encryption scheme used on the BN254 elliptic curve to encrypt transaction
                  amounts. Only the recipient can decrypt, while the network can still verify validity
                  through zero-knowledge proofs.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20 border border-purple-500/30 rounded-xl">
            <h4 className="font-semibold mb-3">🎓 The Result</h4>
            <p className="text-sm text-zinc-300">
              By combining these technologies, Shieldlane provides military-grade privacy while
              maintaining the verifiability and trustlessness that makes blockchain valuable. Everything
              is verified on-chain - no centralized party required.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: '✨',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4">Privacy Best Practices</h3>

            <div className="space-y-6">
              <div className="p-6 bg-zinc-900 rounded-xl">
                <h4 className="font-semibold text-purple-400 mb-4">For High-Value Wallets (Whales)</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-500 mt-1">1.</span>
                    <div>
                      <strong className="text-sm text-zinc-300">Separate Public and Private Wallets</strong>
                      <p className="text-xs text-zinc-500 mt-1">
                        Use one wallet for public interactions, another for private holdings. Never link
                        them on-chain.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-500 mt-1">2.</span>
                    <div>
                      <strong className="text-sm text-zinc-300">
                        Shield Before Large Transactions
                      </strong>
                      <p className="text-xs text-zinc-500 mt-1">
                        Deposit to Privacy Cash before making significant moves. Break the link between
                        your source wallet and the transaction.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-500 mt-1">3.</span>
                    <div>
                      <strong className="text-sm text-zinc-300">Use Stealth Mode Regularly</strong>
                      <p className="text-xs text-zinc-500 mt-1">
                        Make privacy the default, not the exception. Regular use of privacy features
                        creates a larger anonymity set.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-500 mt-1">4.</span>
                    <div>
                      <strong className="text-sm text-zinc-300">Wait Before Withdrawing</strong>
                      <p className="text-xs text-zinc-500 mt-1">
                        Don't withdraw immediately after depositing. Wait for more deposits from others to
                        increase your anonymity set.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-zinc-900 rounded-xl">
                <h4 className="font-semibold text-blue-400 mb-4">For DAOs and Organizations</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 mt-1">1.</span>
                    <div>
                      <strong className="text-sm text-zinc-300">Protect Treasury Operations</strong>
                      <p className="text-xs text-zinc-500 mt-1">
                        Use Shieldlane for treasury management to prevent front-running and strategic
                        position exposure.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 mt-1">2.</span>
                    <div>
                      <strong className="text-sm text-zinc-300">Private Payroll</strong>
                      <p className="text-xs text-zinc-500 mt-1">
                        Pay contributors through private channels to protect their financial privacy.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 mt-1">3.</span>
                    <div>
                      <strong className="text-sm text-zinc-300">Strategic Acquisitions</strong>
                      <p className="text-xs text-zinc-500 mt-1">
                        Hide token acquisition strategies to prevent price manipulation by MEV bots.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-900/20 to-transparent border border-green-500/30 rounded-xl">
                <h4 className="font-semibold text-green-400 mb-3">Remember</h4>
                <p className="text-sm text-zinc-300">
                  Privacy is not about hiding illegal activity - it's about protecting yourself from
                  surveillance, exploitation, and security threats that come with visible wealth and
                  transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const activeContent = sections.find((s) => s.id === activeSection);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <span>📚</span>
              Learn About Privacy
            </h1>
            <p className="text-zinc-400">
              Understanding wallet surveillance and how to protect yourself.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                        : 'bg-zinc-900 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{section.icon}</span>
                      <span className="font-medium">{section.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-xl">
                {activeContent?.content}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
export default Learn;
