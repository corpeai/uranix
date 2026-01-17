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
import {
  getShadowWireBalance,
  makePrivateTransfer,
  getTransferHistory,
  validateAddress,
  getSupportedTokens,
} from "../utils/shadowwireService";
import { API_CONFIG } from "../utils/apiConfig";

const Transfer = () => {
  const { connected, publicKey, wallet } = useWallet();
  const { connection } = useConnection(); // Use connection from wallet adapter context

  // Balance state
  const [balance, setBalance] = useState({ available: 0, locked: 0, total: 0 });
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Safe balance getter with defaults
  const getBalance = (key) => {
    return balance && typeof balance[key] === "number" ? balance[key] : 0;
  };

  // Form state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [transferType, setTransferType] = useState("internal");
  const [memo, setMemo] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [txSignature, setTxSignature] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(true);

  const tokens = getSupportedTokens();
  const selectedTokenData = tokens.find((t) => t.symbol === selectedToken);

  // Load balance using wallet adapter connection
  useEffect(() => {
    if (connected && publicKey && connection) {
      loadBalance();
      loadHistory();
    }
  }, [connected, publicKey, connection]);

  const loadBalance = async () => {
    if (!publicKey || !connection) return;

    setLoadingBalance(true);
    try {
      // Pass connection from wallet adapter
      const bal = await getShadowWireBalance(publicKey.toBase58(), connection);
      setBalance({
        available: bal?.available || 0,
        locked: bal?.locked || 0,
        total: bal?.total || 0,
      });
    } catch (err) {
      console.error("Error loading balance:", err);
      setBalance({ available: 0, locked: 0, total: 0 });
    } finally {
      setLoadingBalance(false);
    }
  };

  const loadHistory = async () => {
    if (!publicKey || !connection) return;

    try {
      // Pass connection from wallet adapter
      const hist = await getTransferHistory(
        publicKey.toBase58(),
        connection,
        10
      );
      setHistory(hist);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  const handleMaxClick = () => {
    setAmount(getBalance("available").toString());
  };

  const handleTransfer = async () => {
    // Validation
    if (!recipient.trim()) {
      setError("Please enter recipient address");
      return;
    }

    if (!validateAddress(recipient)) {
      setError("Invalid recipient address");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > getBalance("available")) {
      setError("Insufficient balance");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Pass connection and wallet from wallet adapter
      const result = await makePrivateTransfer(
        {
          sender: publicKey.toBase58(),
          recipient: recipient.trim(),
          amount: parseFloat(amount),
          token: selectedToken,
          type: transferType,
          memo: memo.trim(),
        },
        connection,
        wallet
      );

      setSuccess(true);
      setTxSignature(result.signature);

      // Reset form
      setRecipient("");
      setAmount("");
      setMemo("");

      // Reload balance and history
      setTimeout(() => {
        loadBalance();
        loadHistory();
      }, 2000);
    } catch (err) {
      setError(err.message || "Transfer failed. Please try again.");
      console.error("Transfer error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getExplorerUrl = (signature) => {
    const network = API_CONFIG.network === "mainnet" ? "" : "?cluster=devnet";
    return `https://solscan.io/tx/${signature}${network}`;
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Wallet className="w-16 h-16 text-white mx-auto" />
          <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
          <p className="text-gray-400">Connect your wallet to make transfers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Private Transfer</h1>
        <p className="text-gray-400">
          Send SOL and tokens privately using Solanica Finance Private
        </p>
      </div>

      {/* Balance Card */}
      <div className="p-6 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Available Balance
          </h2>
          <button
            onClick={loadBalance}
            disabled={loadingBalance}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
          >
            <Loader
              className={`w-4 h-4 text-white ${
                loadingBalance ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm text-gray-400 mb-1">Available</p>
            <p className="text-3xl font-bold text-white">
              {getBalance("available").toFixed(4)}
            </p>
            <p className="text-xs text-gray-500 mt-1">SOL</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm text-gray-400 mb-1">Locked</p>
            <p className="text-3xl font-bold text-gray-400">
              {getBalance("locked").toFixed(4)}
            </p>
            <p className="text-xs text-gray-500 mt-1">SOL</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm text-gray-400 mb-1">Total</p>
            <p className="text-3xl font-bold text-white">
              {getBalance("total").toFixed(4)}
            </p>
            <p className="text-xs text-gray-500 mt-1">SOL</p>
          </div>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-6">Send Transfer</h2>

        <div className="space-y-6">
          {/* Transfer Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Transfer Type
            </label>
            <div className="flex items-center space-x-4 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setTransferType("internal")}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  transferType === "internal"
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Private</span>
                <EyeOff className="w-4 h-4" />
              </button>

              <button
                onClick={() => setTransferType("external")}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  transferType === "external"
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Public</span>
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {transferType === "internal" && (
              <p className="mt-2 text-xs text-gray-500 flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Amount stays private • Enhanced privacy</span>
              </p>
            )}
          </div>

          {/* Token Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Token
            </label>
            <div className="grid grid-cols-3 gap-3">
              {tokens.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => setSelectedToken(token.symbol)}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedToken === token.symbol
                      ? "bg-white/10 border-white/30"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <img
                    src={token.icon}
                    alt={token.symbol}
                    className="w-8 h-8 mx-auto mb-2"
                  />
                  <p className="text-sm font-semibold text-white text-center">
                    {token.symbol}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Address */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter Solana wallet address..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all font-mono text-sm"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Amount
            </label>
            <div className=" flex flex-row w-full justify-between items-center gap-8">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.0001"
                min="0"
                className="flex-3 px-4 py-3 pr-20 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all text-lg font-semibold"
              />
              <button
                onClick={handleMaxClick}
                className="flex-1  px-3 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
              >
                MAX
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Available: {getBalance("available").toFixed(4)} {selectedToken}
            </p>
          </div>

          {/* Memo (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Memo (Optional)
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Add a note..."
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 space-y-2">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5" />
                <p className="font-semibold">Transfer Successful!</p>
              </div>
              {txSignature && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-400">Signature:</span>
                  <span className="font-mono">
                    {txSignature.slice(0, 8)}...{txSignature.slice(-8)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(txSignature)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <a
                    href={getExplorerUrl(txSignature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleTransfer}
            disabled={loading || !recipient || !amount}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-white to-gray-100 text-black font-bold text-lg hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send {selectedToken}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5" />
            <span>Recent Transfers</span>
          </h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-gray-400 hover:text-white transition-all"
          >
            {showHistory ? "Hide" : "Show"}
          </button>
        </div>

        {showHistory && (
          <div className="space-y-3">
            {history.length > 0 ? (
              history.map((tx, index) => (
                <div
                  key={tx.signature + index}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-semibold ${
                            tx.isPrivate
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {tx.isPrivate ? (
                            <span className="flex items-center space-x-1">
                              <Shield className="w-3 h-3" />
                              <span>Private</span>
                            </span>
                          ) : (
                            "Public"
                          )}
                        </span>

                        <span className="text-xs text-gray-500">
                          {new Date(tx.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-white font-semibold">
                          {tx.amount} {tx.token}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                        <span className="font-mono text-sm text-gray-400">
                          {tx.to.slice(0, 4)}...{tx.to.slice(-4)}
                        </span>
                      </div>
                    </div>

                    <a
                      href={getExplorerUrl(tx.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No transfer history</p>
                <p className="text-sm text-gray-500 mt-1">
                  Your transfers will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transfer;
