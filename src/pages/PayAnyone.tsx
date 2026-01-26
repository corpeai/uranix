import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Send,
  Wallet,
  Users,
  Clock,
  Star,
  Search,
  Zap,
  Check,
  AlertCircle,
  Loader,
  Plus,
  X,
} from "lucide-react";
import {
  getShadowWireBalance,
  makePrivateTransfer,
  checkRecipientExists,
  getSupportedTokens,
} from "../utils/shadowwireService";

const PayAnyone = () => {
  const { connected, publicKey, signMessage } = useWallet();

  // Form state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("SOL");
  const [quickAmount, setQuickAmount] = useState(null);

  // Contact state
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactAddress, setNewContactAddress] = useState("");

  // Recent payments
  const [recentPayments, setRecentPayments] = useState([]);

  // UI state
  const [balance, setBalance] = useState({ available: 0 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [checkingRecipient, setCheckingRecipient] = useState(false);
  const [recipientExists, setRecipientExists] = useState(null);

  const tokens = getSupportedTokens();
  const quickAmounts = [0.1, 0.5, 1, 5, 10];

  useEffect(() => {
    if (connected && publicKey) {
      loadBalance();
      loadContacts();
      loadRecentPayments();
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (recipient && recipient.length >= 32) {
      checkRecipient();
    } else {
      setRecipientExists(null);
    }
  }, [recipient]);

  const loadBalance = async () => {
    if (!publicKey) return;
    try {
      const bal = await getShadowWireBalance(publicKey.toBase58());
      setBalance(bal);
    } catch (err) {
      console.error("Error loading balance:", err);
    }
  };

  const loadContacts = () => {
    const saved = localStorage.getItem("shadowwire_contacts");
    if (saved) {
      setContacts(JSON.parse(saved));
    }
  };

  const loadRecentPayments = () => {
    const saved = localStorage.getItem("shadowwire_recent_payments");
    if (saved) {
      setRecentPayments(JSON.parse(saved));
    }
  };

  const saveContact = () => {
    if (!newContactName.trim() || !newContactAddress.trim()) return;

    const newContact = {
      id: Date.now(),
      name: newContactName.trim(),
      address: newContactAddress.trim(),
    };

    const updated = [...contacts, newContact];
    setContacts(updated);
    localStorage.setItem("shadowwire_contacts", JSON.stringify(updated));

    setNewContactName("");
    setNewContactAddress("");
    setShowAddContact(false);
  };

  const deleteContact = (id) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    localStorage.setItem("shadowwire_contacts", JSON.stringify(updated));
  };

  const checkRecipient = async () => {
    setCheckingRecipient(true);
    try {
      const exists = await checkRecipientExists(recipient);
      setRecipientExists(exists);
    } catch (err) {
      setRecipientExists(null);
    } finally {
      setCheckingRecipient(false);
    }
  };

  const handleQuickPay = async () => {
    if (!recipient.trim() || !amount) {
      setError("Please enter recipient and amount");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await makePrivateTransfer({
        sender: publicKey.toBase58(),
        recipient: recipient.trim(),
        amount: parseFloat(amount),
        token: selectedToken,
        type: recipientExists ? "internal" : "external",
        wallet: { signMessage },
      });

      setSuccess(true);

      // Save to recent payments
      const payment = {
        recipient: recipient.trim(),
        amount: parseFloat(amount),
        token: selectedToken,
        timestamp: Date.now(),
      };
      const updated = [payment, ...recentPayments.slice(0, 4)];
      setRecentPayments(updated);
      localStorage.setItem(
        "shadowwire_recent_payments",
        JSON.stringify(updated)
      );

      // Reset form
      setRecipient("");
      setAmount("");
      setQuickAmount(null);

      loadBalance();
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
      console.error("Payment error:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectContact = (contact) => {
    setRecipient(contact.address);
    setSearchQuery("");
  };

  const selectRecentPayment = (payment) => {
    setRecipient(payment.recipient);
    setAmount(payment.amount.toString());
    setSelectedToken(payment.token);
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Wallet className="w-16 h-16 text-white mx-auto" />
          <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
          <p className="text-gray-400">Connect your wallet to pay anyone</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Pay Anyone</h1>
        <p className="text-gray-400">
          Quick payments to contacts or any Solana address
        </p>
      </div>

      {/* Balance Card */}
      <div className="p-6 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-white">
              {balance.available.toFixed(4)} {selectedToken}
            </p>
          </div>
          <Wallet className="w-12 h-12 text-white/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Pay Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recipient Selection */}
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">Send To</h2>

            <div className="space-y-4">
              {/* Search Contacts */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts or enter address..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all"
                />
              </div>

              {/* Contact Results */}
              {searchQuery && filteredContacts.length > 0 && (
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => selectContact(contact)}
                      className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">
                            {contact.name}
                          </p>
                          <p className="text-xs font-mono text-gray-400">
                            {contact.address.slice(0, 8)}...
                            {contact.address.slice(-8)}
                          </p>
                        </div>
                        <Users className="w-4 h-4 text-gray-500" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Or Enter Address */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Or Enter Address Manually
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Solana wallet address..."
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all font-mono text-sm"
                  />
                  {checkingRecipient && (
                    <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                  )}
                  {recipientExists !== null && !checkingRecipient && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {recipientExists ? (
                        <div className="flex items-center space-x-1 text-green-400 text-xs">
                          <Check className="w-4 h-4" />
                          <span>Private OK</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-yellow-400 text-xs">
                          <AlertCircle className="w-4 h-4" />
                          <span>Public only</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Amount Selection */}
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">Amount</h2>

            <div className="space-y-4">
              {/* Token Selector */}
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

              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Quick Amount
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setAmount(amt.toString());
                        setQuickAmount(amt);
                      }}
                      className={`py-2 rounded-lg font-medium transition-all ${
                        quickAmount === amt
                          ? "bg-white text-black"
                          : "bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Or Enter Custom Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setQuickAmount(null);
                    }}
                    placeholder="0.00"
                    step="0.0001"
                    min="0"
                    className="w-full px-4 py-3 pr-16 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-all text-lg font-semibold"
                  />
                  <button
                    onClick={() => setAmount(balance.available.toString())}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
                  >
                    MAX
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Available: {balance.available.toFixed(4)} {selectedToken}
                </p>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 flex items-center space-x-2">
              <Check className="w-5 h-5" />
              <p className="font-semibold">Payment sent successfully!</p>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleQuickPay}
            disabled={loading || !recipient || !amount}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-white to-gray-100 text-black font-bold text-lg hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>
                  Send {amount || "0"} {selectedToken}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Saved Contacts */}
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <span>Contacts</span>
              </h3>
              <button
                onClick={() => setShowAddContact(!showAddContact)}
                className="p-2 rounded-lg hover:bg-white/10 transition-all"
              >
                {showAddContact ? (
                  <X className="w-4 h-4 text-white" />
                ) : (
                  <Plus className="w-4 h-4 text-white" />
                )}
              </button>
            </div>

            {showAddContact && (
              <div className="mb-4 space-y-3">
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/30"
                />
                <input
                  type="text"
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                  placeholder="Address"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={saveContact}
                  className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
                >
                  Save Contact
                </button>
              </div>
            )}

            <div className="space-y-2">
              {contacts.length > 0 ? (
                contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => selectContact(contact)}
                        className="flex-1 text-left"
                      >
                        <p className="font-semibold text-white text-sm">
                          {contact.name}
                        </p>
                        <p className="text-xs font-mono text-gray-400">
                          {contact.address.slice(0, 6)}...
                          {contact.address.slice(-6)}
                        </p>
                      </button>
                      <button
                        onClick={() => deleteContact(contact.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No contacts saved
                </p>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Recent</span>
            </h3>

            <div className="space-y-2">
              {recentPayments.length > 0 ? (
                recentPayments.map((payment, index) => (
                  <button
                    key={index}
                    onClick={() => selectRecentPayment(payment)}
                    className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">
                        {payment.amount} {payment.token}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(payment.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-400">
                      {payment.recipient.slice(0, 8)}...
                      {payment.recipient.slice(-8)}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent payments
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayAnyone;
