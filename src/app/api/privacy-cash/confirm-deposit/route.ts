import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getServerSupabase } from '@/lib/supabase';

/**
 * POST /api/privacy-cash/confirm-deposit
 *
 * Updates a pending deposit transaction with the actual signature
 * and confirms it on the blockchain.
 *
 * Request body:
 * {
 *   walletAddress: string;
 *   signature: string;  // Transaction signature from Solana
 *   amount: number;     // Amount in lamports (for verification)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, signature, amount } = await request.json();

    console.log('[Privacy Cash Confirm] Confirming deposit:', {
      walletAddress,
      signature,
      amount: amount / 1e9 + ' SOL',
    });

    // Validate inputs
    if (!walletAddress || !signature || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: walletAddress, signature, amount',
        },
        { status: 400 }
      );
    }

    // Get Solana connection
    const rpcUrl =
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    // Verify transaction on blockchain
    console.log('[Privacy Cash Confirm] Fetching transaction from blockchain...');
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      console.error('[Privacy Cash Confirm] Transaction not found on blockchain');
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found on blockchain',
        },
        { status: 404 }
      );
    }

    if (tx.meta?.err) {
      console.error('[Privacy Cash Confirm] Transaction failed on blockchain:', tx.meta.err);
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction failed on blockchain',
          details: tx.meta.err,
        },
        { status: 400 }
      );
    }

    console.log('[Privacy Cash Confirm] Transaction verified on blockchain');

    // Get Supabase client
    const supabase = getServerSupabase();

    // Find the pending transaction
    const { data: pendingTx, error: fetchError } = await supabase
      .from('privacy_transactions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('amount', amount)
      .eq('status', 'pending')
      .eq('transaction_type', 'deposit')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error('[Privacy Cash Confirm] Failed to find pending transaction:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'No pending deposit found',
          details: fetchError.message,
        },
        { status: 404 }
      );
    }

    console.log('[Privacy Cash Confirm] Found pending transaction:', pendingTx.id);

    // Update transaction with signature and mark as confirmed
    const { error: updateError } = await supabase
      .from('privacy_transactions')
      .update({
        signature: signature,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        block_time: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null,
        slot: tx.slot,
      })
      .eq('id', pendingTx.id);

    if (updateError) {
      console.error('[Privacy Cash Confirm] Failed to update transaction:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update transaction',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log('[Privacy Cash Confirm] Transaction confirmed successfully');

    // Update cached balance
    const { data: account } = await supabase
      .from('privacy_accounts')
      .select('privacy_pubkey')
      .eq('wallet_address', walletAddress)
      .single();

    if (account) {
      const privacyPubkey = new PublicKey(account.privacy_pubkey);
      const balance = await connection.getBalance(privacyPubkey);

      await supabase.from('privacy_balances').upsert({
        wallet_address: walletAddress,
        balance: balance,
        last_updated_at: new Date().toISOString(),
      });

      console.log('[Privacy Cash Confirm] Updated cached balance:', balance / 1e9, 'SOL');
    }

    return NextResponse.json({
      success: true,
      signature,
      blockTime: tx.blockTime,
      slot: tx.slot,
    });
  } catch (error: any) {
    console.error('[Privacy Cash Confirm] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
