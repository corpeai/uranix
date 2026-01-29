import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getServerSupabase } from '@/lib/supabase';

/**
 * GET /api/privacy-cash/balance?walletAddress=xxx
 *
 * Gets the Privacy Cash balance for a wallet.
 * Returns both the cached balance (from DB) and live balance (from blockchain).
 *
 * Query params:
 * - walletAddress: User's Solana wallet address
 *
 * Response:
 * {
 *   success: boolean;
 *   balance?: number;           // Balance in lamports (from blockchain)
 *   cachedBalance?: number;     // Balance in lamports (from database)
 *   privacyPubkey?: string;     // Privacy account public key
 *   error?: string;
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing walletAddress parameter' },
        { status: 400 }
      );
    }

    console.log('[Privacy Cash Balance] Request for:', walletAddress);

    // Get privacy account from database
    const supabase = getServerSupabase();
    const { data: account, error: fetchError } = await supabase
      .from('privacy_accounts')
      .select('privacy_pubkey')
      .eq('wallet_address', walletAddress)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // No rows found
        console.log('[Privacy Cash Balance] No account found');
        return NextResponse.json({
          success: true,
          balance: 0,
          cachedBalance: 0,
          message: 'No Privacy Cash account found. Deposit to create one.',
        });
      }
      throw fetchError;
    }

    // Get cached balance from database
    const { data: balanceData } = await supabase
      .from('privacy_balances')
      .select('balance')
      .eq('wallet_address', walletAddress)
      .single();

    const cachedBalance = balanceData?.balance || 0;

    // Get live balance from blockchain
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error('Missing NEXT_PUBLIC_SOLANA_RPC_URL');
    }

    const connection = new Connection(rpcUrl, 'confirmed');
    const privacyPubkey = new PublicKey(account.privacy_pubkey);

    const balance = await connection.getBalance(privacyPubkey);

    console.log('[Privacy Cash Balance] Results:', {
      privacyPubkey: account.privacy_pubkey,
      liveBalance: balance,
      cachedBalance: cachedBalance,
      difference: balance - cachedBalance,
    });

    // If balances differ significantly, we may need to sync transactions
    if (Math.abs(balance - cachedBalance) > 1000) {
      console.warn('[Privacy Cash Balance] Balance mismatch detected!', {
        live: balance,
        cached: cachedBalance,
        diff: balance - cachedBalance,
      });
    }

    return NextResponse.json({
      success: true,
      balance: balance,
      cachedBalance: cachedBalance,
      privacyPubkey: account.privacy_pubkey,
    });

  } catch (error: any) {
    console.error('[Privacy Cash Balance] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get balance',
      },
      { status: 500 }
    );
  }
}
