import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { getServerSupabase } from '@/lib/supabase';
import * as crypto from 'crypto';

/**
 * POST /api/privacy-cash/deposit
 *
 * Deposits SOL from user's public wallet to their privacy account.
 * Returns an unsigned transaction for the user to sign.
 *
 * Request body:
 * {
 *   walletAddress: string;    // User's public wallet address
 *   amount: number;           // Amount in lamports to deposit
 *   signature: string;        // Wallet signature for authorization
 *   message: string;          // The signed message
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   unsigned_tx_base64?: string;  // Base64 encoded unsigned transaction
 *   privacyPubkey?: string;       // Privacy account receiving the deposit
 *   amount?: number;              // Amount being deposited
 *   error?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, amount, signature, message } = body;

    // Validate request
    if (!walletAddress || !amount || !signature || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Minimum deposit: 0.001 SOL (1,000,000 lamports)
    if (amount < 1_000_000) {
      return NextResponse.json(
        { success: false, error: 'Minimum deposit is 0.001 SOL' },
        { status: 400 }
      );
    }

    console.log('[Privacy Cash Deposit] Request from:', walletAddress, 'amount:', amount / LAMPORTS_PER_SOL, 'SOL');

    // TODO: Verify signature to prove wallet ownership

    // Get or create privacy account
    const supabase = getServerSupabase();
    let { data: account, error: fetchError } = await supabase
      .from('privacy_accounts')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw fetchError;
    }

    // If no account exists, create one
    if (!account) {
      console.log('[Privacy Cash Deposit] No account found, creating new one...');

      // Generate new keypair
      const { Keypair } = await import('@solana/web3.js');
      const keypair = Keypair.generate();
      const privacyPubkey = keypair.publicKey.toBase58();

      // Encrypt the keypair
      const encryptionKey = process.env.PRIVACY_CASH_SERVER_ENCRYPTION_KEY;
      if (!encryptionKey || encryptionKey.length !== 64) {
        throw new Error('Invalid PRIVACY_CASH_SERVER_ENCRYPTION_KEY');
      }

      const keyBuffer = Buffer.from(encryptionKey, 'hex');
      const iv = crypto.randomBytes(16);
      const salt = crypto.randomBytes(32);
      const derivedKey = crypto.pbkdf2Sync(keyBuffer, salt, 100000, 32, 'sha256');
      const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);

      const keypairData = JSON.stringify({
        publicKey: keypair.publicKey.toBase58(),
        secretKey: Buffer.from(keypair.secretKey).toString('base64'),
      });

      let encrypted = cipher.update(keypairData, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      const authTag = cipher.getAuthTag();
      const encryptedKeypair = encrypted + ':' + authTag.toString('base64');

      // Store new account
      const { data: newAccount, error: insertError } = await supabase
        .from('privacy_accounts')
        .insert({
          wallet_address: walletAddress,
          encrypted_keypair: encryptedKeypair,
          encryption_iv: iv.toString('base64'),
          encryption_salt: salt.toString('base64'),
          privacy_pubkey: privacyPubkey,
          last_used_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      account = newAccount;
      console.log('[Privacy Cash Deposit] Created new account:', privacyPubkey);
    }

    // Create Solana connection
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error('Missing NEXT_PUBLIC_SOLANA_RPC_URL');
    }

    const connection = new Connection(rpcUrl, 'confirmed');

    // Create transfer transaction from user's wallet to privacy account
    const fromPubkey = new PublicKey(walletAddress);
    const toPubkey = new PublicKey(account.privacy_pubkey);

    console.log('[Privacy Cash Deposit] Creating transaction:', {
      from: fromPubkey.toBase58(),
      to: toPubkey.toBase58(),
      amount: amount / LAMPORTS_PER_SOL + ' SOL',
    });

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

    // Create transaction
    const transaction = new Transaction();
    transaction.feePayer = fromPubkey;
    transaction.recentBlockhash = blockhash;

    // Add transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: amount,
      })
    );

    // Serialize transaction
    const serializedTx = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const txBase64 = serializedTx.toString('base64');

    console.log('[Privacy Cash Deposit] Transaction created, length:', txBase64.length);

    // Record pending transaction in database
    const txSignature = 'pending-' + crypto.randomBytes(16).toString('hex');

    const { error: txError } = await supabase
      .from('privacy_transactions')
      .insert({
        wallet_address: walletAddress,
        transaction_type: 'deposit',
        amount: amount,
        signature: txSignature,
        status: 'pending',
      });

    if (txError) {
      console.warn('[Privacy Cash Deposit] Failed to record transaction:', txError);
      // Don't fail the request, we can record it later
    }

    return NextResponse.json({
      success: true,
      unsigned_tx_base64: txBase64,
      privacyPubkey: account.privacy_pubkey,
      amount: amount,
      message: 'Transaction created. Please sign and broadcast it.',
    });

  } catch (error: any) {
    console.error('[Privacy Cash Deposit] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create deposit transaction',
      },
      { status: 500 }
    );
  }
}
