import React, { useState, useEffect } from 'react';
import { useMultiWallet } from '@/hooks/useMultiWallet';
import { createSOFLOTTOContract, SOFLOTTOContract } from '@/lib/contract';
import { Connection } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { toast } from 'sonner';
import { 
  Coins, 
  TrendingUp, 
  Zap, 
  Star,
  DollarSign,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';

export const CoinBanner: React.FC = () => {
  const { connected, publicKey, walletType } = useMultiWallet();
  const [contract, setContract] = useState<SOFLOTTOContract | null>(null);
  const [loading, setLoading] = useState(false);
  const [solAmount, setSolAmount] = useState<string>('0.1');
  const [solPrice, setSolPrice] = useState<number>(200);
  const [sofPrice, setSofPrice] = useState<number>(0.0002);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initialize contract
  useEffect(() => {
    if (connected && publicKey && walletType) {
      const connection = new Connection('https://api.devnet.solana.com');
      
      // Get the connected wallet instance
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
      
      const wallet = getConnectedWallet(walletType);
      if (wallet) {
        const provider = new AnchorProvider(connection, wallet as any, {
          commitment: 'confirmed',
        });
        const contractInstance = createSOFLOTTOContract(connection, provider);
        setContract(contractInstance);
      }
    }
  }, [connected, publicKey, walletType]);

  // Fetch live prices (you can integrate with Helius API here)
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // TODO: Replace with actual Helius API call
        // For now, using mock data with some randomness
        const newSolPrice = 200 + (Math.random() - 0.5) * 20; // $190-$210
        const newSofPrice = 0.0002 + (Math.random() - 0.5) * 0.0001; // $0.00015-$0.00025
        
        setPriceChange(((newSofPrice - sofPrice) / sofPrice) * 100);
        setSolPrice(newSolPrice);
        setSofPrice(newSofPrice);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, [sofPrice]);

  const handleBuyTokens = async () => {
    if (!contract) {
      toast.error('❌ Contract not initialized');
      return;
    }

    if (!connected) {
      toast.error('❌ Please connect your wallet first');
      return;
    }

    const solValue = parseFloat(solAmount);
    if (isNaN(solValue) || solValue <= 0) {
      toast.error('❌ Please enter a valid SOL amount');
      return;
    }

    setLoading(true);
    try {
      const txHash = await contract.buyTokens(solValue);
      toast.success(`🎉 Tokens purchased successfully! TX: ${txHash}`);
    } catch (error) {
      console.error('Error buying tokens:', error);
      toast.error('❌ Failed to purchase tokens');
    } finally {
      setLoading(false);
    }
  };

  const calculateTokenAmount = (solAmount: number) => {
    if (solPrice === 0 || sofPrice === 0) return 0;
    const usdValue = solAmount * solPrice;
    return Math.floor((usdValue / sofPrice) * 1e6); // Convert to 6 decimals
  };

  const formatPrice = (price: number, decimals: number = 6) => {
    return price.toFixed(decimals);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  return (
    <div className="w-full bg-gradient-to-r from-purple-900 via-blue-900 to-green-900 border-4 border-white rounded-lg p-6 mb-8">
      {/* 8-bit Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white mb-2 font-mono tracking-wider">
          🪙 BUY SOF TOKENS 🪙
        </h2>
        <div className="inline-block bg-black border-2 border-white rounded-lg p-2">
          <p className="text-white font-mono text-sm">
            LAST UPDATE: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Live Price Ticker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* SOL Price */}
        <div className="bg-black bg-opacity-50 border-2 border-white rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Coins className="w-6 h-6 text-yellow-400 mr-2" />
            <span className="text-white font-mono text-sm">SOL PRICE</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400 font-mono">
            ${formatPrice(solPrice, 2)}
          </p>
        </div>

        {/* SOF Price */}
        <div className="bg-black bg-opacity-50 border-2 border-white rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Star className="w-6 h-6 text-green-400 mr-2" />
            <span className="text-white font-mono text-sm">SOF PRICE</span>
          </div>
          <p className="text-2xl font-bold text-green-400 font-mono">
            ${formatPrice(sofPrice, 6)}
          </p>
          <div className="flex items-center justify-center mt-1">
            {priceChange > 0 ? (
              <ArrowUp className="w-4 h-4 text-green-400 mr-1" />
            ) : (
              <ArrowDown className="w-4 h-4 text-red-400 mr-1" />
            )}
            <span className={`text-sm font-mono ${priceChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {Math.abs(priceChange).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Exchange Rate */}
        <div className="bg-black bg-opacity-50 border-2 border-white rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-6 h-6 text-blue-400 mr-2" />
            <span className="text-white font-mono text-sm">1 SOL =</span>
          </div>
          <p className="text-xl font-bold text-blue-400 font-mono">
            {formatNumber(calculateTokenAmount(1))} SOF
          </p>
        </div>
      </div>

      {/* Buy Interface */}
      <div className="bg-black bg-opacity-30 border-2 border-white rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div>
            <label className="block text-white font-mono text-sm mb-2">
              SOL AMOUNT TO SPEND
            </label>
            <div className="relative">
              <input
                type="number"
                value={solAmount}
                onChange={(e) => setSolAmount(e.target.value)}
                step="0.01"
                min="0.01"
                className="w-full bg-white text-black px-4 py-3 rounded-lg font-mono text-lg border-2 border-white focus:border-yellow-400 focus:outline-none"
                placeholder="0.1"
              />
              <div className="absolute right-3 top-3 text-gray-500 font-mono">
                SOL
              </div>
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[0.1, 0.5, 1, 2].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setSolAmount(amount.toString())}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-mono text-sm transition-colors"
                >
                  {amount} SOL
                </button>
              ))}
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-gradient-to-br from-green-600 to-blue-600 border-2 border-white rounded-lg p-4">
            <h3 className="text-white font-mono text-lg mb-3 text-center">
              YOU WILL RECEIVE
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white font-mono">USD Value:</span>
                <span className="text-white font-bold font-mono">
                  ${(parseFloat(solAmount) * solPrice).toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-white font-mono">SOF Tokens:</span>
                <span className="text-white font-bold font-mono">
                  {formatNumber(calculateTokenAmount(parseFloat(solAmount)))}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-white font-mono">Lottery Entries:</span>
                <span className="text-white font-bold font-mono">
                  {Math.floor((parseFloat(solAmount) * solPrice) / 20)}x
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Buy Button */}
        <div className="text-center mt-6">
          <button
            onClick={handleBuyTokens}
            disabled={loading || !connected}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black px-8 py-4 rounded-lg font-bold text-xl font-mono border-4 border-white transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center">
                <RefreshCw className="w-6 h-6 mr-2 animate-spin" />
                PROCESSING...
              </div>
            ) : (
              '🚀 BUY SOF TOKENS NOW! 🚀'
            )}
          </button>
        </div>
      </div>

      {/* 8-bit Footer */}
      <div className="text-center mt-6">
        <div className="inline-block bg-black border-2 border-white rounded-lg p-3">
          <p className="text-white font-mono text-sm">
            💎 DIAMOND HANDS ONLY 💎
          </p>
        </div>
      </div>
    </div>
  );
};
