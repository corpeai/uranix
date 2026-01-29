import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { getServerSupabase } from '@/lib/supabase';
import * as crypto from 'crypto';

/**
 * POST /api/privacy-cash/withdraw
 *
 * Withdraws SOL from privacy account to a recipient address.
 * This uses the server-stored keypair to sign the transaction server-side.
 *
 * Request body:
 * {
 *   walletAddress: string;    // User's wallet address (for authorization)
 *   amount: number;           // Amount in lamports to withdraw
 *   recipient: string;        // Recipient address (defaults to walletAddress if not provided)
 *   signature: string;        // Wallet signature for authorization
 *   message: string;          // The signed message
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   signature?: string;       // Transaction signature
 *   amount?: number;
 *   recipient?: string;
 *   error?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, amount, recipient, signature, message } = body;

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

    const recipientAddress = recipient || walletAddress;

    console.log('[Privacy Cash Withdraw] Request from:', walletAddress, 'amount:', amount / LAMPORTS_PER_SOL, 'SOL', 'to:', recipientAddress);

    // TODO: Verify signature to prove wallet ownership

    // Get privacy account
    const supabase = getServerSupabase();
    const { data: account, error: fetchError } = await supabase
      .from('privacy_accounts')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'No Privacy Cash account found. Deposit first.' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Decrypt the keypair
    const encryptionKey = process.env.PRIVACY_CASH_SERVER_ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new Error('Invalid PRIVACY_CASH_SERVER_ENCRYPTION_KEY');
    }

    const keyBuffer = Buffer.from(encryptionKey, 'hex');
    const iv = Buffer.from(account.encryption_iv, 'base64');
    const salt = Buffer.from(account.encryption_salt, 'base64');

    // Derive decryption key
    const derivedKey = crypto.pbkdf2Sync(keyBuffer, salt, 100000, 32, 'sha256');

    // Split encrypted data and auth tag
    const [encryptedData, authTagBase64] = account.encrypted_keypair.split(':');
    const authTag = Buffer.from(authTagBase64, 'base64');

    // Decrypt
    const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    const keypairData = JSON.parse(decrypted);
    const secretKey = Buffer.from(keypairData.secretKey, 'base64');
    const keypair = Keypair.fromSecretKey(secretKey);

    console.log('[Privacy Cash Withdraw] Decrypted keypair:', keypair.publicKey.toBase58());

    // Verify it matches the stored public key
    if (keypair.publicKey.toBase58() !== account.privacy_pubkey) {
      throw new Error('Keypair mismatch - decryption error');
    }

    // Create Solana connection
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error('Missing NEXT_PUBLIC_SOLANA_RPC_URL');
    }

    const connection = new Connection(rpcUrl, 'confirmed');

    // Check balance
    const balance = await connection.getBalance(keypair.publicKey);
    console.log('[Privacy Cash Withdraw] Privacy account balance:', balance / LAMPORTS_PER_SOL, 'SOL');

    // Estimate transaction fee (5000 lamports = 0.000005 SOL is typical)
    const estimatedFee = 5000;

    if (balance < amount + estimatedFee) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. You have ${balance / LAMPORTS_PER_SOL} SOL but need ${(amount + estimatedFee) / LAMPORTS_PER_SOL} SOL (including fee)`,
        },
        { status: 400 }
      );
    }

    // Create withdrawal transaction
    const recipientPubkey = new PublicKey(recipientAddress);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

    const transaction = new Transaction();
    transaction.feePayer = keypair.publicKey;
    transaction.recentBlockhash = blockhash;

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: amount,
      })
    );

    console.log('[Privacy Cash Withdraw] Sending transaction...');

    // Sign and send transaction
    const txSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [keypair],
      {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      }
    );

    console.log('[Privacy Cash Withdraw] Transaction confirmed:', txSignature);

    // Record transaction in database
    const { error: txError } = await supabase
      .from('privacy_transactions')
      .insert({
        wallet_address: walletAddress,
        transaction_type: 'withdraw',
        amount: amount,
        signature: txSignature,
        status: 'confirmed',
        recipient: recipientAddress,
        confirmed_at: new Date().toISOString(),
      });

    if (txError) {
      console.warn('[Privacy Cash Withdraw] Failed to record transaction:', txError);
    }

    // Update last_used_at
    await supabase
      .from('privacy_accounts')
      .update({ last_used_at: new Date().toISOString() })
      .eq('wallet_address', walletAddress);

    return NextResponse.json({
      success: true,
      signature: txSignature,
      amount: amount,
      recipient: recipientAddress,
      message: `Successfully withdrew ${amount / LAMPORTS_PER_SOL} SOL`,
    });

  } catch (error: any) {
    console.error('[Privacy Cash Withdraw] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to withdraw',
      },
      { status: 500 }
    );
  }
}
