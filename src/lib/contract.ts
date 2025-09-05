import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { PROGRAM_ID } from './constants';
import { Buffer } from 'buffer';

// RPC configuration - using standard devnet for now
const HELIUS_API_KEY = 'a5da9446-ceea-4925-b4bf-3ebb7811ff86';
const HELIUS_RPC_URL = `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`;
const DEVNET_RPC_URL = 'https://api.devnet.solana.com';

// Direct web3.js approach - no IDL needed

// IDL validation removed - using direct web3.js approach

// Helper function to create buffer from string (browser compatible)
const createBuffer = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};

// Contract interface for your deployed SOFLOTTO program
export interface SOFLOTTOContract {
  // Initialization (one-time setup)
  initialize(): Promise<string>;
  
  // Admin functions
  drawWinner(): Promise<string>;
  burnTokens(amount: number): Promise<string>;
  syncDualLp(tradingFees: number): Promise<string>;
  addLiquidity(tokenAmount: number, solAmount: number): Promise<string>;
  
  // Trading functions
  buyTokens(solAmount: number): Promise<string>;
  sellTokens(tokenAmount: number): Promise<string>;
  
  // Lottery functions
  enterLottery(entryTier: number): Promise<string>;
  
  // Data fetching
  getState(): Promise<any>;
  getUserState(userAddress: string): Promise<any>;
  getTransactionHistory(limit?: number): Promise<any[]>;
  getAccountActivity(accountAddress: string): Promise<any[]>;
}

