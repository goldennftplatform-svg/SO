import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SofToken } from "../target/types/sof_token";
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
  console.log("🚀 SOFLOTTO Master Deployment Script");
  console.log("=====================================");
  
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.SofToken as Program<SofToken>;
  
  // Create state account for the program
  const stateAccount = Keypair.generate();
  
  console.log("🔑 Master Admin Wallet:", MASTER_ADMIN_PUBKEY);
  console.log("🏗️  State Account:", stateAccount.publicKey.toString());
  
  try {
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
    await program.methods
      .initialize(
        new anchor.BN(1000000000000), // 1 billion tokens
        250, // 2.5% buy tax (250 basis points)
        250, // 2.5% sell tax (250 basis points)
        1500, // 15% to bank LP (1500 basis points)
        8500  // 85% to locked LP (8500 basis points)
      )
      .accounts({
        state: stateAccount.publicKey,
        mint: mint,
        bankLpPool: bankLpPool,
        lockedLpPool: lockedLpPool,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([stateAccount])
      .rpc();
    
    console.log("✅ SOF Token Program initialized successfully!");
    
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
    
    // Display final configuration
    console.log("\n🎯 SOFLOTTO Token Configuration:");
    console.log("=================================");
    console.log("🔑 Master Admin:", MASTER_ADMIN_PUBKEY);
    console.log("🏗️  Program State:", stateAccount.publicKey.toString());
    console.log("🪙 SOF Token Mint:", mint.toString());
    console.log("🏦 Bank LP Pool:", bankLpPool.toString());
    console.log("🔒 Locked LP Pool:", lockedLpPool.toString());
    console.log("💰 Admin Token Account:", adminTokenAccount.toString());
    console.log("📊 Buy Tax: 2.5%");
    console.log("📊 Sell Tax: 2.5%");
    console.log("🏦 LP Distribution: Bank 15%, Locked 85%");
    console.log("🔒 85% LP tokens will be BURNT for transparency!");
    
    console.log("\n🚀 Ready to test on Solana Devnet!");
    console.log("💡 Next steps:");
    console.log("   1. Test buy/sell transactions");
    console.log("   2. Verify tax collection");
    console.log("   3. Check LP pool distributions");
    console.log("   4. Verify LP token burning");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
