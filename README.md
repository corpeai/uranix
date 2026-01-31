# 🛡️ Solanica Finance PRVT

**Your transactions. Your business..**

A privacy-preserving wallet wrapper for high-value Solana users (whales,big transactions,wallet tracking, DAOs, traders) built for the **Privacy Hack 2026** hackathon.

## 🎯 Overview

SF PRVT enables private transfers on Solana by hiding transaction amounts using Bulletproofs while maintaining on-chain verifiability. The protocol supports 22 tokens.

### Key Features

- **🔒 Private Balance Viewing**: Compare what surveillance tools see vs. your actual balance
- **👻 Stealth Mode Transfers**: Two privacy modes (External & Internal) for different use cases
- **📊 Surveillance Monitor**: Real-time analysis of what trackers can detect about your wallet
- **📚 Educational Content**: Learn about wallet surveillance without jargon
- **🎓 Privacy Score**: Get actionable recommendations to improve your privacy

## 🏆 Target Bounties

This project is optimized for the following bounties:

1. **Radr Labs / ShadowWire** ($10k Grand Prize) - Bulletproofs for hiding amounts
2. **Track 01: Private Payments** ($15k) - Main hackathon track
3. **Helius RPC** ($5k) - RPC infrastructure integration
4. **Encrypt.trade** ($500) - Educational component about wallet surveillance

**Total Potential: $30,500+**

## 🚀 Quick Start

```
import { ShadowWireClient } from '@radr/shadowwire';

const client = new ShadowWireClient();
const balance = await client.getBalance('YOUR_WALLET');
await client.transfer({
  sender: 'YOUR_WALLET',
  recipient: 'RECIPIENT_WALLET',
  amount: 0.5,
  token: 'SOL',
  type: 'internal'
});
```
### Prerequisites

- Npm package manager
- Solana wallet (Phantom, Solflare, or Backpack)

### Installation

```
npm install @radr/shadowwire

# 2. Clone the repository

git clone https://github.com/solanicafinance/solanicafinanceprvt.git

# 3. Install dependencies
npm install
# 4. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your Helius API key (get free at https://www.helius.dev/)
```

# 5. Run development server

```
Run npm dev
```

Visit `http://localhost:3000` to see the application.

### Troubleshooting

**Error: "Node.js version >=20.9.0 is required"**
- Your system is using an older Node version
- Check with: `which node` and `node --version`
- Solution: Upgrade Node or use a version manager (nvm/conda)

### Environment Variables

```
Create a .env.local` file in the `app/` directory:
```
# Helius RPC Configuration

```
VITE_PUBLIC_HELIUS_API_KEY=your_helius_api_key_here
VITE_PUBLIC_SOLANA_NETWORK=devnet

```

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Vite, TypeScript, Tailwind CSS
- **Blockchain**: Solana (Devnet)
- **Wallet Integration**: Solana Wallet Adapter
- **Privacy Protocols**:
- ShadowWire/ShadowPay (Bulletproofs, ElGamal encryption)
- **RPC**: Helius
- **State Management**: Zustand
- **UI Components**: Custom components with dark theme

### Project Structure

```
sf prvt/
├── app/                          # vite application
│   ├── src/
│   │   ├── app/                  # App router pages
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   ├── stealth/          # Stealth mode transfers
│   │   │   ├── monitor/          # Surveillance monitor
│   │   │   └── learn/            # Educational content
│   │   ├── components/           # React components
│   │   ├── lib/                  # Core libraries
│   │   ├── hooks/                # Custom React hooks
│   │   ├── store/                # State management
│   │   └── types/                # TypeScript types
│   └── public/                   # Static assets
├── docs/                         # Documentation
└── README.md                     # This file
```

## 🔐 Privacy Features

### 1. Private Balance Viewing

Shows two views:
- **What Trackers See**: Public balance visible on block explorers
- **Your Actual Balance**: Total holdings including privacy pools

### 2. Stealth Mode Transfers

**External Mode (Sender Hidden)**
- ✅ Sender identity hidden using Groth16 ZK proofs
- ⚠️ Amount and recipient visible
- 📋 Best for: Withdrawals to exchanges

**Internal Mode (Maximum Privacy)**
- ✅ Everything hidden - sender, amount, recipient
- ✅ Bulletproofs + ElGamal encryption
- 📋 Best for: Sensitive transactions

### 3. Surveillance Monitor

Analyzes:
- Exposed vs Protected transactions
- Tracking capabilities
- Actionable recommendations

## 🧪 How It Works


### ShadowWire Integration

**API Base**: `https://shadow.radr.fun/shadowpay`

- **External Mode**: Groth16 ZK proofs hide sender
- **Internal Mode**: Bulletproofs + ElGamal hide everything
- Range proofs ensure encrypted amounts are valid

## 📊 Surveillance Detection

Tracks:
- Transaction history exposure
- Balance visibility
- Privacy coverage percentage
- Risk level (low/medium/high)

## 🎓 Educational Content

The `/learn` page covers:
1. Privacy Basics - Why privacy matters
2. Surveillance Methods - How tracking works
3. Privacy Technology - ZK-SNARKs & Bulletproofs explained
4. Best Practices - For whales and DAOs

## 🔗 Links

- **ShadowWire API**: https://registry.scalar.com/@radr/apis/shadowpay-api
- **Helius RPC**: https://www.helius.dev/
- **Solana Explorer**: https://explorer.solana.com/?cluster=devnet

## 🏁 Hackathon Checklist

- [x] All code is open source
- [x] Deployed to Solana devnet
- [x] Documentation complete
- [x] ShadowWire integration
- [x] Helius RPC configuration
- [x] Educational content
- [ ] Demo video (max 3 min)
- [ ] Submit before Feb 1, 2026

## 📝 Demo Video Script

**0:00-0:30 - Problem**: Show whale wallet exposure on explorer
**0:30-1:00 - Solution**: Introduce Shieldlane dashboard
**1:00-2:00 - Demo**: Execute stealth transfer, show hidden data
**2:00-2:30 - Technical**: Explain cryptographic primitives
**2:30-3:00 - CTA**: Privacy is choice, try on devnet

## 📄 License

MIT License - Open Source

## 🙏 Acknowledgments

- Radr Labs for ShadowWire/ShadowPay
- Helius for RPC infrastructure
- Privacy Hack 2026 organizers

---

**Built by Solanica Finance with ❤️ for Privacy Hack 2026**

*Kepp Your transactions Your business SF PRVT.* 
