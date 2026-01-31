import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet, TrendingUp, Activity, Search, Zap } from "lucide-react";
import {
  getSolanaPrice,
  formatPrice,
  formatChange,
} from "../utils/coingeckoService";
import { getWalletBalance } from "../utils/solanaService";
import TrendingTokens from "../components/TrendingTokens";
import LargeTransactions from "../components/LargeTransactions";
import WalletTracker from "../components/WalletTracker";

const Dashboard = () => {
  const { connected, publicKey } = useWallet();
  const [solPrice, setSolPrice] = useState(null);
  const [myBalance, setMyBalance] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Fetch SOL price
    const fetchSolPrice = async () => {
      const data = await getSolanaPrice();
      setSolPrice(data);
    };
    fetchSolPrice();
    const interval = setInterval(fetchSolPrice, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch user's balance if connected
    const fetchBalance = async () => {
      if (connected && publicKey) {
        const balance = await getWalletBalance(publicKey.toBase58());
        setMyBalance(balance);
      }
    };
    fetchBalance();
  }, [connected, publicKey]);

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "tracker", label: "Wallet Tracker", icon: Search },
    { id: "movements", label: "Large Movements", icon: Activity },
  ];

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Connect Your Wallet
          </h2>
          <p className="text-gray-400 text-sm md:text-base">
            Please connect your wallet to access the advanced dashboard
          </p>
        </div>
      </div>
    );
  }

  const change = solPrice ? formatChange(solPrice.change24h) : null;

  return (
    <div className="space-y-6 md:space-y-8 pb-6">
    

      {/* Stats Overview - Mobile Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* SOL Price - Featured Card */}
        <div className="sm:col-span-2 lg:col-span-1 p-5 md:p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/15 to-white/5 border border-white/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-300 font-medium">SOL Price</p>
            <Zap className="w-5 h-5 text-white" />
          </div>
          {solPrice ? (
            <>
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">
                {formatPrice(solPrice.price)}
              </p>
              <p
                className={`text-sm font-medium ${
                  change?.isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {change?.value} 24h
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="h-10 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
            </div>
          )}
        </div>

        {/* Your Balance */}
        <div className="p-5 md:p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400 font-medium">Your Balance</p>
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white mb-1">
            {myBalance.toFixed(4)}
          </p>
          <p className="text-xs md:text-sm text-gray-500">SOL</p>
        </div>

        {/* Market Cap */}
        <div className="p-5 md:p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400 font-medium">Market Cap</p>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          {solPrice ? (
            <>
              <p className="text-2xl md:text-3xl font-bold text-white mb-1">
                ${(solPrice.marketCap / 1e9).toFixed(2)}B
              </p>
              <p className="text-xs md:text-sm text-gray-500">USD</p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="h-8 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
            </div>
          )}
        </div>

        {/* 24h Volume */}
        <div className="p-5 md:p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400 font-medium">24h Volume</p>
            <Activity className="w-5 h-5 text-orange-400" />
          </div>
          {solPrice ? (
            <>
              <p className="text-2xl md:text-3xl font-bold text-white mb-1">
                ${(solPrice.volume24h / 1e9).toFixed(2)}B
              </p>
              <p className="text-xs md:text-sm text-gray-500">USD</p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="h-8 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation - Mobile Scrollable */}
      <div className="relative">
        <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white/20 text-white border border-white/30"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm md:text-base">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <TrendingTokens />
            <LargeTransactions />
          </div>
        )}

        {activeTab === "tracker" && <WalletTracker />}

        {activeTab === "movements" && <LargeTransactions />}
      </div>
    </div>
  );
};

export default Dashboard;
