# Helius RPC Setup Guide

## Why Helius?

Helius provides enterprise-grade Solana RPC infrastructure with:
- **100+ requests/second** (vs 1-2 req/s on public endpoints)
- **99.9% uptime** guarantee
- **Enhanced APIs** (webhooks, DAS API, compression support)
- **Better performance** for Privacy Cash operations
- **Free tier** available for testing

## Setup Steps

### 1. Create Helius Account

1. Go to [https://helius.dev](https://helius.dev)
2. Click "Get Started" or "Sign Up"
3. Sign up with email or GitHub
4. Verify your email

### 2. Create API Key

1. Log in to Helius Dashboard
2. Click "Create New Project" or select existing project
3. Choose network:
   - **Devnet** for testing (recommended to start)
   - **Mainnet** for production
4. Copy your API key (starts with your project name)

### 3. Add to Vercel (Secure Method)

⚠️ **IMPORTANT**: Don't use `VITE_PUBLIC_HELIUS_API_KEY` - it exposes your key in the browser!

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to [vercel.com](https://vercel.com)
2. Select your `shieldlane` project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add variable with **full RPC URL**:
   ```
   Name:  VITE_PUBLIC_SOLANA_RPC_URL
   Value: https://devnet.helius-rpc.com/?api-key=your-helius-api-key-here
   ```
   - For **devnet**: `https://devnet.helius-rpc.com/?api-key=YOUR_KEY`
   - For **mainnet**: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`

6. Also add network variable:
   ```
   Name:  VITE_PUBLIC_SOLANA_NETWORK
   Value: devnet
   ```
7. Select environments: Production, Preview, Development
8. Click **Save**
9. Go to **Deployments** tab
10. Click **Redeploy** on latest deployment

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Add RPC URL environment variable
vercel env add VITE_PUBLIC_SOLANA_RPC_URL

# Paste your full Helius RPC URL when prompted:
# https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Select: Production, Preview, Development

# Add network variable
vercel env add VITE_PUBLIC_SOLANA_NETWORK

# Enter: devnet

# Redeploy
vercel --prod
```

### 4. Verify Configuration

Your app will automatically use Helius RPC. Check in browser console:

```javascript
// The connection endpoint should show Helius
console.log(connection.rpcEndpoint)
// Output: https://rpc.helius.xyz/?api-key=your-key
```

## RPC Endpoints

### Devnet
```
https://rpc.helius.xyz/?api-key=YOUR_API_KEY
```

### Mainnet
```
https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

## Environment Variable Configuration

Add to Vercel (all environments):

```bash
# Required - Use full RPC URL (more secure than separate API key)
VITE_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=your-key-here
VITE_PUBLIC_SOLANA_NETWORK=devnet

# Optional
VITE_PUBLIC_PRIVACY_CASH_PROGRAM_ID=9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD
VITE_PUBLIC_SHADOWPAY_API_BASE=https://shadow.radr.fun/shadowpay
```

### Why This is Safe

While the RPC URL (with API key) is visible in the browser, it's acceptable because:

1. **Domain Restrictions**: Configure your Helius API key to only work from `shieldlane.vercel.app`
2. **Rate Limits**: Worst case, someone hits your rate limit (not your wallet)
3. **No Billing Risk**: Free tier has no credit card, paid tier has monthly caps
4. **Industry Standard**: This is how most dApps use RPC endpoints

### Even More Secure (Advanced)

For maximum security, use an API route proxy:

1. Create `app/api/rpc/route.ts` (server-side only)
2. Use `HELIUS_API_KEY` (without NEXT_PUBLIC prefix)
3. Proxy RPC requests through your API
4. Rate limit on your backend

This is overkill for most dApps but available if needed.

## Testing Helius Connection

1. Deploy to Vercel with Helius API key
2. Visit https://shieldlane.vercel.app
3. Open browser DevTools (F12)
4. Go to Console tab
5. Check for faster load times and no rate limit errors

### Expected Behavior

**With Helius**:
- ✅ Fast wallet balance updates
- ✅ Quick transaction confirmations
- ✅ No rate limit errors
- ✅ Privacy Cash operations work smoothly

**Without Helius** (public RPC):
- ⚠️ Slower balance updates
- ⚠️ Potential rate limit errors
- ⚠️ Transaction confirmation delays
- ⚠️ Privacy operations may timeout

## Helius Free Tier Limits

- **100 requests/second**
- **Unlimited total requests**
- **Devnet**: Free forever
- **Mainnet**: 100 req/s free, upgrade for more

Perfect for Shieldlane's needs!

## Advanced Helius Features (Future)

### 1. Webhooks
Get notified when:
- Privacy Cash deposits complete
- Withdrawals confirmed
- ShadowPay transfers finalized

### 2. Digital Asset Standard (DAS) API
- Compressed NFT support
- Token metadata
- Asset ownership verification

### 3. Enhanced Transaction APIs
- Transaction history with filters
- Failed transaction insights
- Custom retry logic

## Troubleshooting

### Issue: "403 Forbidden" errors

**Solution**: Check API key is correctly set in Vercel environment variables

### Issue: Still using public RPC

**Solutions**:
1. Verify environment variable name: `NEXT_PUBLIC_HELIUS_API_KEY`
2. Redeploy after adding variable
3. Check variable is set for all environments

### Issue: Rate limits on Helius

**Solution**: You're likely on free tier hitting 100 req/s. Solutions:
1. Implement request batching
2. Add caching layer
3. Upgrade to paid tier

## Alternative RPC Providers

If Helius doesn't work for you:

### QuickNode
```
VITE_PUBLIC_SOLANA_RPC_URL=https://your-quicknode-endpoint.solana-devnet.quiknode.pro/YOUR_KEY/
```

### Alchemy
```
VITE_PUBLIC_SOLANA_RPC_URL=https://solana-devnet.g.alchemy.com/v2/YOUR_KEY
```

### GenesysGo (Mainnet only)
```
VITE_PUBLIC_SOLANA_RPC_URL=https://ssc-dao.genesysgo.net/
```

## Cost Estimate

For Shieldlane usage:

### Devnet (Always Free)
- Unlimited requests
- Perfect for development
- No credit card required

### Mainnet (Free Tier)
- **100 req/sec** free
- Estimated usage: 10-50 req/sec
- **Cost**: $0/month

### Mainnet (If scaling)
- Paid tiers start at $99/month
- 500+ req/sec
- Only needed if app gets very popular

## Next Steps

1. ✅ Sign up for Helius
2. ✅ Create devnet API key
3. ✅ Add to Vercel environment variables
4. ✅ Redeploy
5. ✅ Test Privacy Cash deposit
6. ✅ Monitor performance in Helius dashboard

---

**Questions?**
- Helius Discord: https://discord.gg/helius
- Helius Docs: https://docs.helius.dev
- Helius Support: support@helius.dev
