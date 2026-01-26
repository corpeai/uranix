import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  QrCode,
  Wallet,
  Copy,
  Check,
  Download,
  Share2,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import {
  getShadowWireBalance,
  getSupportedTokens,
} from "../utils/shadowwireService";
import QRCode from "qrcode";

const PaymentScreen = () => {
  const { connected, publicKey } = useWallet();

  // Form state
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [memo, setMemo] = useState("");
  const [label, setLabel] = useState("");

  // QR Code state
  const [qrCodeData, setQrCodeData] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [showQR, setShowQR] = useState(false);

  // UI state
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState({ available: 0 });
  const qrRef = useRef(null);

  const tokens = getSupportedTokens();

  useEffect(() => {
    if (connected && publicKey) {
      loadBalance();
    }
  }, [connected, publicKey]);

  const loadBalance = async () => {
    if (!publicKey) return;
    try {
      const bal = await getShadowWireBalance(publicKey.toBase58());
      setBalance(bal);
    } catch (err) {
      console.error("Error loading balance:", err);
    }
  };

  const generateQRCode = async () => {
    if (!publicKey) return;

    // Generate Solana Pay URL format
    const params = new URLSearchParams();
    if (amount) params.append("amount", amount);
    if (label) params.append("label", label);
    if (memo) params.append("memo", memo);
    if (selectedToken !== "SOL") params.append("spl-token", selectedToken);

    const solanaPayURL = `solana:${publicKey.toBase58()}${
      params.toString() ? "?" + params.toString() : ""
    }`;

    setQrCodeData(solanaPayURL);

    try {
      const qrImage = await QRCode.toDataURL(solanaPayURL, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeImage(qrImage);
      setShowQR(true);
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  };

  const copyAddress = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPaymentURL = () => {
    navigator.clipboard.writeText(qrCodeData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    if (!qrCodeImage) return;

    const link = document.createElement("a");
    link.download = `payment-qr-${amount || "any"}-${selectedToken}.png`;
    link.href = qrCodeImage;
    link.click();
  };

  const sharePayment = async () => {
    if (!navigator.share || !qrCodeData) return;

    try {
      await navigator.share({
        title: "Payment Request",
        text: `Payment request for ${amount || "any"} ${selectedToken}`,
        url: qrCodeData,
      });
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Wallet className="w-16 h-16 text-white mx-auto" />
          <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
          <p className="text-gray-400">
            Connect your wallet to receive payments
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Receive Payment</h1>
        <p className="text-gray-400">Generate payment request with QR code</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Details Form */}
        <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">Payment Details</h2>

          <div className="space-y-6">
            {/* Your Address */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Your Address
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={publicKey?.toBase58() || ""}
                  readOnly
                  className="flex-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm"
                />
                <button
                  onClick={copyAddress}
                  className=" flex-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
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

            {/* Amount (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Amount (Optional)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Leave empty for any amount"
                  step="0.0001"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all text-lg font-semibold"
                />
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Leave empty to let sender choose amount
              </p>
            </div>

            {/* Label (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Label (Optional)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Invoice #1234"
                maxLength={50}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all"
              />
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
                placeholder="Payment description..."
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generateQRCode}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-white to-gray-100 text-black font-bold text-lg hover:shadow-glow transition-all flex items-center justify-center space-x-2"
            >
              <QrCode className="w-5 h-5" />
              <span>Generate QR Code</span>
            </button>
          </div>
        </div>

        {/* QR Code Display */}
        <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">Payment QR Code</h2>

          {showQR && qrCodeImage ? (
            <div className="space-y-6">
              {/* QR Code Image */}
              <div className="p-6 rounded-2xl bg-white flex items-center justify-center">
                <img
                  ref={qrRef}
                  src={qrCodeImage}
                  alt="Payment QR Code"
                  className="w-full max-w-sm"
                />
              </div>

              {/* Payment Info */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="font-semibold text-white">
                    {amount || "Any amount"} {selectedToken}
                  </span>
                </div>
                {label && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Label:</span>
                    <span className="font-semibold text-white">{label}</span>
                  </div>
                )}
                {memo && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Memo:</span>
                    <span className="font-semibold text-white">{memo}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyPaymentURL}
                  className="py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all flex items-center justify-center space-x-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={downloadQR}
                  className="py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                {navigator.share && (
                  <button
                    onClick={sharePayment}
                    className="col-span-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all flex items-center justify-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Payment Request</span>
                  </button>
                )}
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm">
                <p className="font-medium mb-2">How to use:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Show QR code to sender</li>
                  <li>• They scan with Solana wallet app</li>
                  <li>• Payment completes instantly</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <QrCode className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No QR Code Yet
              </h3>
              <p className="text-gray-400 text-sm">
                Fill in payment details and click "Generate QR Code"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Current Balance */}
      <div className="p-6 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Your Balance</p>
            <p className="text-3xl font-bold text-white">
              {balance.available.toFixed(4)} SOL
            </p>
          </div>
          <button
            onClick={loadBalance}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
