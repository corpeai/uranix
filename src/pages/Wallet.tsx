import React, { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Wallet,
  Copy,
  ExternalLink,
  RefreshCw,
  Download,
  Upload,
  Shield,
  Settings,
  Clock,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  QrCode,
  Send,
  ArrowDownToLine,
  ArrowUpFromLine,
  Info,
  Loader,
} from "lucide-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getWalletBalance,
  getWalletTransactions,
  getTokenBalances,
  getWalletStats,
  formatAddress,
  formatTimestamp,
  getTransactionType,
} from "../utils/solanaService";
import {
  getShadowWireBalance,
  depositToShadowWire,
  withdrawFromShadowWire,
  registerAsRecipient,
} from "../utils/shadowwireService";
import { API_CONFIG } from "../utils/apiConfig";

const WalletManagement = () => {
  const { connected, publicKey, disconnect, wallet } = useWallet();
  const { connection } = useConnection();

  // State
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [shadowBalance, setShadowBalance] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  // ShadowWire state
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [shadowMode, setShadowMode] = useState("deposit"); // 'deposit' or 'withdraw'
  const [shadowLoading, setShadowLoading] = useState(false);
  const [shadowError, setShadowError] = useState("");
  const [shadowSuccess, setShadowSuccess] = useState("");
  const [isRecipient, setIsRecipient] = useState(false);

  // Load wallet data
  useEffect(() => {
    if (connected && publicKey) {
      loadWalletData();
    }
  }, [connected, publicKey, connection]);

  const loadWalletData = async () => {
    if (!publicKey || !connection) return;

    setLoading(true);
    try {
      const address = publicKey.toBase58();

      // Load all data in parallel
      const [balanceData, tokensData, txData, statsData] = await Promise.all([
        getWalletBalance(address, connection),
        getTokenBalances(address, connection),
        getWalletTransactions(address, connection, 20),
        getWalletStats(address, connection),
      ]);

      setBalance(balanceData);
      setTokens(tokensData);
      setTransactions(txData);
      setStats(statsData);

      // Try to load ShadowWire balance
      try {
        const shadowBal = await getShadowWireBalance(address, connection);
        setShadowBalance(shadowBal);
        // If we got balance, assume registered
        setIsRecipient(true);
      } catch (err) {
        console.log("ShadowWire balance not available");
        setShadowBalance(null);
        setIsRecipient(false);
      }
    } catch (error) {
      console.error("Error loading wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAsRecipient = async () => {
    if (!publicKey || !connection) return;

    setShadowLoading(true);
    setShadowError("");
    setShadowSuccess("");

    try {
      await registerAsRecipient(publicKey.toBase58(), connection, wallet);
      setIsRecipient(true);
      setShadowSuccess("Successfully registered as ShadowWire recipient!");
      await loadWalletData();
    } catch (error) {
      setShadowError(error.message || "Failed to register as recipient");
    } finally {
      setShadowLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!publicKey || !connection) return;

    setShadowLoading(true);
    setShadowError("");
    setShadowSuccess("");

    try {
      const amount = parseFloat(depositAmount);

      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      if (amount > balance - 0.01) {
        throw new Error("Insufficient balance (leave 0.01 SOL for gas)");
      }

      await depositToShadowWire(
        publicKey.toBase58(),
        amount,
        connection,
        wallet
      );

      setShadowSuccess(`Successfully deposited ${amount} SOL to ShadowWire!`);
      setDepositAmount("");
      await loadWalletData();
    } catch (error) {
      setShadowError(error.message || "Deposit failed");
    } finally {
      setShadowLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!publicKey || !connection) return;

    setShadowLoading(true);
    setShadowError("");
    setShadowSuccess("");

    try {
      const amount = parseFloat(withdrawAmount);

      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      if (shadowBalance && amount > shadowBalance.available) {
        throw new Error("Insufficient ShadowWire balance");
      }

      await withdrawFromShadowWire(
        publicKey.toBase58(),
        amount,
        connection,
        wallet
      );

      setShadowSuccess(`Successfully withdrew ${amount} SOL from ShadowWire!`);
      setWithdrawAmount("");
      await loadWalletData();
    } catch (error) {
      setShadowError(error.message || "Withdraw failed");
    } finally {
      setShadowLoading(false);
    }
  };

  const handleMaxDeposit = () => {
    const maxDeposit = Math.max(0, balance - 0.01);
    setDepositAmount(maxDeposit.toFixed(4));
  };

  const handleMaxWithdraw = () => {
    if (shadowBalance) {
      setWithdrawAmount(shadowBalance.available.toFixed(4));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getExplorerUrl = (address) => {
    const network = API_CONFIG.network === "mainnet" ? "" : "?cluster=devnet";
    return `https://solscan.io/account/${address}${network}`;
  };

  const getTxExplorerUrl = (signature) => {
    const network = API_CONFIG.network === "mainnet" ? "" : "?cluster=devnet";
    return `https://solscan.io/tx/${signature}${network}`;
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const exportWalletData = () => {
    const data = {
      address: publicKey?.toBase58(),
      balance,
      tokens,
      stats,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wallet-${publicKey
      ?.toBase58()
      .slice(0, 8)}-${Date.now()}.json`;
    a.click();
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center mx-auto">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Wallet Management
            </h2>
            <p className="text-gray-400">
              Connect your wallet to view and manage your assets
            </p>
          </div>
          <WalletMultiButton className="!bg-gradient-to-r !from-white !to-gray-100 !text-black !rounded-xl !h-12 !font-semibold !px-8" />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", name: "Overview", icon: Activity },
    { id: "shadowwire", name: "ShadowWire", icon: Shield },
    { id: "tokens", name: "Tokens", icon: TrendingUp },
    { id: "transactions", name: "Transactions", icon: Clock },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-6 w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-row w-full items-start justify-between gap-4">
        <div className="flex-3">
          <h1 className="text-lg sm:text-md md:text-lg font-bold text-white">
            Wallet Management
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">
            Manage your Solana wallet and assets
          </p>
        </div>
        <button
          onClick={loadWalletData}
          disabled={loading}
          className="flex-1 p-2.5 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          <RefreshCw
            className={`w-5 h-5 text-white ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Wallet Info Card */}
      <div className="w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white to-gray-100 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1 truncate">
                {wallet?.adapter?.name || "Connected Wallet"}
              </h2>
              <div className="flex items-center space-x-2">
                <code className="text-xs sm:text-sm text-gray-400 font-mono">
                  {formatAddress(publicKey?.toBase58(), 6)}
                </code>
                <button
                  onClick={() => copyToClipboard(publicKey?.toBase58())}
                  className="p-1 rounded hover:bg-white/10 transition-all flex-shrink-0"
                  title="Copy address"
                >
                  {copied ? (
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                  )}
                </button>
                <a
                  href={getExplorerUrl(publicKey?.toBase58())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded hover:bg-white/10 transition-all flex-shrink-0"
                  title="View on explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                </a>
              </div>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-medium transition-all text-sm sm:text-base"
          >
            Disconnect
          </button>
        </div>

        {/* Balance Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-400">SOL Balance</p>
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {balance.toFixed(4)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Solana</p>
          </div>

          {shadowBalance && (
            <>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm text-gray-400">Available</p>
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {shadowBalance.available.toFixed(4)}
                </p>
                <p className="text-xs text-gray-500 mt-1">ShadowWire</p>
              </div>

              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm text-gray-400">Locked</p>
                  <Shield className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-400">
                  {shadowBalance.locked.toFixed(4)}
                </p>
                <p className="text-xs text-gray-500 mt-1">ShadowWire</p>
              </div>
            </>
          )}

          {!shadowBalance && stats && (
            <>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm text-gray-400">
                    Transactions
                  </p>
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {stats.totalTransactions}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total</p>
              </div>

              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm text-gray-400">Wallet Age</p>
                  <Clock className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {stats.ageInDays}
                </p>
                <p className="text-xs text-gray-500 mt-1">Days</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 sm:space-x-2 border-b border-white/10 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm sm:text-base">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab - (keeping existing code) */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <a
                href="/transfer"
                className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
              >
                <Send className="w-6 h-6 sm:w-8 sm:h-8 text-white mb-2 sm:mb-3" />
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                  Send Assets
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  Transfer SOL or tokens to another wallet
                </p>
              </a>

              <a
                href="/receive-payment"
                className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
              >
                <ArrowDownToLine className="w-6 h-6 sm:w-8 sm:h-8 text-white mb-2 sm:mb-3" />
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                  Receive
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  Get your wallet address or QR code
                </p>
              </a>

              <button
                onClick={exportWalletData}
                className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group text-left w-full sm:col-span-2 lg:col-span-1"
              >
                <Download className="w-6 h-6 sm:w-8 sm:h-8 text-white mb-2 sm:mb-3" />
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                  Export Data
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  Download wallet information as JSON
                </p>
              </button>
            </div>

            {/* Wallet Stats */}
            {stats && (
              <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                  Wallet Statistics
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">
                      Total Balance
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-white">
                      {balance.toFixed(4)} SOL
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">
                      Transactions
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-white">
                      {stats.totalTransactions}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">
                      Token Holdings
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-white">
                      {tokens.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">
                      Wallet Age
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-white">
                      {stats.ageInDays} days
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NEW: ShadowWire Tab */}
        {activeTab === "shadowwire" && (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-400">
                  <p className="font-semibold mb-1">How ShadowWire Works</p>
                  <p className="text-blue-400/80">
                    Deposit SOL into the privacy pool to make private transfers.
                    Withdraw back to your wallet when done.
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Check */}
            {!isRecipient && (
              <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-start space-x-4">
                  <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-orange-400 mb-2">
                      Registration Required
                    </h3>
                    <p className="text-sm text-orange-400/80 mb-4">
                      You need to register your wallet as a ShadowWire recipient
                      before depositing or receiving private transfers.
                    </p>
                    <button
                      onClick={handleRegisterAsRecipient}
                      disabled={shadowLoading}
                      className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:shadow-glow transition-all disabled:opacity-50 flex items-center space-x-2"
                    >
                      {shadowLoading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Registering...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          <span>Register as Recipient</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Wallet Balance</p>
                  <ArrowUpFromLine className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {balance.toFixed(4)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Regular SOL</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">ShadowWire Balance</p>
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {shadowBalance
                    ? shadowBalance.available.toFixed(4)
                    : "0.0000"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Available (
                  {shadowBalance ? shadowBalance.locked.toFixed(4) : "0.0000"}{" "}
                  locked)
                </p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center space-x-2 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setShadowMode("deposit")}
                disabled={!isRecipient}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  shadowMode === "deposit"
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white disabled:opacity-50"
                }`}
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Deposit</span>
              </button>

              <button
                onClick={() => setShadowMode("withdraw")}
                disabled={!isRecipient}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  shadowMode === "withdraw"
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white disabled:opacity-50"
                }`}
              >
                <ArrowUpFromLine className="w-4 h-4" />
                <span>Withdraw</span>
              </button>
            </div>

            {/* Amount Input */}
            {isRecipient && (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-400">
                      Amount to{" "}
                      {shadowMode === "deposit" ? "Deposit" : "Withdraw"}
                    </label>
                    <button
                      onClick={
                        shadowMode === "deposit"
                          ? handleMaxDeposit
                          : handleMaxWithdraw
                      }
                      className="text-sm text-white hover:text-gray-300 transition-all"
                    >
                      MAX
                    </button>
                  </div>

                  <div className="flex-1 w-[80%]">
                    <input
                      type="number"
                      value={
                        shadowMode === "deposit"
                          ? depositAmount
                          : withdrawAmount
                      }
                      onChange={(e) =>
                        shadowMode === "deposit"
                          ? setDepositAmount(e.target.value)
                          : setWithdrawAmount(e.target.value)
                      }
                      placeholder="0.00"
                      step="0.0001"
                      min="0"
                      className="w-full px-4 py-3 pr-16 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all text-lg font-semibold"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                      SOL
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {shadowMode === "deposit"
                      ? `Available: ${(balance - 0.01).toFixed(
                          4
                        )} SOL (leaving 0.01 for gas)`
                      : `Available: ${
                          shadowBalance
                            ? shadowBalance.available.toFixed(4)
                            : "0.0000"
                        } SOL`}
                  </p>
                </div>

                {/* Info based on mode */}
                {shadowMode === "deposit" ? (
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-xs text-purple-400">
                      ℹ️ Depositing moves SOL from your wallet into the
                      ShadowWire privacy pool. You'll then be able to make
                      private transfers.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-orange-400">
                      ℹ️ Withdrawing moves SOL from ShadowWire back to your
                      regular wallet. Gas fees will be deducted from the
                      withdrawn amount.
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {shadowError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{shadowError}</p>
                  </div>
                )}

                {/* Success Message */}
                {shadowSuccess && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{shadowSuccess}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={
                    shadowMode === "deposit" ? handleDeposit : handleWithdraw
                  }
                  disabled={
                    shadowLoading ||
                    (shadowMode === "deposit" &&
                      (!depositAmount || parseFloat(depositAmount) <= 0)) ||
                    (shadowMode === "withdraw" &&
                      (!withdrawAmount || parseFloat(withdrawAmount) <= 0))
                  }
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-white to-gray-100 text-black font-bold hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {shadowLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : shadowMode === "deposit" ? (
                    <>
                      <ArrowDownToLine className="w-5 h-5" />
                      <span>Deposit to ShadowWire</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpFromLine className="w-5 h-5" />
                      <span>Withdraw to Wallet</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Flow Diagram */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm font-semibold text-white mb-3">
                Privacy Flow:
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
                    1
                  </div>
                  <p>Register</p>
                </div>
                <div className="flex-1 h-px bg-white/10 mx-2" />
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
                    2
                  </div>
                  <p>Deposit</p>
                </div>
                <div className="flex-1 h-px bg-white/10 mx-2" />
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
                    3
                  </div>
                  <p>Transfer</p>
                </div>
                <div className="flex-1 h-px bg-white/10 mx-2" />
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
                    4
                  </div>
                  <p>Withdraw</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tokens, Transactions, Settings Tabs remain the same... */}
        {/* (I'll include them for completeness but they're unchanged) */}

        {/* Tokens Tab */}
        {activeTab === "tokens" && (
          <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
              Token Holdings
            </h3>

            {tokens.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {tokens.map((token, index) => (
                  <div
                    key={index}
                    className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="font-semibold text-white text-sm sm:text-base truncate">
                          {token.symbol || "Unknown Token"}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-400 font-mono truncate">
                          {formatAddress(token.mint, 4)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base sm:text-lg font-bold text-white">
                          {token.balance.toFixed(token.decimals > 6 ? 4 : 2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {token.decimals} decimals
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm sm:text-base">
                  No tokens found
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Your SPL tokens will appear here
                </p>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
              Recent Transactions
            </h3>

            {transactions.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {transactions.map((tx, index) => (
                  <div
                    key={index}
                    className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 sm:py-1 rounded-md text-xs font-semibold ${
                              getTransactionType(tx) === "Receive"
                                ? "bg-green-500/20 text-green-400"
                                : getTransactionType(tx) === "Send"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}
                          >
                            {getTransactionType(tx)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(tx.timestamp)}
                          </span>
                        </div>
                        <code className="text-xs sm:text-sm text-gray-400 font-mono break-all">
                          {formatAddress(
                            tx.signature,
                            window.innerWidth < 640 ? 6 : 8
                          )}
                        </code>
                      </div>

                      <a
                        href={getTxExplorerUrl(tx.signature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all flex-shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm sm:text-base">
                  No transactions found
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Your transaction history will appear here
                </p>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Network Info */}
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                Network Settings
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-3">
                    <p className="font-medium text-white text-sm sm:text-base">
                      + Current Network
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">
                      Connected to {API_CONFIG.network}
                    </p>
                  </div>
                  <span
                    className={`flex-1 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                      API_CONFIG.network === "mainnet"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-orange-500/20 text-orange-400"
                    }`}
                  >
                    {API_CONFIG.network.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white text-sm sm:text-base">
                      RPC Endpoint
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">
                      Alchemy Solana
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                Security
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white text-sm sm:text-base">
                      ShadowWire Privacy
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">
                      Enhanced transaction privacy
                    </p>
                  </div>
                  {shadowBalance ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white text-sm sm:text-base">
                      Wallet Adapter
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">
                      {wallet?.adapter?.name || "Connected"}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                Actions
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={exportWalletData}
                  className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-medium text-white text-sm sm:text-base">
                        Export Data
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Download wallet information
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={loadWalletData}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <RefreshCw
                      className={`w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0 ${
                        loading ? "animate-spin" : ""
                      }`}
                    />
                    <div className="text-left">
                      <p className="font-medium text-white text-sm sm:text-base">
                        Refresh Data
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        Update wallet information
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-medium text-red-400 text-sm sm:text-base">
                        Disconnect Wallet
                      </p>
                      <p className="text-xs sm:text-sm text-red-400/70">
                        Sign out of your wallet
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletManagement;
