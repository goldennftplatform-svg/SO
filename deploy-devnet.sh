#!/bin/bash

echo "🚀 SOFLOTTO Smart Contract Deployment to Devnet"
echo "================================================"

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Please install Anchor first:"
    echo "   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    exit 1
fi

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install Solana first:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Set cluster to devnet
echo "🔧 Setting cluster to devnet..."
solana config set --url devnet

# Check wallet balance
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance)
echo "Current balance: $BALANCE"

# Build the programs
echo "🔨 Building smart contracts..."
anchor build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Deploy to devnet
echo "🚀 Deploying to devnet..."
anchor deploy --provider.cluster devnet

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo "✅ Deployment successful!"

# Get program IDs
echo "📋 Program IDs:"
echo "SOF Token: $(solana address -k target/deploy/sof_token-keypair.json)"
echo "Bank Protection: $(solana address -k target/deploy/bank_protection-keypair.json)"
echo "Admin Access: $(solana address -k target/deploy/admin_access-keypair.json)"

echo ""
echo "🎉 SOFLOTTO smart contracts deployed to devnet!"
echo "Next steps:"
echo "1. Update Anchor.toml with the new program IDs"
echo "2. Initialize the contracts using the frontend"
echo "3. Test the admin dashboard functionality"

