import * as anchor from "@coral-xyz/anchor";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAssociatedTokenAddress,
  mintTo,
} from "@solana/spl-token";
import { 
  Keypair, 
  LAMPORTS_PER_SOL, 
  PublicKey, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

// Master Admin Wallet (your Phantom wallet)
const MASTER_ADMIN_PUBKEY = "2QAQ367aBeHgCoHQwHo8x7ga34dANguG5Nu82Rs4ky42";

async function main() {
  console.log("🚀 SOFLOTTO Simple Deployment Script");
  console.log("=====================================");
  console.log("🔑 Master Admin:", MASTER_ADMIN_PUBKEY);
  console.log("🌐 Network: Solana Devnet");
  console.log("");
  
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  try {
    // ========================================
    // STEP 1: Create SOF Token Mint
    // ========================================
    console.log("🪙 STEP 1: Creating SOF Token Mint...");
    
    const mint = await createMint(
      provider.connection,
      provider.wallet as any,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      9 // 9 decimals like SOL
    );
    
    console.log("✅ SOF Token Mint created:", mint.toString());
    
    // ========================================
    // STEP 2: Create LP Pool Accounts
    // ========================================
    console.log("\n🏦 STEP 2: Creating LP Pool Accounts...");
    
    const bankLpPool = await getAssociatedTokenAddress(
      mint,
      provider.wallet.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    const lockedLpPool = await getAssociatedTokenAddress(
      mint,
      provider.wallet.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    console.log("🏦 Bank LP Pool:", bankLpPool.toString());
    console.log("🔒 Locked LP Pool:", lockedLpPool.toString());
    
    // ========================================
    // STEP 3: Mint Initial Tokens
    // ========================================
    console.log("\n💰 STEP 3: Minting Initial Tokens...");
    
    const adminTokenAccount = await getAssociatedTokenAddress(
      mint,
      provider.wallet.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    await mintTo(
      provider.connection,
      provider.wallet as any,
      mint,
      adminTokenAccount,
      provider.wallet.publicKey,
      1000000000000 // 1 billion tokens
    );
    
    console.log("✅ 1 billion SOF tokens minted to admin wallet");
    
    // ========================================
    // FINAL CONFIGURATION DISPLAY
    // ========================================
    console.log("\n🎯 SOFLOTTO Configuration:");
    console.log("============================");
    console.log("👑 Master Admin:", MASTER_ADMIN_PUBKEY);
    console.log("");
    console.log("🪙 SOF Token:");
    console.log("   Token Mint:", mint.toString());
    console.log("   Bank LP Pool:", bankLpPool.toString());
    console.log("   Locked LP Pool:", lockedLpPool.toString());
    console.log("   Admin Token Account:", adminTokenAccount.toString());
    console.log("");
    console.log("📊 Tokenomics Setup:");
    console.log("   Total Supply: 1,000,000,000 SOF");
    console.log("   Decimals: 9");
    console.log("   LP Distribution: Bank 15%, Locked 85%");
    console.log("");
    console.log("🚀 Basic Setup Complete!");
    console.log("💡 Next steps:");
    console.log("   1. Deploy your smart contract program");
    console.log("   2. Initialize the program with these addresses");
    console.log("   3. Test buy/sell transactions on devnet");
    console.log("");
    console.log("🔗 View on Solana Explorer:");
    console.log(`   SOF Token Mint: https://explorer.solana.com/address/${mint.toString()}?cluster=devnet`);
    console.log(`   Bank LP Pool: https://explorer.solana.com/address/${bankLpPool.toString()}?cluster=devnet`);
    console.log(`   Locked LP Pool: https://explorer.solana.com/address/${lockedLpPool.toString()}?cluster=devnet`);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
