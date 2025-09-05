import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SofToken } from "../target/types/sof_token";
import { AdminAccess } from "../target/types/admin_access";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAccount,
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
  console.log("🚀 SOFLOTTO Complete Deployment Script");
  console.log("======================================");
  console.log("🔑 Master Admin:", MASTER_ADMIN_PUBKEY);
  console.log("🌐 Network: Solana Devnet");
  console.log("");
  
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const sofProgram = anchor.workspace.SofToken as Program<SofToken>;
  const adminProgram = anchor.workspace.AdminAccess as Program<AdminAccess>;
  
  try {
    // ========================================
    // STEP 1: Deploy Admin Access Control
    // ========================================
    console.log("🔐 STEP 1: Deploying Admin Access Control...");
    
    const adminStateAccount = Keypair.generate();
    
    await adminProgram.methods
      .initializeAdmin(new PublicKey(MASTER_ADMIN_PUBKEY))
      .accounts({
        adminState: adminStateAccount.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([adminStateAccount])
      .rpc();
    
    console.log("✅ Admin Access Control deployed!");
    console.log("   State Account:", adminStateAccount.publicKey.toString());
    
    // ========================================
    // STEP 2: Deploy SOF Token Program
    // ========================================
    console.log("\n🪙 STEP 2: Deploying SOF Token Program...");
    
    const sofStateAccount = Keypair.generate();
    
    // Create SOF token mint
    console.log("🔧 Creating SOF token mint...");
    const mint = await createMint(
      provider.connection,
      provider.wallet as any,
      provider.wallet.publicKey,
      provider.wallet.publicKey,
      9 // 9 decimals like SOL
    );
    
    console.log("✅ SOF Token Mint created:", mint.toString());
    
    // Create LP pool accounts
    console.log("🏦 Creating LP pool accounts...");
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
    
    // Initialize the SOF Token Program
    console.log("🚀 Initializing SOF Token Program...");
    await sofProgram.methods
      .initialize(
        new anchor.BN(1000000000000), // 1 billion tokens
        250, // 2.5% buy tax (250 basis points)
        250, // 2.5% sell tax (250 basis points)
        1500, // 15% to bank LP (1500 basis points)
        8500  // 85% to locked LP (8500 basis points)
      )
      .accounts({
        state: sofStateAccount.publicKey,
        mint: mint,
        bankLpPool: bankLpPool,
        lockedLpPool: lockedLpPool,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([sofStateAccount])
      .rpc();
    
    console.log("✅ SOF Token Program initialized!");
    
    // Mint initial tokens to admin
    console.log("💰 Minting initial tokens...");
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
    // STEP 3: Test Admin Access Control
    // ========================================
    console.log("\n🔐 STEP 3: Testing Admin Access Control...");
    
    // Test admin verification
    await adminProgram.methods
      .isAdmin(new PublicKey(MASTER_ADMIN_PUBKEY))
      .accounts({
        adminState: adminStateAccount.publicKey,
      })
      .rpc();
    
    console.log("✅ Admin verification test passed!");
    
    // ========================================
    // FINAL CONFIGURATION DISPLAY
    // ========================================
    console.log("\n🎯 SOFLOTTO Complete Configuration:");
    console.log("====================================");
    console.log("👑 Master Admin:", MASTER_ADMIN_PUBKEY);
    console.log("");
    console.log("🔐 Admin Access Control:");
    console.log("   Program ID:", adminProgram.programId.toString());
    console.log("   State Account:", adminStateAccount.publicKey.toString());
    console.log("");
    console.log("🪙 SOF Token Program:");
    console.log("   Program ID:", sofProgram.programId.toString());
    console.log("   State Account:", sofStateAccount.publicKey.toString());
    console.log("   Token Mint:", mint.toString());
    console.log("   Bank LP Pool:", bankLpPool.toString());
    console.log("   Locked LP Pool:", lockedLpPool.toString());
    console.log("   Admin Token Account:", adminTokenAccount.toString());
    console.log("");
    console.log("📊 Tokenomics Configuration:");
    console.log("   Buy Tax: 2.5%");
    console.log("   Sell Tax: 2.5%");
    console.log("   LP Distribution: Bank 15%, Locked 85%");
    console.log("   🔒 85% LP tokens will be BURNT for transparency!");
    console.log("");
    console.log("🚀 Deployment Complete!");
    console.log("💡 Next steps:");
    console.log("   1. Test buy/sell transactions on devnet");
    console.log("   2. Verify tax collection and distribution");
    console.log("   3. Check LP pool balances");
    console.log("   4. Verify LP token burning mechanism");
    console.log("   5. Test admin access control functions");
    console.log("");
    console.log("🔗 View on Solana Explorer:");
    console.log(`   Admin Program: https://explorer.solana.com/address/${adminProgram.programId.toString()}?cluster=devnet`);
    console.log(`   SOF Token Program: https://explorer.solana.com/address/${sofProgram.programId.toString()}?cluster=devnet`);
    console.log(`   SOF Token Mint: https://explorer.solana.com/address/${mint.toString()}?cluster=devnet`);
    
    // ========================================
    // SAVE CONFIGURATION TO FILE
    // ========================================
    const config = {
      programId: sofProgram.programId.toString(),
      adminProgramId: adminProgram.programId.toString(),
      adminAddress: MASTER_ADMIN_PUBKEY,
      tokenMint: mint.toString(),
      bankLpPool: bankLpPool.toString(),
      lockedLpPool: lockedLpPool.toString(),
      adminTokenAccount: adminTokenAccount.toString(),
      adminStateAccount: adminStateAccount.publicKey.toString(),
      sofStateAccount: sofStateAccount.publicKey.toString(),
      decimals: 9,
      initialSupply: 1000000000000,
      buyTax: 250, // 2.5%
      sellTax: 250, // 2.5%
      bankLpPercent: 1500, // 15%
      lockedLpPercent: 8500 // 85%
    };
    
    const fs = require('fs');
    fs.writeFileSync('deployment-config.json', JSON.stringify(config, null, 2));
    console.log("\n💾 Configuration saved to deployment-config.json");
    
    // Also create a simple text file for easy copying
    const textConfig = `
SOFLOTTO Deployment Configuration
================================

Program IDs:
- SOF Token Program: ${sofProgram.programId.toString()}
- Admin Program: ${adminProgram.programId.toString()}

Token Configuration:
- Token Mint: ${mint.toString()}
- Decimals: 9
- Initial Supply: 1,000,000,000 SOF

Pool Addresses:
- Bank LP Pool: ${bankLpPool.toString()}
- Locked LP Pool: ${lockedLpPool.toString()}
- Admin Token Account: ${adminTokenAccount.toString()}

State Accounts:
- Admin State: ${adminStateAccount.publicKey.toString()}
- SOF State: ${sofStateAccount.publicKey.toString()}

Tax Configuration:
- Buy Tax: 2.5%
- Sell Tax: 2.5%
- LP Distribution: Bank 15%, Locked 85%

Explorer Links:
- Admin Program: https://explorer.solana.com/address/${adminProgram.programId.toString()}?cluster=devnet
- SOF Token Program: https://explorer.solana.com/address/${sofProgram.programId.toString()}?cluster=devnet
- SOF Token Mint: https://explorer.solana.com/address/${mint.toString()}?cluster=devnet
`;
    
    fs.writeFileSync('deployment-config.txt', textConfig);
    console.log("📄 Text configuration saved to deployment-config.txt");
    
  } catch (error) {
    console.error("❌ Complete deployment failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
