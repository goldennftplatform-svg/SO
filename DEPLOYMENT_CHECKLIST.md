# 🚀 SOFLOTTO Deployment Checklist

## ✅ Pre-Deployment Checklist

### 🔧 Environment Setup
- [ ] Solana CLI installed and updated
- [ ] Anchor framework installed (`cargo install --git https://github.com/coral-xyz/anchor avm --locked --force`)
- [ ] Node.js and npm installed
- [ ] TypeScript installed (`npm install -g typescript ts-node`)

### 💰 Wallet Preparation
- [ ] Wallet configured as default (`solana config set --keypair ~/.config/solana/id.json`)
- [ ] **20+ TESTNET SOL** in your wallet
- [ ] Wallet connected to devnet (`solana config set --url devnet`)
- [ ] Master admin wallet: `2QAQ367aBeHgCoHQwHo8x7ga34dANguG5Nu82Rs4ky42`

### 🏗️ Code Preparation
- [ ] All smart contract files created
- [ ] `Anchor.toml` configured with program IDs
- [ ] `Cargo.toml` files have correct dependencies
- [ ] Deployment scripts created and tested

## 🚀 Deployment Steps

### Step 1: Build Programs
```bash
# Navigate to project directory
cd SOFLOTTO

# Build all programs
anchor build

# Generate program IDs
anchor keys list
```

**Expected Output:**
```
Program ID: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
Program ID: AdminAccess111111111111111111111111111111111111
```

### Step 2: Update Program IDs
- [ ] Update `declare_id!()` in `programs/sof-token/src/lib.rs`
- [ ] Update `declare_id!()` in `programs/admin-access/src/lib.rs`
- [ ] Verify `Anchor.toml` has correct program IDs

### Step 3: Deploy to Devnet
```bash
# Deploy all programs
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show [PROGRAM_ID] --url devnet
```

### Step 4: Run Complete Deployment Script
```bash
# Install dependencies if needed
npm install

# Run complete deployment
npx ts-node scripts/deploy-complete.ts
```

## 🔍 Post-Deployment Verification

### ✅ Program Deployment
- [ ] Admin Access Control deployed and initialized
- [ ] SOF Token Program deployed and initialized
- [ ] SOF token mint created
- [ ] LP pools initialized (Bank + Locked)
- [ ] 1 billion tokens minted to admin wallet

### ✅ Functionality Tests
- [ ] Admin access control working
- [ ] Token transfer with tax collection
- [ ] Tax distribution to LP pools (15% Bank, 85% Locked)
- [ ] LP token burning mechanism
- [ ] Admin-only functions restricted

### ✅ Security Verification
- [ ] Only master admin can modify tax rates
- [ ] Only master admin can add/remove admins
- [ ] Emergency pause/unpause working
- [ ] LP tokens being burned for transparency

## 📊 Expected Results

### Tokenomics
- **Buy Tax**: 2.5% (250 basis points)
- **Sell Tax**: 2.5% (250 basis points)
- **Bank LP**: 15% of collected taxes
- **Locked LP**: 85% of collected taxes
- **LP Tokens**: Burned for transparency

### Balances After Test Transfer
- **Admin Wallet**: 999,999,000 SOF (minus 1000 transfer + tax)
- **User Wallet**: 975 SOF (1000 - 2.5% tax)
- **Bank LP Pool**: 3.75 SOF (15% of 25 tax)
- **Locked LP Pool**: 21.25 SOF (85% of 25 tax)

## 🚨 Troubleshooting

### Common Issues & Solutions

#### ❌ Build Errors
```bash
# Clean and rebuild
anchor clean
anchor build
```

#### ❌ Insufficient SOL
```bash
# Request airdrop
solana airdrop 2 [WALLET_ADDRESS] --url devnet
```

#### ❌ Program ID Mismatch
- Verify `declare_id!()` matches generated program ID
- Check `Anchor.toml` configuration
- Ensure all files are saved

#### ❌ Permission Denied
- Verify you're using the master admin wallet
- Check wallet configuration
- Ensure wallet has sufficient SOL

## 🔗 Useful Commands

### Solana CLI
```bash
# Check wallet balance
solana balance --url devnet

# View program info
solana program show [PROGRAM_ID] --url devnet

# Check account data
solana account [ACCOUNT_ADDRESS] --url devnet
```

### Anchor CLI
```bash
# Build programs
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test
```

### Token Commands
```bash
# Check token balance
spl-token balance [MINT_ADDRESS] --url devnet

# View token accounts
spl-token accounts --url devnet
```

## 🎯 Success Criteria

**🚀 Deployment is SUCCESSFUL when:**

1. ✅ Both programs deployed to devnet
2. ✅ Admin access control initialized
3. ✅ SOF token program initialized
4. ✅ Token mint created with 1 billion supply
5. ✅ LP pools created and configured
6. ✅ Tax collection working (2.5% buy/sell)
7. ✅ LP distribution working (15%/85%)
8. ✅ LP token burning verified
9. ✅ Admin functions restricted to master admin
10. ✅ Emergency controls functional

## 🔐 Security Reminders

- **Master Admin Wallet**: `2QAQ367aBeHgCoHQwHo8x7ga34dANguG5Nu82Rs4ky42`
- **Backup Your Keys**: Secure your wallet private keys
- **Test Thoroughly**: Always test on devnet before mainnet
- **Monitor Balances**: Keep track of LP pool balances
- **Document Actions**: Record all admin operations

---

**🎉 Ready to deploy SOFLOTTO to Solana Devnet!**

**Your revolutionary tokenomics system with 2.5% taxes and dual LP management is ready to launch! 🚀**
