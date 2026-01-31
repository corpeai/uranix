# 🛡️ Shieldlane

**Your transactions. Your business. Your Shieldlane.**

A privacy-preserving wallet wrapper for high-value Solana users (whales, DAOs, traders) built for the **Privacy Hack 2026** hackathon.

## 🎯 Overview

Shieldlane is a comprehensive privacy solution that shields transaction history and balances for Solana users who need protection from surveillance, front-running, and MEV extraction. Built with cutting-edge cryptographic primitives including ZK-SNARKs and Bulletproofs.

### Key Features

- **🔒 Private Balance Viewing**: Compare what surveillance tools see vs. your actual balance
- **👻 Stealth Mode Transfers**: Two privacy modes (External & Internal) for different use cases
- **📊 Surveillance Monitor**: Real-time analysis of what trackers can detect about your wallet
- **📚 Educational Content**: Learn about wallet surveillance without jargon
- **🎓 Privacy Score**: Get actionable recommendations to improve your privacy

## 🏆 Target Bounties

This project is optimized for the following bounties:

1. **Privacy Cash SDK** ($6k Best Overall) - Whale wallet privacy use case
2. **Radr Labs / ShadowWire** ($10k Grand Prize) - Bulletproofs for hiding amounts
3. **Track 01: Private Payments** ($15k) - Main hackathon track
4. **Helius RPC** ($5k) - RPC infrastructure integration
5. **Encrypt.trade** ($500) - Educational component about wallet surveillance

**Total Potential: $36,500+**

## 🚀 Quick Start

### Prerequisites

- **Node.js 20.9.0 or higher** (Next.js 16 requirement)
- Yarn package manager
- Solana wallet (Phantom, Solflare, or Backpack)

### Installation

```bash
# 1. Check Node version (must be 20.9.0+)
node --version

# If below 20.9.0, upgrade Node:
# - Using Homebrew: brew upgrade node
# - Using nvm: nvm install 20 && nvm use 20
# - Or activate conda: conda activate base (if using conda/miniconda)

# 2. Clone the repository
git clone https://github.com/emlanis/shieldlane.git
cd shieldlane/app

# 3. Install dependencies
yarn install

# 4. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your Helius API key (get free at https://www.helius.dev/)

# 5. Run development server
yarn dev
```

Visit `http://localhost:3000` to see the application.

### Troubleshooting

**Error: "Node.js version >=20.9.0 is required"**
- Your system is using an older Node version
- Check with: `which node` and `node --version`
- Solution: Upgrade Node or use a version manager (nvm/conda)
- See [NEXT_STEPS.md](docs/NEXT_STEPS.md) for detailed instructions

### Environment Variables

Create a `.env.local` file in the `app/` directory:

```env
# Helius RPC Configuration
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key_here
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# ShadowPay API Configuration
NEXT_PUBLIC_SHADOWPAY_API_BASE=https://shadow.radr.fun/shadowpay

# Privacy Cash Configuration
NEXT_PUBLIC_PRIVACY_CASH_PROGRAM_ID=9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD
```

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Blockchain**: Solana (Devnet)
- **Wallet Integration**: Solana Wallet Adapter
- **Privacy Protocols**:
  - Privacy Cash SDK (ZK-SNARKs)
  - ShadowWire/ShadowPay (Bulletproofs, ElGamal encryption)
- **RPC**: Helius
- **State Management**: Zustand
- **UI Components**: Custom components with dark theme

### Project Structure

```
shieldlane/
├── app/                          # Next.js application
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
- Privacy Score (0-100)
- Tracking capabilities
- Actionable recommendations

## 🧪 How It Works

### Privacy Cash Integration

**Program ID**: `9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD`

- **Deposit**: Generate commitment in Merkle tree
- **Withdraw**: Prove ownership with ZK-SNARK without revealing which deposit
- Breaks link between deposits and withdrawals

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

- **Privacy Cash SDK**: https://github.com/Privacy-Cash/privacy-cash-sdk
- **ShadowWire API**: https://registry.scalar.com/@radr/apis/shadowpay-api
- **Helius RPC**: https://www.helius.dev/
- **Solana Explorer**: https://explorer.solana.com/?cluster=devnet

## 🏁 Hackathon Checklist

- [x] All code is open source
- [x] Deployed to Solana devnet
- [x] Documentation complete
- [x] Privacy Cash integration
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

- Privacy Cash team for ZK-SNARK technology
- Radr Labs for ShadowWire/ShadowPay
- Helius for RPC infrastructure
- Privacy Hack 2026 organizers

---

**Built by emlanis with ❤️ for Privacy Hack 2026**

*Your transactions. Your business. Your Shieldlane.* 🛡️
