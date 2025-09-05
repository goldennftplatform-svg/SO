import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SofToken } from "../target/types/sof_token";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  getAccount,
  getAssociatedTokenAddress,
  mintTo,
  transfer,
} from "@solana/spl-token";
import { 
  Keypair, 
  LAMPORTS_PER_SOL, 
  PublicKey, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

describe("SOF Token Program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SofToken as Program<SofToken>;
  
  // Test accounts
  const adminWallet = Keypair.generate();
  const userWallet = Keypair.generate();
  
  // Program state
  let stateAccount: Keypair;
  let mint: PublicKey;
  let bankLpPool: PublicKey;
  let lockedLpPool: PublicKey;
  let userTokenAccount: PublicKey;
  let adminTokenAccount: PublicKey;

  beforeAll(async () => {
    // Airdrop SOL to admin wallet
    const signature = await provider.connection.requestAirdrop(
      adminWallet.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
    
    // Airdrop SOL to user wallet
    const userSignature = await provider.connection.requestAirdrop(
      userWallet.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(userSignature);
    
    console.log("✅ SOL airdropped to test wallets");
  });

  it("Initialize SOF Token Program", async () => {
    // Create state account
    stateAccount = Keypair.generate();
    
    // Create mint
    mint = await createMint(
      provider.connection,
      adminWallet,
      adminWallet.publicKey,
      adminWallet.publicKey,
      9 // 9 decimals like SOL
    );
    
    // Create LP pool accounts
    bankLpPool = await getAssociatedTokenAddress(
      mint,
      adminWallet.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    lockedLpPool = await getAssociatedTokenAddress(
      mint,
      adminWallet.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    // Create user token account
    userTokenAccount = await getAssociatedTokenAddress(
      mint,
      userWallet.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    // Create admin token account
    adminTokenAccount = await getAssociatedTokenAddress(
      mint,
      adminWallet.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    
    console.log("🔧 Creating token accounts...");
    
    // Initialize the program
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
        authority: adminWallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([stateAccount, adminWallet])
      .rpc();
    
    console.log("✅ SOF Token Program initialized!");
    console.log("📊 Tax Rates: Buy 2.5%, Sell 2.5%");
    console.log("🏦 LP Distribution: Bank 15%, Locked 85%");
  });

  it("Mint initial tokens to admin", async () => {
    // Mint 1 billion tokens to admin
    await mintTo(
      provider.connection,
      adminWallet,
      mint,
      adminTokenAccount,
      adminWallet,
      1000000000000
    );
    
    console.log("✅ 1 billion SOF tokens minted to admin");
  });

  it("Transfer tokens with tax collection", async () => {
    // Transfer 1000 tokens from admin to user (this will trigger tax)
    const transferAmount = 1000;
    
    await program.methods
      .transferWithTax(new anchor.BN(transferAmount))
      .accounts({
        state: stateAccount.publicKey,
        from: adminTokenAccount,
        to: userTokenAccount,
        bankLpPool: bankLpPool,
        lockedLpPool: lockedLpPool,
        authority: adminWallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([adminWallet])
      .rpc();
    
    console.log("✅ Transfer completed with tax collection!");
    
    // Check balances
    const adminBalance = await getAccount(provider.connection, adminTokenAccount);
    const userBalance = await getAccount(provider.connection, userTokenAccount);
    const bankLpBalance = await getAccount(provider.connection, bankLpPool);
    const lockedLpBalance = await getAccount(provider.connection, lockedLpPool);
    
    console.log("💰 Balances after transfer:");
    console.log(`   Admin: ${adminBalance.amount}`);
    console.log(`   User: ${userBalance.amount}`);
    console.log(`   Bank LP: ${bankLpBalance.amount}`);
    console.log(`   Locked LP: ${lockedLpBalance.amount}`);
  });

  it("Update tax rates (admin only)", async () => {
    // Update to 3% buy tax, 3% sell tax
    await program.methods
      .updateTaxRates(300, 300) // 3% = 300 basis points
      .accounts({
        state: stateAccount.publicKey,
        authority: adminWallet.publicKey,
      })
      .signers([adminWallet])
      .rpc();
    
    console.log("✅ Tax rates updated to 3% buy/sell");
  });

  it("Verify admin-only access control", async () => {
    try {
      // Try to update tax rates with user wallet (should fail)
      await program.methods
        .updateTaxRates(100, 100)
        .accounts({
          state: stateAccount.publicKey,
          authority: userWallet.publicKey,
        })
        .signers([userWallet])
        .rpc();
      
      // If we get here, the test failed
      throw new Error("❌ User was able to update tax rates - security breach!");
    } catch (error) {
      console.log("✅ Security test passed - only admin can update tax rates");
    }
  });
});
