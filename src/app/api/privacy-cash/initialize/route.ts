import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import { getServerSupabase } from '@/lib/supabase';
import * as crypto from 'crypto';

/**
 * POST /api/privacy-cash/initialize
 *
 * Creates an encrypted Privacy Cash keypair for a user.
 * This keypair is stored server-side and used for all privacy operations.
 *
 * Request body:
 * {
 *   walletAddress: string;  // User's Solana wallet address
 *   signature: string;       // Signature proving wallet ownership
 *   message: string;         // The message that was signed
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   privacyPubkey: string;  // The public key of the privacy account
 *   message?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, signature, message } = body;

    // Validate request
    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[Privacy Cash Init] Request for wallet:', walletAddress);

    // TODO: Verify signature to prove wallet ownership
    // For now, we'll trust the signature (implement verification later)

    // Check if account already exists
    const supabase = getServerSupabase();
    const { data: existing } = await supabase
      .from('privacy_accounts')
      .select('privacy_pubkey')
      .eq('wallet_address', walletAddress)
      .single();

    if (existing) {
      console.log('[Privacy Cash Init] Account already exists:', existing.privacy_pubkey);
      return NextResponse.json({
        success: true,
        privacyPubkey: existing.privacy_pubkey,
        message: 'Privacy account already exists',
      });
    }

    // Generate new keypair
    const keypair = Keypair.generate();
    const privacyPubkey = keypair.publicKey.toBase58();

    console.log('[Privacy Cash Init] Generated keypair:', privacyPubkey);

    // Encrypt the keypair
    const encryptionKey = process.env.PRIVACY_CASH_SERVER_ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new Error('Invalid PRIVACY_CASH_SERVER_ENCRYPTION_KEY - must be 64 hex characters');
    }

    // Convert encryption key from hex to Buffer
    const keyBuffer = Buffer.from(encryptionKey, 'hex');

    // Generate IV and salt
    const iv = crypto.randomBytes(16);
    const salt = crypto.randomBytes(32);

    // Derive encryption key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(keyBuffer, salt, 100000, 32, 'sha256');

    // Encrypt the secret key
    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);

    const keypairData = JSON.stringify({
      publicKey: keypair.publicKey.toBase58(),
      secretKey: Buffer.from(keypair.secretKey).toString('base64'),
    });

    let encrypted = cipher.update(keypairData, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();
    const encryptedKeypair = encrypted + ':' + authTag.toString('base64');

    // Store in database
    const { data, error } = await supabase
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

    if (error) {
      console.error('[Privacy Cash Init] Database error:', error);
      throw error;
    }

    console.log('[Privacy Cash Init] Account created successfully');

    return NextResponse.json({
      success: true,
      privacyPubkey: data.privacy_pubkey,
      message: 'Privacy account created successfully',
    });

  } catch (error: any) {
    console.error('[Privacy Cash Init] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initialize Privacy Cash account',
      },
      { status: 500 }
    );
  }
}
