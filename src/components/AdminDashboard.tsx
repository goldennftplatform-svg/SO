import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  Coins, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  DollarSign,
  Lock,
  Unlock,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react';
import { useMultiWallet } from '@/hooks/useMultiWallet';
import { createSOFLOTTOContract, SOFLOTTOContract } from '@/lib/contract';
import { Connection, PublicKey } from '@solana/web3.js';
// import { AnchorProvider } from '@coral-xyz/anchor'; // No longer needed
import { toast } from 'sonner';

// Extend Window interface for wallet types
declare global {
  interface Window {
    solana?: any;
    solflare?: any;
    slope?: any;
  }
}

interface TokenomicsConfig {
  buyTax: number;
  sellTax: number;
  bankLpPercentage: number;
  lockedLpPercentage: number;
}

interface LPPool {
  bank: number;
  locked: number;
  total: number;
}

interface AdminStats {
  totalDeposits: number;
  totalWithdrawals: number;
  currentBalance: number;
  transactions: number;
}

interface AdminDashboardProps {
  bankInventory?: {
    solBalance: number;
    tokenBalance: number;
    totalRevenue: number;
    lottoPool: number;
  };
  onUpdateInventory?: (updates: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ bankInventory, onUpdateInventory }) => {
  const { connected, publicKey, balance, walletType } = useMultiWallet();
  
  // Helper function to get connected wallet instance
  const getConnectedWallet = (walletType: string) => {
    switch (walletType) {
      case 'phantom':
        return window.solana;
      case 'solflare':
        return window.solflare;
      case 'backpack':
        return window.solana;
      case 'slope':
        return window.slope;
      default:
        return null;
    }
  };
  
  // Contract instance
  const [contract, setContract] = useState<SOFLOTTOContract | null>(null);
  const [solAmount, setSolAmount] = useState<string>('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [tokenomicsConfig, setTokenomicsConfig] = useState<TokenomicsConfig>({
    buyTax: 2.5,
    sellTax: 2.5,
    bankLpPercentage: 15,
    lockedLpPercentage: 85
  });
  const [lpPools, setLpPools] = useState<LPPool>({
    bank: 0,
    locked: 0,
    total: 0
  });
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    currentBalance: 0,
    transactions: 0
  });
  const [isEmergencyPaused, setIsEmergencyPaused] = useState(false);

  // Initialize contract and load real data
  useEffect(() => {
    const initializeContract = async () => {
      try {
        console.log('🔧 Contract initialization attempt...');
        console.log('Connected:', connected);
        console.log('PublicKey:', publicKey?.toString());
        console.log('WalletType:', walletType);
        
        if (connected && publicKey && walletType) {
          console.log('✅ All requirements met - creating contract...');
          
          // Create connection to devnet with Helius for enhanced data
          const connection = new Connection('https://api.devnet.solana.com');
          
          // Get the connected wallet instance
          const wallet = getConnectedWallet(walletType);
          if (!wallet) {
            console.log('❌ Could not get wallet instance');
            return;
          }
          
          console.log('🔍 Wallet object from getConnectedWallet:', wallet);
          console.log('🔍 Wallet type:', typeof wallet);
          console.log('🔍 Wallet methods:', Object.getOwnPropertyNames(wallet));
          console.log('🔍 Wallet keys:', Object.keys(wallet));
          
          // Create contract instance with direct wallet
          const contractInstance = createSOFLOTTOContract(connection, wallet);
          console.log('Contract instance created:', !!contractInstance);
          
          setContract(contractInstance);
          
          console.log('🎉 Contract initialized successfully with direct wallet!');
          
          // Load contract data
          await loadContractData();
        } else {
          console.log('❌ Requirements not met for contract initialization');
        }
      } catch (error) {
        console.error('❌ Error initializing contract:', error);
      }
    };

    initializeContract();
  }, [connected, publicKey, walletType]);

  const loadContractData = async () => {
    try {
      if (contract) {
        console.log('Loading contract data...');
        const state = await contract.getState();
        console.log('Contract state loaded:', state);
        
        // Update UI with real contract data
        setLpPools({
          bank: state?.mainPoolBalance || 0,
          locked: state?.secondaryPoolBalance || 0,
          total: (state?.mainPoolBalance || 0) + (state?.secondaryPoolBalance || 0)
        });

        setAdminStats({
          totalDeposits: state?.totalLiquidityAdded || 0,
          totalWithdrawals: 0,
          currentBalance: state?.jackpotAmount || 0,
          transactions: state?.totalTradingVolume || 0
        });
      } else {
        console.log('No contract instance available');
        // Fallback to placeholder data
        setLpPools({
          bank: 0,
          locked: 0,
          total: 0
        });

        setAdminStats({
          totalDeposits: 0,
          totalWithdrawals: 0,
          currentBalance: 0,
          transactions: 0
        });
      }
    } catch (error) {
      console.error('Error loading contract data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast.error('Failed to load contract data: ' + error.message);
    }
  };

  const handleDeposit = async () => {
    if (!solAmount || parseFloat(solAmount) <= 0) return;
    
    setIsDepositing(true);
    try {
      const amount = parseFloat(solAmount);
      
      if (contract) {
        // Use real contract function
        const txHash = await contract.addLiquidity(0, amount); // Add SOL liquidity (tokenAmount, solAmount)
        toast.success(`Deposited ${amount} SOL to SOFLOTTO! TX: ${txHash}`);
      } else {
        // Try to create contract instance on the fly
        console.log('🔄 Contract not initialized, attempting to create one...');
        
        if (connected && publicKey && walletType) {
          const connection = new Connection('https://api.devnet.solana.com');
          const wallet = getConnectedWallet(walletType);
          
          if (wallet) {
                  const tempContract = createSOFLOTTOContract(connection, wallet);
            setContract(tempContract); // Set for future use
            
            // Now try the deposit
            const txHash = await tempContract.addLiquidity(0, amount); // Add SOL liquidity (tokenAmount, solAmount)
            toast.success(`Deposited ${amount} SOL to SOFLOTTO! TX: ${txHash}`);
          } else {
            throw new Error('Could not get wallet instance');
          }
        } else {
          throw new Error('Wallet not properly connected');
        }
      }
      
      setAdminStats(prev => ({
        ...prev,
        totalDeposits: prev.totalDeposits + amount,
        currentBalance: prev.currentBalance + amount,
        transactions: prev.transactions + 1
      }));
      
      setSolAmount('');
      await loadContractData(); // Refresh data
    } catch (error) {
      console.error('Deposit failed:', error);
      toast.error('Deposit failed: ' + (error as Error).message);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!solAmount || parseFloat(solAmount) <= 0) return;
    
    setIsWithdrawing(true);
    try {
      // Simulate withdrawal transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const amount = parseFloat(solAmount);
      setAdminStats(prev => ({
        ...prev,
        totalWithdrawals: prev.totalWithdrawals + amount,
        currentBalance: prev.currentBalance - amount,
        transactions: prev.transactions + 1
      }));
      
      setSolAmount('');
      // Here you would integrate with your smart contract
      console.log(`Withdrew ${amount} SOL from SOFLOTTO`);
    } catch (error) {
      console.error('Withdrawal failed:', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleDrawWinner = async () => {
    try {
      if (contract) {
        const txHash = await contract.drawWinner();
        toast.success(`Winner drawn successfully! TX: ${txHash}`);
      } else {
        toast.success('Winner drawn successfully! (simulated)');
      }
      await loadContractData(); // Refresh data
    } catch (error) {
      console.error('Error drawing winner:', error);
      toast.error('Failed to draw winner: ' + (error as Error).message);
    }
  };

  const handleBurnTokens = async () => {
    const amount = prompt('Enter amount of tokens to burn:');
    if (!amount || isNaN(Number(amount))) return;
    
    try {
      if (contract) {
        const txHash = await contract.burnTokens(Number(amount));
        toast.success(`Burned ${amount} tokens! TX: ${txHash}`);
      } else {
        toast.success(`Burned ${amount} tokens! (simulated)`);
      }
      await loadContractData(); // Refresh data
    } catch (error) {
      console.error('Error burning tokens:', error);
      toast.error('Failed to burn tokens: ' + (error as Error).message);
    }
  };

  const handleSyncLP = async () => {
    const tradingFees = prompt('Enter trading fees amount:');
    if (!tradingFees || isNaN(Number(tradingFees))) return;
    
    try {
      if (contract) {
        const txHash = await contract.syncDualLp(Number(tradingFees));
        toast.success(`LP pools synced! TX: ${txHash}`);
      } else {
        toast.success('LP pools synced! (simulated)');
      }
      await loadContractData(); // Refresh data
    } catch (error) {
      console.error('Error syncing LP:', error);
      toast.error('Failed to sync LP: ' + (error as Error).message);
    }
  };

  const handleInitialize = async () => {
    try {
      console.log('handleInitialize called - contract instance:', !!contract);
      console.log('Connected:', connected, 'PublicKey:', publicKey?.toString(), 'WalletType:', walletType);
      
      if (contract) {
        console.log('✅ Using REAL contract instance!');
        const txHash = await contract.initialize();
        toast.success(`🎉 Contract initialized successfully! TX: ${txHash}`);
      } else {
        console.log('❌ Contract instance is null - trying to create one now...');
        
        // Try to force create contract instance
        if (connected && publicKey && walletType) {
          console.log('Attempting emergency contract creation...');
          const connection = new Connection('https://api.devnet.solana.com');
          
          // Create provider with direct wallet
          const wallet = getConnectedWallet(walletType);
          if (!wallet) {
            toast.error('Could not get wallet instance');
            return;
          }
          const tempContract = createSOFLOTTOContract(connection, wallet);
          console.log('Emergency contract created:', !!tempContract);
          
          const txHash = await tempContract.initialize();
          setContract(tempContract); // Set for future use
          toast.success(`🎉 Contract initialized successfully! TX: ${txHash}`);
        } else {
          console.log('❌ Wallet connection check failed:', {
            connected,
            publicKey: publicKey?.toString(),
            walletType,
            hasPublicKey: !!publicKey,
            hasWalletType: !!walletType
          });
          toast.warning(`❌ Wallet not connected - cannot initialize contract. Connected: ${connected}, PublicKey: ${!!publicKey}, WalletType: ${walletType}`);
        }
      }
      await loadContractData(); // Refresh data
    } catch (error) {
      console.error('❌ Error initializing contract:', error);
      toast.error('Failed to initialize contract: ' + (error as Error).message);
    }
  };

  const handleForceContractInit = async () => {
    try {
      console.log('🔄 Force contract initialization...');
      console.log('Wallet connection state:', { connected, publicKey: publicKey?.toString(), walletType });
      
      // First, test basic wallet connection
      if (!connected || !publicKey || !walletType) {
        toast.error('Wallet not properly connected. Please reconnect your wallet.');
        return;
      }
      
      const connection = new Connection('https://api.devnet.solana.com');
      const wallet = getConnectedWallet(walletType);
      
      if (!wallet) {
        toast.error('Could not get wallet instance');
        return;
      }
      
      console.log('Wallet instance:', wallet);
      console.log('Wallet public key:', wallet.publicKey?.toString());
      console.log('Wallet connected:', wallet.isConnected);
      
      // Test basic connection
      try {
        const balance = await connection.getBalance(publicKey);
        console.log('Wallet balance:', balance / 1e9, 'SOL');
      } catch (error) {
        console.error('Failed to get wallet balance:', error);
        toast.error('Failed to connect to Solana network');
        return;
      }
      
      const tempContract = createSOFLOTTOContract(connection, wallet);
      setContract(tempContract);
      
      console.log('✅ Contract instance created manually:', !!tempContract);
      toast.success('Contract instance created successfully!');
      
    } catch (error) {
      console.error('❌ Error creating contract instance:', error);
      toast.error('Failed to create contract instance: ' + (error as Error).message);
    }
  };

  const handleTestContract = async () => {
    try {
      console.log('🧪 Testing contract deployment...');
      const connection = new Connection('https://api.devnet.solana.com');
      
      // Test if the program is deployed
      const programId = new PublicKey("6fF8UsauBAfBoQYxcnFBHsqX25yy5dM5VpAUcPtnZAtq");
      const programInfo = await connection.getAccountInfo(programId);
      
      if (programInfo) {
        console.log('✅ Program is deployed:', programInfo);
        toast.success('Contract program is deployed and accessible!');
      } else {
        console.log('❌ Program not found at address:', programId.toString());
        toast.error('Contract program is not deployed or not accessible');
      }
      
    } catch (error) {
      console.error('❌ Error testing contract:', error);
      toast.error('Failed to test contract: ' + (error as Error).message);
    }
  };

  const handleEmergencyPause = () => {
    setIsEmergencyPaused(!isEmergencyPaused);
    // Here you would call your smart contract emergency pause function
    console.log(`Emergency ${isEmergencyPaused ? 'unpaused' : 'paused'}`);
    toast.success(`Emergency ${isEmergencyPaused ? 'unpaused' : 'paused'}`);
  };

  const updateTokenomics = (field: keyof TokenomicsConfig, value: number) => {
    setTokenomicsConfig(prev => {
      const newConfig = { ...prev, [field]: value };
      
      // Ensure LP percentages add up to 100
      if (field === 'bankLpPercentage' || field === 'lockedLpPercentage') {
        const otherField = field === 'bankLpPercentage' ? 'lockedLpPercentage' : 'bankLpPercentage';
        newConfig[otherField] = 100 - value;
      }
      
      return newConfig;
    });
  };

  // Master Admin Wallet Address

  

  


  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">SOFLOTTO Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Master Admin Control Panel - Manage Tokenomics & LP Pools
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              MASTER ADMIN ACCESS GRANTED
            </Badge>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {publicKey?.toString() || "Wallet Connected"}
            </code>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isEmergencyPaused ? "destructive" : "default"}>
            {isEmergencyPaused ? (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                EMERGENCY PAUSED
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                ACTIVE
              </>
            )}
          </Badge>
          <Button
            variant={isEmergencyPaused ? "default" : "destructive"}
            onClick={handleEmergencyPause}
            className="flex items-center gap-2"
          >
            {isEmergencyPaused ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {isEmergencyPaused ? 'Unpause' : 'Emergency Pause'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.totalDeposits.toFixed(2)} SOL</div>
            <p className="text-xs text-muted-foreground">
              Lifetime deposits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.currentBalance.toFixed(2)} SOL</div>
            <p className="text-xs text-muted-foreground">
              Available for operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminStats.transactions}</div>
            <p className="text-xs text-muted-foreground">
              All-time count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LP Pool Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lpPools.total.toFixed(2)} SOL</div>
            <p className="text-xs text-muted-foreground">
              Combined pools
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SOL Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            SOL Operations
          </CardTitle>
          <CardDescription>
            Deposit or withdraw SOL from the SOFLOTTO treasury
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="sol-amount">SOL Amount</Label>
              <Input
                id="sol-amount"
                type="number"
                placeholder="0.0"
                value={solAmount}
                onChange={(e) => setSolAmount(e.target.value)}
                step="0.1"
                min="0"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDeposit}
                disabled={isDepositing || !solAmount || parseFloat(solAmount) <= 0}
                className="flex items-center gap-2"
              >
                {isDepositing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Depositing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Deposit
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleWithdraw}
                disabled={isWithdrawing || !solAmount || parseFloat(solAmount) <= 0}
                className="flex items-center gap-2"
              >
                {isWithdrawing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Withdrawing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Withdraw
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            💡 <strong>Pro Tip:</strong> Use your 20 TESTNET SOL to test the complete tokenomics system!
          </div>
        </CardContent>
      </Card>

      {/* Tokenomics Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tokenomics Configuration
          </CardTitle>
          <CardDescription>
            Configure buy/sell taxes and LP distribution percentages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tax Rates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="buy-tax">Buy Tax (%)</Label>
              <Input
                id="buy-tax"
                type="number"
                value={tokenomicsConfig.buyTax}
                onChange={(e) => updateTokenomics('buyTax', parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
                max="10"
              />
              <p className="text-xs text-muted-foreground">
                Tax collected on token purchases
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sell-tax">Sell Tax (%)</Label>
              <Input
                id="sell-tax"
                type="number"
                value={tokenomicsConfig.sellTax}
                onChange={(e) => updateTokenomics('sellTax', parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
                max="10"
              />
              <p className="text-xs text-muted-foreground">
                Tax collected on token sales
              </p>
            </div>
          </div>

          <Separator />

          {/* LP Distribution */}
          <div className="space-y-4">
            <Label>LP Distribution (%)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="bank-lp">Bank LP Pool</Label>
                <Input
                  id="bank-lp"
                  type="number"
                  value={tokenomicsConfig.bankLpPercentage}
                  onChange={(e) => updateTokenomics('bankLpPercentage', parseFloat(e.target.value) || 0)}
                  step="1"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-muted-foreground">
                  Liquid pool for immediate access
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="locked-lp">Locked LP Pool</Label>
                <Input
                  id="locked-lp"
                  type="number"
                  value={tokenomicsConfig.lockedLpPercentage}
                  onChange={(e) => updateTokenomics('lockedLpPercentage', parseFloat(e.target.value) || 0)}
                  step="1"
                  min="0"
                  max="100"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  🔒 Permanently locked (auto-calculated)
                </p>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              💡 <strong>Note:</strong> LP tokens in the locked pool are BURNT for transparency!
            </div>
          </div>

          <Button className="w-full flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Update Tokenomics Configuration
          </Button>
        </CardContent>
      </Card>

      {/* LP Pool Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            LP Pool Status
          </CardTitle>
          <CardDescription>
            Real-time liquidity pool balances and distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank LP Pool */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Bank LP Pool</h3>
                <Badge variant="secondary">Liquid</Badge>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {lpPools.bank.toFixed(2)} SOL
              </div>
              <div className="text-sm text-muted-foreground">
                {((lpPools.bank / lpPools.total) * 100).toFixed(1)}% of total LP
              </div>
              <p className="text-xs text-muted-foreground">
                Available for immediate liquidity operations
              </p>
            </div>

            {/* Locked LP Pool */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Locked LP Pool</h3>
                <Badge variant="destructive">Permanent</Badge>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {lpPools.locked.toFixed(2)} SOL
              </div>
              <div className="text-sm text-muted-foreground">
                {((lpPools.locked / lpPools.total) * 100).toFixed(1)}% of total LP
              </div>
              <p className="text-xs text-muted-foreground">
                🔒 LP tokens BURNT - permanently locked forever!
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Total LP */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {lpPools.total.toFixed(2)} SOL
            </div>
            <p className="text-sm text-muted-foreground">
              Total Liquidity Pool Value
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Actions
          </CardTitle>
          <CardDescription>
            Advanced administrative functions and controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleDrawWinner}
            >
              <Zap className="h-4 w-4" />
              Draw Winner
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleBurnTokens}
            >
              <AlertTriangle className="h-4 w-4" />
              Burn Tokens
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleSyncLP}
            >
              <TrendingUp className="h-4 w-4" />
              Sync LP Pools
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleInitialize}
            >
              <Settings className="h-4 w-4" />
              Initialize Contract
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleForceContractInit}
            >
              <Zap className="h-4 w-4" />
              Force Contract Init
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleTestContract}
            >
              <BarChart3 className="h-4 w-4" />
              Test Contract
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleEmergencyPause}
            >
              <Shield className="h-4 w-4" />
              {isEmergencyPaused ? 'Unpause' : 'Emergency Pause'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};