export class SOFLOTTOContractImpl implements SOFLOTTOContract {
  private connection: Connection;
  private heliusConnection: Connection;
  private wallet: any;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.heliusConnection = new Connection(DEVNET_RPC_URL, 'confirmed'); // Use standard devnet
    this.wallet = wallet;
    console.log('✅ Contract created with direct web3.js approach');
    console.log('🔍 Constructor - Wallet object:', wallet);
    console.log('🔍 Constructor - Wallet type:', typeof wallet);
    console.log('🔍 Constructor - Wallet methods:', wallet ? Object.getOwnPropertyNames(wallet) : 'null');
    console.log('🔍 Using standard devnet RPC:', DEVNET_RPC_URL);
  }

  // Helper method to get Associated Token Account address
  private async getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
    const { getAssociatedTokenAddress } = await import('@solana/spl-token');
    return await getAssociatedTokenAddress(mint, owner);
  }

  async initialize(): Promise<string> {
    try {
      console.log('🚀 CALLING REAL INITIALIZE FUNCTION!');
      console.log('🔧 NEW VERSION WITH BLOCKHASH FIX!');
      console.log('Wallet connected:', !!this.wallet);
      console.log('Wallet public key:', this.wallet?.publicKey?.toString());
      console.log('Connection:', !!this.connection);
      console.log('Wallet object type:', typeof this.wallet);
      console.log('Wallet object:', this.wallet);
      
      console.log('🔍 Starting initialize function execution...');
      
      if (!this.wallet) {
        throw new Error('Wallet object is null or undefined');
      }
      
      if (!this.wallet || !this.wallet.publicKey) {
        throw new Error('Wallet not connected or missing public key');
      }
      
      // Get the state PDA
      const [statePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from([115, 116, 97, 116, 101])], // "state" in ASCII
        new PublicKey(PROGRAM_ID)
      );

      console.log('State PDA:', statePDA.toString());
      console.log('Program ID:', PROGRAM_ID);
      console.log('Authority:', this.wallet.publicKey.toString());

      // Check wallet balance for transaction fees
      console.log('🔍 Checking wallet balance...');
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      const solBalance = balance / 1e9; // Convert lamports to SOL
      console.log(`Wallet balance: ${solBalance} SOL (${balance} lamports)`);
      
      if (balance < 5000) { // Minimum 0.000005 SOL for transaction fees
        throw new Error(`Insufficient SOL for transaction fees. Balance: ${solBalance} SOL`);
      }

      // Check if program is deployed using standard devnet
      console.log('🔍 Checking if program is deployed...');
      const programInfo = await this.heliusConnection.getAccountInfo(new PublicKey(PROGRAM_ID));
      if (!programInfo) {
        throw new Error(`Program ${PROGRAM_ID} is not deployed on this network`);
      }
      console.log('✅ Program is deployed');

      // Check if state account already exists
      console.log('🔍 Checking if state account exists...');
      const existingState = await this.heliusConnection.getAccountInfo(statePDA);
      if (existingState) {
        console.log('⚠️ State account already exists - contract may already be initialized');
        console.log('State account data length:', existingState.data.length);
        console.log('State account owner:', existingState.owner.toString());
        console.log('State account lamports:', existingState.lamports);
        return 'already_initialized';
      }
      console.log('✅ State account does not exist - ready to initialize');

      // Create initialize instruction manually with correct format
      const initializeInstruction = new TransactionInstruction({
        keys: [
          { pubkey: statePDA, isSigner: false, isWritable: true },
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        programId: new PublicKey(PROGRAM_ID),
        data: Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]) // Initialize discriminator from IDL
      });

      console.log('Created initialize instruction:', {
        programId: initializeInstruction.programId.toString(),
        keys: initializeInstruction.keys.map(k => ({
          pubkey: k.pubkey.toString(),
          isSigner: k.isSigner,
          isWritable: k.isWritable
        })),
        dataLength: initializeInstruction.data.length
      });

      // Create and send transaction
      const transaction = new Transaction().add(initializeInstruction);
      
      // Get recent blockhash and set it on the transaction
      console.log('Getting recent blockhash...');
      const { blockhash } = await this.heliusConnection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      
      // Simulate the transaction first to see what's wrong
      console.log('🔍 Simulating transaction...');
      try {
        const simulation = await this.heliusConnection.simulateTransaction(transaction);
        console.log('Simulation result:', simulation);
        console.log('Simulation value:', simulation.value);
        console.log('Simulation context:', simulation.context);
        console.log('Simulation logs:', simulation.value.logs);
        console.log('Simulation error:', simulation.value.err);
        
        if (simulation.value.err) {
          console.error('❌ Transaction simulation failed:', simulation.value.err);
          console.error('❌ Full simulation result:', JSON.stringify(simulation, null, 2));
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
        
        console.log('✅ Transaction simulation successful');
        console.log('Compute units used:', simulation.value.unitsConsumed);
        console.log('Logs:', simulation.value.logs);
      } catch (simError) {
        console.error('❌ Simulation error:', simError);
        throw simError;
      }
      
      console.log('Sending transaction...');
      console.log('Wallet object:', this.wallet);
      console.log('Wallet type:', typeof this.wallet);
      console.log('Wallet methods available:', Object.getOwnPropertyNames(this.wallet));
      console.log('Wallet prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.wallet)));
      console.log('Wallet keys:', Object.keys(this.wallet));
      
      // Check for specific methods
      console.log('Has signAndSendTransaction:', 'signAndSendTransaction' in this.wallet);
      console.log('Has sendTransaction:', 'sendTransaction' in this.wallet);
      console.log('Has signTransaction:', 'signTransaction' in this.wallet);
      console.log('Has signAllTransactions:', 'signAllTransactions' in this.wallet);
      
      // Try different methods to send transaction
      let signature: string;
      
      // For Phantom and other Solana wallets, try signAndSendTransaction first
      if (this.wallet.signAndSendTransaction) {
        console.log('Using signAndSendTransaction...');
        signature = await this.wallet.signAndSendTransaction(transaction);
      } else if (this.wallet.signTransaction) {
        console.log('Using signTransaction + send...');
        const signedTransaction = await this.wallet.signTransaction(transaction);
        signature = await this.heliusConnection.sendRawTransaction(signedTransaction.serialize());
      } else if (this.wallet.signAllTransactions) {
        console.log('Using signAllTransactions + send...');
        const signedTransactions = await this.wallet.signAllTransactions([transaction]);
        signature = await this.heliusConnection.sendRawTransaction(signedTransactions[0].serialize());
      } else if (this.wallet.sendTransaction) {
        console.log('Using sendTransaction...');
        signature = await this.wallet.sendTransaction(transaction, this.heliusConnection);
      } else {
        console.error('Available wallet methods:', Object.getOwnPropertyNames(this.wallet));
        throw new Error('No supported transaction method found on wallet. Available methods: ' + Object.getOwnPropertyNames(this.wallet).join(', '));
      }
      
      console.log('✅ Contract initialized successfully! TX:', signature);
      
      // Get enhanced transaction details from Helius
      try {
        const txDetails = await this.getTransactionDetails(signature);
        console.log('🔍 Transaction details:', txDetails);
      } catch (error) {
        console.log('⚠️ Could not fetch transaction details:', error.message);
      }
      
      return signature;
    } catch (error) {
      console.error('❌ Error initializing contract:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        walletConnected: !!this.wallet,
        hasPublicKey: !!this.wallet?.publicKey,
        errorName: error.name,
        errorCode: error.code
      });
      
      // Try to get more details about the transaction failure
      if (error.message.includes('Unexpected error')) {
        console.error('🔍 This appears to be a transaction execution error. Possible causes:');
        console.error('1. Program not deployed on this network');
        console.error('2. Invalid instruction data or discriminator');
        console.error('3. Missing required accounts');
        console.error('4. Insufficient funds for transaction fees');
        console.error('5. Program logic error');
      }
      
      throw error;
    }
  }

  async drawWinner(): Promise<string> {
    try {
      console.log('🎲 Drawing winner...');
      
      // Get the state PDA
      const [statePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from([115, 116, 97, 116, 101])], // "state" in ASCII
        new PublicKey(PROGRAM_ID)
      );

      // Get lottery pool PDA
      const [lotteryPoolPDA] = PublicKey.findProgramAddressSync(
        [createBuffer("lottery_pool")],
        new PublicKey(PROGRAM_ID)
      );

      // Create drawWinner instruction manually
      const drawWinnerInstruction = new TransactionInstruction({
        keys: [
          { pubkey: statePDA, isSigner: false, isWritable: true },
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: false },
          { pubkey: lotteryPoolPDA, isSigner: false, isWritable: true },
          { pubkey: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), isSigner: false, isWritable: false }
        ],
        programId: new PublicKey(PROGRAM_ID),
        data: Buffer.from([123, 45, 67, 89, 12, 34, 56, 78]) // DrawWinner discriminator (placeholder)
      });

      // Create and send transaction
      const transaction = new Transaction().add(drawWinnerInstruction);
      
      // Get recent blockhash and set it on the transaction
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      
      // Try different methods to send transaction
      let signature: string;
      if (this.wallet.signAndSendTransaction) {
        signature = await this.wallet.signAndSendTransaction(transaction);
      } else if (this.wallet.sendTransaction) {
        signature = await this.wallet.sendTransaction(transaction, this.connection);
      } else if (this.wallet.signTransaction) {
        const signedTransaction = await this.wallet.signTransaction(transaction);
        signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      } else {
        throw new Error('No supported transaction method found on wallet');
      }
      
      console.log('✅ Winner drawn successfully! TX:', signature);
      return signature;
    } catch (error) {
      console.error('❌ Error drawing winner:', error);
      throw error;
    }
  }

  async burnTokens(amount: number): Promise<string> {
    try {
      // TODO: Implement actual contract call
      console.log(`Burning ${amount} tokens...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return 'simulated_tx_hash_burn_tokens';
    } catch (error) {
      console.error('Error burning tokens:', error);
      throw error;
    }
  }

  async syncDualLp(tradingFees: number): Promise<string> {
    try {
      // TODO: Implement actual contract call
      console.log(`Syncing dual LP with ${tradingFees} trading fees...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return 'simulated_tx_hash_sync_lp';
    } catch (error) {
      console.error('Error syncing LP:', error);
      throw error;
    }
  }

  async addLiquidity(tokenAmount: number, solAmount: number): Promise<string> {
    try {
      console.log(`Adding liquidity: ${solAmount} SOL, ${tokenAmount} tokens`);
      
      // Get the state PDA
      const [statePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from([115, 116, 97, 116, 101])], // "state" in ASCII
        new PublicKey(PROGRAM_ID)
      );

      // For now, we'll use a placeholder token mint since the program doesn't have one yet
      // In a real implementation, this would be the actual SOFLOTTO token mint
      const TOKEN_MINT = new PublicKey('So11111111111111111111111111111111111111112'); // Using WSOL as placeholder
      const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112'); // Wrapped SOL mint

      // Derive Associated Token Accounts
      const userTokenAccount = await this.getAssociatedTokenAddress(TOKEN_MINT, this.wallet.publicKey);
      const userSolAccount = await this.getAssociatedTokenAddress(WSOL_MINT, this.wallet.publicKey);
      
      // For LP pools, we'll use the same addresses for now (in production these would be actual LP pool addresses)
      const lpPool = userTokenAccount; // Using user's token account as LP pool for now
      const lpSolPool = userSolAccount; // Using user's SOL account as LP SOL pool for now

      // Convert amounts to lamports/tokens (6 decimals)
      const solLamports = Math.floor(solAmount * 1e9); // SOL to lamports
      const tokenAmountLamports = Math.floor(tokenAmount * 1e6); // Tokens to smallest unit

      console.log('Account addresses:', {
        statePDA: statePDA.toString(),
        lpPool: lpPool.toString(),
        lpSolPool: lpSolPool.toString(),
        user: this.wallet.publicKey.toString(),
        userTokenAccount: userTokenAccount.toString(),
        userSolAccount: userSolAccount.toString()
      });

      console.log('Creating addLiquidity instruction with amounts:', {
        solLamports,
        tokenAmountLamports,
        solAmount,
        tokenAmount
      });

      // Create addLiquidity instruction manually
      const addLiquidityInstruction = new TransactionInstruction({
        keys: [
          { pubkey: statePDA, isSigner: false, isWritable: true },
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: userTokenAccount, isSigner: false, isWritable: true },
          { pubkey: userSolAccount, isSigner: false, isWritable: true },
          { pubkey: lpPool, isSigner: false, isWritable: true },
          { pubkey: lpSolPool, isSigner: false, isWritable: true },
          { pubkey: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), isSigner: false, isWritable: false }
        ],
        programId: new PublicKey(PROGRAM_ID),
        data: Buffer.concat([
          Buffer.from([181, 157, 89, 67, 143, 182, 52, 72]), // AddLiquidity discriminator
          Buffer.alloc(8), // tokenAmount (u64) - will be filled
          Buffer.alloc(8)  // solAmount (u64) - will be filled
        ])
      });

      // Fill in the amounts
      const dataView = new DataView(addLiquidityInstruction.data.buffer);
      dataView.setBigUint64(8, BigInt(tokenAmountLamports), true); // little-endian
      dataView.setBigUint64(16, BigInt(solLamports), true); // little-endian

      // Create and send transaction
      const transaction = new Transaction().add(addLiquidityInstruction);
      
      // Get recent blockhash and set it on the transaction
      console.log('Getting recent blockhash for addLiquidity...');
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      
      // Simulate the transaction first to see what's wrong
      console.log('🔍 Simulating addLiquidity transaction...');
      try {
        const simulation = await this.connection.simulateTransaction(transaction);
        console.log('Simulation result:', simulation);
        
        if (simulation.value.err) {
          console.error('❌ Transaction simulation failed:', simulation.value.err);
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
        
        console.log('✅ Transaction simulation successful');
        console.log('Compute units used:', simulation.value.unitsConsumed);
        console.log('Logs:', simulation.value.logs);
      } catch (simError) {
        console.error('❌ Simulation error:', simError);
        throw simError;
      }
      
      console.log('Sending addLiquidity transaction...');
      console.log('Wallet methods available:', Object.getOwnPropertyNames(this.wallet));
      
      // Try different methods to send transaction
      let signature: string;
      
      // For Phantom and other Solana wallets, try signAndSendTransaction first
      if (this.wallet.signAndSendTransaction) {
        console.log('Using signAndSendTransaction...');
        signature = await this.wallet.signAndSendTransaction(transaction);
      } else if (this.wallet.signTransaction) {
        console.log('Using signTransaction + send...');
        const signedTransaction = await this.wallet.signTransaction(transaction);
        signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      } else if (this.wallet.signAllTransactions) {
        console.log('Using signAllTransactions + send...');
        const signedTransactions = await this.wallet.signAllTransactions([transaction]);
        signature = await this.connection.sendRawTransaction(signedTransactions[0].serialize());
      } else if (this.wallet.sendTransaction) {
        console.log('Using sendTransaction...');
        signature = await this.wallet.sendTransaction(transaction, this.connection);
      } else {
        throw new Error('No supported transaction method found on wallet');
      }
      
      console.log(`✅ Liquidity added successfully! TX: ${signature}`);
      return signature;
    } catch (error) {
      console.error('❌ Error adding liquidity:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        solAmount,
        tokenAmount
      });
      throw error;
    }
  }

  async buyTokens(solAmount: number): Promise<string> {
    try {
      // TODO: Implement actual contract call
      console.log(`Buying tokens with ${solAmount} SOL...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return 'simulated_tx_hash_buy_tokens';
    } catch (error) {
      console.error('Error buying tokens:', error);
      throw error;
    }
  }

  async sellTokens(tokenAmount: number): Promise<string> {
    try {
      // TODO: Implement actual contract call
      console.log(`Selling ${tokenAmount} tokens...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return 'simulated_tx_hash_sell_tokens';
    } catch (error) {
      console.error('Error selling tokens:', error);
      throw error;
    }
  }

  async enterLottery(entryTier: number): Promise<string> {
    try {
      console.log(`🎲 Entering lottery with tier ${entryTier} (${this.getTierPrice(entryTier)})...`);
      
      // Validate entry tier
      if (![1, 2, 4, 8].includes(entryTier)) {
        throw new Error('Invalid entry tier - must be 1, 2, 4, or 8');
      }
      
      // Get the state PDA
      const [statePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from([115, 116, 97, 116, 101])], // "state" in ASCII
        new PublicKey(PROGRAM_ID)
      );

      // Get the user state PDA
      const [userStatePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from([117, 115, 101, 114]), this.wallet.publicKey.toBuffer()], // "user" + user pubkey
        new PublicKey(PROGRAM_ID)
      );

      // For now, we'll use placeholder addresses for token accounts
      // In a real implementation, you'd derive the actual token account addresses
      const userTokenAccount = this.wallet.publicKey; // Placeholder - should be actual token account
      const lotteryPool = this.wallet.publicKey; // Placeholder - should be actual lottery pool

      console.log('Account addresses:', {
        statePDA: statePDA.toString(),
        userStatePDA: userStatePDA.toString(),
        user: this.wallet.publicKey.toString(),
        userTokenAccount: userTokenAccount.toString(),
        lotteryPool: lotteryPool.toString()
      });

      // Create enterLottery instruction manually
      const enterLotteryInstruction = new TransactionInstruction({
        keys: [
          { pubkey: statePDA, isSigner: false, isWritable: true },
          { pubkey: userStatePDA, isSigner: false, isWritable: true },
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: userTokenAccount, isSigner: false, isWritable: true },
          { pubkey: lotteryPool, isSigner: false, isWritable: true },
          { pubkey: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        programId: new PublicKey(PROGRAM_ID),
        data: Buffer.concat([
          Buffer.from([252, 72, 239, 78, 58, 56, 149, 231]), // EnterLottery discriminator
          Buffer.from([entryTier]) // entry_tier (u8)
        ])
      });

      // Create and send transaction
      const transaction = new Transaction().add(enterLotteryInstruction);
      
      // Get recent blockhash and set it on the transaction
      console.log('Getting recent blockhash for enterLottery...');
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      
      // Simulate the transaction first
      console.log('🔍 Simulating enterLottery transaction...');
      try {
        const simulation = await this.connection.simulateTransaction(transaction);
        console.log('Simulation result:', simulation);
        
        if (simulation.value.err) {
          console.error('❌ Transaction simulation failed:', simulation.value.err);
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
        
        console.log('✅ Transaction simulation successful');
        console.log('Compute units used:', simulation.value.unitsConsumed);
        console.log('Logs:', simulation.value.logs);
      } catch (simError) {
        console.error('❌ Simulation error:', simError);
        throw simError;
      }
      
      console.log('Sending enterLottery transaction...');
      
      // Try different methods to send transaction
      let signature: string;
      
      if (this.wallet.signAndSendTransaction) {
        console.log('Using signAndSendTransaction...');
        signature = await this.wallet.signAndSendTransaction(transaction);
      } else if (this.wallet.signTransaction) {
        console.log('Using signTransaction + send...');
        const signedTransaction = await this.wallet.signTransaction(transaction);
        signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      } else if (this.wallet.signAllTransactions) {
        console.log('Using signAllTransactions + send...');
        const signedTransactions = await this.wallet.signAllTransactions([transaction]);
        signature = await this.connection.sendRawTransaction(signedTransactions[0].serialize());
      } else if (this.wallet.sendTransaction) {
        console.log('Using sendTransaction...');
        signature = await this.wallet.sendTransaction(transaction, this.connection);
      } else {
        throw new Error('No supported transaction method found on wallet');
      }
      
      console.log(`✅ Successfully entered lottery! TX: ${signature}`);
      return signature;
    } catch (error) {
      console.error('❌ Error entering lottery:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        entryTier
      });
      throw error;
    }
  }

  private getTierPrice(entryTier: number): string {
    switch (entryTier) {
      case 1: return '$20';
      case 2: return '$100';
      case 4: return '$500';
      case 8: return '$1000';
      default: return 'Invalid tier';
    }
  }

  async getState(): Promise<any> {
    try {
      console.log('Fetching contract state using Helius...');
      
      // Get the state PDA
      const [statePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from([115, 116, 97, 116, 101])], // "state" in ASCII
        new PublicKey(PROGRAM_ID)
      );
      
      console.log('State PDA:', statePDA.toString());
      
      // Try to fetch the state account using regular connection first
      const stateAccount = await this.connection.getAccountInfo(statePDA);
      
      if (!stateAccount) {
        console.log('State account does not exist - contract not initialized');
        return this.getDefaultState();
      }
      
      console.log('State account found, data length:', stateAccount.data.length);
      
      // Try to get enhanced account data from Helius
      try {
        const enhancedData = await this.getEnhancedAccountData(statePDA);
        console.log('Enhanced account data:', enhancedData);
      } catch (error) {
        console.log('Could not fetch enhanced data:', error.message);
      }
      
      // For now, return a simple state indicating the contract exists
      // In a real implementation, you'd parse the raw account data
      return {
        isInitialized: true,
        authority: this.wallet.publicKey.toString(),
        currentRound: 1,
        jackpotAmount: 0,
        totalEntries: 0,
        mainPoolBalance: 0,
        secondaryPoolBalance: 0,
        totalBurned: 0,
        totalLiquidityAdded: 0,
        totalTradingVolume: 0,
        lastSyncTime: Date.now()
      };
    } catch (error) {
      console.error('Error fetching state:', error);
      return this.getDefaultState();
    }
  }

  private getDefaultState() {
    return {
      isInitialized: false,
      authority: null,
      currentRound: 0,
      jackpotAmount: 0,
      totalEntries: 0,
      mainPoolBalance: 0,
      secondaryPoolBalance: 0,
      totalBurned: 0,
      totalLiquidityAdded: 0,
      totalTradingVolume: 0,
      lastSyncTime: 0
    };
  }

  // Enhanced data fetching methods using Helius
  private async getTransactionDetails(signature: string): Promise<any> {
    try {
      const response = await fetch(`${HELIUS_RPC_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: [
            signature,
            {
              encoding: 'json',
              maxSupportedTransactionVersion: 0
            }
          ]
        })
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      throw error;
    }
  }

  private async getEnhancedAccountData(accountAddress: PublicKey): Promise<any> {
    try {
      const response = await fetch(`${HELIUS_RPC_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAccountInfo',
          params: [
            accountAddress.toString(),
            {
              encoding: 'base64'
            }
          ]
        })
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error fetching enhanced account data:', error);
      throw error;
    }
  }

  async getUserState(userAddress: string): Promise<any> {
    try {
      // TODO: Implement actual contract call to fetch user state
      console.log(`Fetching user state for ${userAddress}...`);
      return {
        user: userAddress,
        entries: 0,
        totalContributed: 0
      };
    } catch (error) {
      console.error('Error fetching user state:', error);
      throw error;
    }
  }

  async getTransactionHistory(limit: number = 10): Promise<any[]> {
    try {
      console.log('Fetching transaction history using Helius...');
      
      const response = await fetch(`${HELIUS_RPC_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [
            new PublicKey(PROGRAM_ID).toString(),
            {
              limit: limit
            }
          ]
        })
      });

      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  async getAccountActivity(accountAddress: string): Promise<any[]> {
    try {
      console.log(`Fetching account activity for ${accountAddress} using Helius...`);
      
      const response = await fetch(`${HELIUS_RPC_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [
            accountAddress,
            {
              limit: 20
            }
          ]
        })
      });

      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('Error fetching account activity:', error);
      return [];
    }
  }
}

// Factory function to create contract instance
export function createSOFLOTTOContract(connection: Connection, wallet: any): SOFLOTTOContract {
  return new SOFLOTTOContractImpl(connection, wallet);
}
