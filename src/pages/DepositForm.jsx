import React, { useState, useEffect } from 'react'
import { ShadowWireClient } from '@radr/shadowwire'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
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
} from 'lucide-react'
import { Transaction, VersionedTransaction } from '@solana/web3.js'

const DepositForm = () => {
  const { connected, publicKey, signMessage } = useWallet();


export function DepositForm({
  client,
  walletAddress,
  selectedToken,
  onDepositComplete,
}: DepositFormProps) {
  const { signTransaction } = useWallet()
  const { connection } = useConnection()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const getDecimals = (token: string): number => {
    const decimals: Record<string, number> = {
      SOL: 9,
      USDC: 6,
      ORE: 11,
      BONK: 5,
      JIM: 9,
      GODL: 11,
    }
    return decimals[token] || 9
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount) {
      setError('Please enter an amount')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!signTransaction) {
      setError('Wallet does not support transaction signing')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Convert to smallest unit (lamports for SOL)
      const decimals = getDecimals(selectedToken)
      const amountInSmallestUnit = Math.floor(amountNum * Math.pow(10, decimals))

      // Get unsigned transaction from SDK
      const response = await client.deposit({
        wallet: walletAddress,
        amount: amountInSmallestUnit,
        token: selectedToken,
      })

      console.log('Deposit response:', response)
      
      // Extract the base64 transaction from the response
      const txBase64 = (response as any).unsigned_tx_base64
      if (!txBase64) {
        throw new Error('No unsigned transaction returned from SDK')
      }

      // Deserialize the base64 transaction
      const buffer = Buffer.from(txBase64, 'base64')
      console.log('Buffer length:', buffer.length)
      console.log('First few bytes:', Array.from(buffer.slice(0, 10)))
      
      let transaction: Transaction | VersionedTransaction
      
      try {
        // Try VersionedTransaction first (more modern)
        transaction = VersionedTransaction.deserialize(new Uint8Array(buffer))
        console.log('✓ Deserialized as VersionedTransaction')
      } catch (versionedError) {
        console.log('VersionedTransaction failed, trying legacy Transaction')
        console.error('VersionedTransaction error:', versionedError)
        
        // Try legacy Transaction
        transaction = Transaction.from(new Uint8Array(buffer))
        console.log('✓ Deserialized as legacy Transaction')
      }

      console.log('Transaction object:', transaction)
      console.log('Transaction constructor:', transaction?.constructor?.name)
      console.log('serialize method exists?', 'serialize' in transaction && typeof transaction.serialize === 'function')
      
      // Verify it's a valid transaction object
      if (!transaction || typeof transaction.serialize !== 'function') {
        throw new Error(`Invalid transaction object: ${JSON.stringify({
          hasTransaction: !!transaction,
          constructorName: transaction?.constructor?.name,
          hasSerialize: transaction ? 'serialize' in transaction : false,
          serializeType: transaction ? typeof transaction.serialize : 'undefined'
        })}`)
      }

      // Sign the transaction with the wallet
      const signedTx = await signTransaction(transaction)
      console.log('Transaction signed successfully')

      // Serialize the signed transaction
      let serialized: Uint8Array
      if (signedTx instanceof VersionedTransaction) {
        serialized = signedTx.serialize()
      } else if (signedTx instanceof Transaction) {
        serialized = signedTx.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        })
      } else {
        throw new Error('Unknown transaction type after signing')
      }

      // Send the raw transaction
      const signature = await connection.sendRawTransaction(serialized, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')

      setSuccess(`Deposit successful! Signature: ${signature.slice(0, 8)}...`)
      setAmount('')

      // Refresh balance after successful deposit
      setTimeout(() => {
        onDepositComplete()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Deposit failed. Please try again.')
      console.error('Deposit error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
          <svg
            className="w-6 h-6 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold">Deposit to ShadowWire</h3>
      </div>

      <p className="text-gray-400 mb-6 text-sm">
        Deposit {selectedToken} into your ShadowWire account to start making private transfers.
      </p>

      <form onSubmit={handleDeposit} className="space-y-6">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Amount ({selectedToken})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="any"
            min="0"
            className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:outline-none focus:border-green-600 transition-colors"
            disabled={loading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !amount}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center space-x-3">
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </span>
          ) : (
            'Deposit'
          )}
        </button>
      </form>
    </div>
  )
}
