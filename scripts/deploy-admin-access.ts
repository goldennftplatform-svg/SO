import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AdminAccess } from "../target/types/admin_access";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

// Master Admin Wallet (your Phantom wallet)
const MASTER_ADMIN_PUBKEY = "2QAQ367aBeHgCoHQwHo8x7ga34dANguG5Nu82Rs4ky42";

async function main() {
  console.log("🔐 SOFLOTTO Admin Access Control Deployment");
  console.log("==========================================");
  
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.AdminAccess as Program<AdminAccess>;
  
  // Create state account for the admin access program
  const adminStateAccount = Keypair.generate();
  
  console.log("🔑 Master Admin Wallet:", MASTER_ADMIN_PUBKEY);
  console.log("🏗️  Admin State Account:", adminStateAccount.publicKey.toString());
  
  try {
    // Initialize the admin access control
    console.log("🔐 Initializing admin access control...");
    await program.methods
      .initializeAdmin(new PublicKey(MASTER_ADMIN_PUBKEY))
      .accounts({
        adminState: adminStateAccount.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([adminStateAccount])
      .rpc();
    
    console.log("✅ Admin Access Control initialized successfully!");
    
    // Test admin verification
    console.log("🔍 Testing admin verification...");
    await program.methods
      .isAdmin(new PublicKey(MASTER_ADMIN_PUBKEY))
      .accounts({
        adminState: adminStateAccount.publicKey,
      })
      .rpc();
    
    console.log("✅ Admin verification test completed!");
    
    // Display final configuration
    console.log("\n🎯 Admin Access Control Configuration:");
    console.log("=====================================");
    console.log("👑 Master Admin:", MASTER_ADMIN_PUBKEY);
    console.log("🏗️  Admin State Account:", adminStateAccount.publicKey.toString());
    console.log("🔐 Program ID:", program.programId.toString());
    
    console.log("\n🚀 Admin Access Control Ready!");
    console.log("💡 Available functions:");
    console.log("   • Add new admins (master only)");
    console.log("   • Remove admins (master only)");
    console.log("   • Transfer master admin role");
    console.log("   • Emergency pause/unpause");
    console.log("   • Check admin status");
    
    console.log("\n🔒 Security Features:");
    console.log("   • Only master admin can add/remove admins");
    console.log("   • Master admin cannot be removed");
    console.log("   • Emergency pause for crisis situations");
    console.log("   • Maximum 10 admin limit");
    
  } catch (error) {
    console.error("❌ Admin access deployment failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
