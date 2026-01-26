import React from "react";
import { Link } from "react-router-dom";
import { Wallet, Send, ArrowDownToLine, Shield } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";

const Home = () => {
  const { connected } = useWallet();

  const features = [
    {
      icon: Wallet,
      title: "Secure Wallet",
      description:
        "Connect your Solana wallet securely with multiple wallet support",
    },
    {
      icon: Send,
      title: "Fast Transfers",
      description: "Send and receive SOL and SPL tokens instantly",
    },
    {
      icon: ArrowDownToLine,
      title: "Easy Payments",
      description: "Receive payments with QR codes and payment links",
    },
    {
      icon: Shield,
      title: "Protected",
      description: "Your transactions are secured by Solana blockchain",
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-5xl md:text-7xl font-bold">
          <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Welcome to
          </span>
          <br />
          <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
            ShadowWire
          </span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Your gateway to seamless Solana transactions. Send, receive, and
          manage your crypto with ease.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {connected ? (
            <Link
              to="/dashboard"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all"
            >
              Go to Dashboard
            </Link>
          ) : (
            <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all">
              Connect Wallet to Start
            </button>
          )}

          <Link
            to="/receive"
            className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
          >
            Learn More
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-green-500/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-400 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10">
          <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mb-2">
            10K+
          </div>
          <div className="text-gray-400">Active Users</div>
        </div>

        <div className="text-center p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10">
          <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mb-2">
            $50M+
          </div>
          <div className="text-gray-400">Total Volume</div>
        </div>

        <div className="text-center p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10">
          <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mb-2">
            100K+
          </div>
          <div className="text-gray-400">Transactions</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
