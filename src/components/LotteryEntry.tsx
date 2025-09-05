import React, { useState } from 'react';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { createSOFLOTTOContract, SOFLOTTOContract } from '@/lib/contract';
import { Connection } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { toast } from 'sonner';
import { 
  Ticket, 
  Coins, 
  Zap, 
  Star,
  DollarSign,
  TrendingUp
} from 'lucide-react';

interface LotteryEntryProps {
  onEntrySuccess?: () => void;
}

export const LotteryEntry: React.FC<LotteryEntryProps> = ({ onEntrySuccess }) => {
  const { connected, publicKey, wallet } = usePrivyWallet();
  const [contract, setContract] = useState<SOFLOTTOContract | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(1);
  const [solPrice, setSolPrice] = useState<number>(0);
  const [sofPrice, setSofPrice] = useState<number>(0);

  // Entry tiers with 8-bit styling
  const entryTiers = [
    { tier: 1, entries: 1, price: 20, color: 'bg-green-500', icon: Star },
    { tier: 2, entries: 2, price: 100, color: 'bg-blue-500', icon: Coins },
    { tier: 4, entries: 4, price: 500, color: 'bg-purple-500', icon: Zap },
    { tier: 8, entries: 8, price: 1000, color: 'bg-red-500', icon: Ticket },
  ];

  // Initialize contract
  React.useEffect(() => {
    if (connected && publicKey && wallet) {
      const connection = new Connection('https://api.devnet.solana.com');
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: 'confirmed',
      });
      const contractInstance = createSOFLOTTOContract(connection, provider);
      setContract(contractInstance);
    }
  }, [connected, publicKey, wallet]);

  // Fetch live prices (you can integrate with Helius API here)
  React.useEffect(() => {
    const fetchPrices = async () => {
      try {
        // TODO: Replace with actual Helius API call
        // For now, using mock data
        setSolPrice(200); // $200 per SOL
        setSofPrice(0.0002); // $0.0002 per SOF token
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleEntry = async (tier: number) => {
    if (!contract) {
      toast.error('❌ Contract not initialized');
      return;
    }

    if (!connected) {
      toast.error('❌ Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const txHash = await contract.enterLottery(tier);
      toast.success(`🎉 Lottery entry successful! TX: ${txHash}`);
      onEntrySuccess?.();
    } catch (error) {
      console.error('Error entering lottery:', error);
      toast.error('❌ Failed to enter lottery');
    } finally {
      setLoading(false);
    }
  };

  const calculateTokenAmount = (usdPrice: number) => {
    if (sofPrice === 0) return 0;
    return Math.floor((usdPrice / sofPrice) * 1e6); // Convert to 6 decimals
  };

  if (!connected) {
    return (
      <div className="text-center py-8">
        <div className="inline-block p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg">
          <Ticket className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-yellow-800 font-bold">Connect your wallet to enter the lottery!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 8-bit Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 font-mono tracking-wider">
          🎰 SOFLOTTO ENTRY 🎰
        </h1>
        <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 p-1 rounded-lg">
          <div className="bg-black px-6 py-2 rounded">
            <p className="text-white font-mono text-sm">
              LIVE PRICES: SOL ${solPrice.toFixed(2)} | SOF ${sofPrice.toFixed(6)}
            </p>
          </div>
        </div>
      </div>

      {/* Entry Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {entryTiers.map((tier) => {
          const IconComponent = tier.icon;
          const tokenAmount = calculateTokenAmount(tier.price);
          
          return (
            <div
              key={tier.tier}
              className={`${tier.color} border-4 border-white rounded-lg p-6 text-center cursor-pointer transform hover:scale-105 transition-all duration-200 shadow-2xl`}
              onClick={() => setSelectedTier(tier.tier)}
            >
              <div className="bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <IconComponent className="w-8 h-8 text-gray-800" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2 font-mono">
                {tier.entries} ENTRY{tier.entries > 1 ? 'S' : ''}
              </h3>
              
              <div className="bg-black bg-opacity-30 rounded-lg p-3 mb-3">
                <p className="text-white text-lg font-bold">${tier.price}</p>
                <p className="text-white text-sm opacity-90">
                  {tokenAmount.toLocaleString()} SOF
                </p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEntry(tier.tier);
                }}
                disabled={loading}
                className="bg-white text-gray-800 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              >
                {loading ? 'ENTERING...' : 'ENTER NOW'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected Tier Info */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 border-4 border-white rounded-lg p-6 text-center">
        <h3 className="text-2xl font-bold text-white mb-4 font-mono">
          SELECTED: {selectedTier} ENTRY{selectedTier > 1 ? 'S' : ''}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold">${entryTiers.find(t => t.tier === selectedTier)?.price}</p>
            <p className="text-sm opacity-90">Entry Cost</p>
          </div>
          
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <Coins className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <p className="text-2xl font-bold">
              {calculateTokenAmount(entryTiers.find(t => t.tier === selectedTier)?.price || 0).toLocaleString()}
            </p>
            <p className="text-sm opacity-90">SOF Tokens</p>
          </div>
          
          <div className="bg-black bg-opacity-30 rounded-lg p-4">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <p className="text-2xl font-bold">{selectedTier}x</p>
            <p className="text-sm opacity-90">Win Multiplier</p>
          </div>
        </div>
      </div>

      {/* 8-bit Footer */}
      <div className="text-center mt-8">
        <div className="inline-block bg-black border-2 border-white rounded-lg p-4">
          <p className="text-white font-mono text-sm">
            🎮 ENTER THE GAME OF FORTUNE 🎮
          </p>
        </div>
      </div>
    </div>
  );
};
