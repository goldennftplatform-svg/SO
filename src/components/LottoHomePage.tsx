import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@tarobase/js-sdk';
import { AuthContextType } from '@/components/types';
import { TokenTrading } from '@/components/TokenTrading';
import { JackpotDisplay } from '@/components/JackpotDisplay';
import { BondingCurveChart } from '@/components/BondingCurveChart';
import { LottoEntry } from '@/components/LottoEntry';

import { CoinBanner } from '@/components/CoinBanner';
import { BurnStats } from '@/components/BurnStats';
import { LiquidityFeesDisplay } from '@/components/LiquidityFeesDisplay';
import { LPDashboard } from '@/components/LPDashboard';
import { DrawingInterface } from '@/components/DrawingInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, Flame, Trophy, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ADMIN_ADDRESS } from '@/lib/constants';
import { useTarobaseData } from '@/hooks/use-tarobase-data';
import { 
  subscribeManyTokens, 
  subscribeManyJackpots,
  runGetTotalSupplyQueryForTokens,
  runGetBurnedTokensQueryForTokens,
  runGetUserTokenBalanceQueryForTokens,
  getTokenPrice
} from '@/lib/tarobase';
import { toast } from 'sonner';

interface TokenData {
  price: number;
  marketCap: number;
  totalSupply: number;
  burnedTokens: number;
  volume24h: number;
  lottoEnabled: boolean;
  userBalance: number;
}

const staggerContainer = { 
  hidden: { opacity: 0 }, 
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } } 
};

const fadeIn = { 
  hidden: { opacity: 0, y: 20 }, 
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } 
};

export const LottoHomePage: React.FC = () => {
  const { user } = useAuth() as AuthContextType;
  
  const [tokenData, setTokenData] = useState<TokenData>({
    price: 0.000045,
    marketCap: 450000,
    totalSupply: 1000000000,
    burnedTokens: 0,
    volume24h: 0,
    lottoEnabled: false,
    userBalance: 0
  });

  const [bankInventory, setBankInventory] = useState({
    solBalance: 0,
    tokenBalance: 0,
    totalRevenue: 0,
    lottoPool: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to SOF token data
  const { data: tokens, loading: tokensLoading } = useTarobaseData(
    subscribeManyTokens, 
    true, 
    "limit 1"
  );

  // Subscribe to jackpots data
  const { data: jackpots, loading: jackpotsLoading } = useTarobaseData(
    subscribeManyJackpots,
    true,
    "limit 1 order by tarobase_created_at desc"
  );

  // Load token data when available
  useEffect(() => {
    const loadTokenData = async () => {
      if (!tokens || tokens.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const token = tokens[0];
        
        // Get token supply and burned amount
        const totalSupply = await runGetTotalSupplyQueryForTokens('sof');
        const burnedTokens = await runGetBurnedTokensQueryForTokens('sof');
        
        // Get user balance if authenticated
        let userBalance = 0;
        if (user?.address) {
          try {
            userBalance = await runGetUserTokenBalanceQueryForTokens('sof');
          } catch (err) {
            console.log('User balance not available:', err);
          }
        }

        // Get token price from Uniblock (if available)
        let price = 0.000045; // Default price
        try {
          // This would need the actual token mint address
          // const priceData = await getTokenPrice({ contractAddress: tokenMintAddress });
          // price = parseFloat(priceData.usdPrice);
        } catch (err) {
          console.log('Price data not available, using default');
        }

        // Convert from raw token amounts (6 decimals)
        const totalSupplyFormatted = totalSupply / Math.pow(10, 6);
        const burnedTokensFormatted = burnedTokens / Math.pow(10, 6);
        const userBalanceFormatted = userBalance / Math.pow(10, 6);
        
        const marketCap = price * totalSupplyFormatted;
        const lottoEnabled = marketCap >= 100000; // Enable lotto at $100k MC

        setTokenData({
          price,
          marketCap,
          totalSupply: totalSupplyFormatted,
          burnedTokens: burnedTokensFormatted,
          volume24h: 125000, // This would come from tracking transfers
          lottoEnabled,
          userBalance: userBalanceFormatted
        });

        setLoading(false);
      } catch (err) {
        console.error('Error loading token data:', err);
        setError('Failed to load token data');
        setLoading(false);
      }
    };

    if (!tokensLoading) {
      loadTokenData();
    }
  }, [tokens, tokensLoading, user?.address]);

  // Update jackpot data
  useEffect(() => {
    if (jackpots && jackpots.length > 0) {
      const currentJackpot = jackpots[0];
      // Convert lamports to SOL (9 decimals)
      const jackpotSol = currentJackpot.potLamports / Math.pow(10, 9);
      
      setBankInventory(prev => ({
        ...prev,
        lottoPool: jackpotSol * 180 // Approximate SOL to USD
      }));
    }
  }, [jackpots]);

  // Calculate current jackpot tier based on market cap
  const getJackpotTier = (mc: number) => {
    if (mc >= 1000000000) return { tier: '1B MC', jackpot: 420000 };
    if (mc >= 500000000) return { tier: '500M MC', jackpot: 250000 };
    if (mc >= 100000000) return { tier: '100M MC', jackpot: 100000 };
    if (mc >= 10000000) return { tier: '10M MC', jackpot: 50000 };
    if (mc >= 5000000) return { tier: '5M MC', jackpot: 25000 };
    if (mc >= 1000000) return { tier: '1M MC', jackpot: 10000 };
    if (mc >= 500000) return { tier: '500K MC', jackpot: 5000 };
    if (mc >= 100000) return { tier: '100K MC', jackpot: 1000 };
    return { tier: 'Pre-Launch', jackpot: 0 };
  };

  const currentTier = getJackpotTier(tokenData.marketCap);

  const handleTrade = async (type: 'buy' | 'sell', amount: number, solAmount: number) => {
    // Update local state for immediate UI feedback
    const burnAmount = amount * 0.0005; // 0.05% burn
    const newBurnedTokens = tokenData.burnedTokens + burnAmount;
    const newTotalSupply = tokenData.totalSupply - burnAmount;
    
    // Simulate price impact
    const priceImpact = type === 'buy' ? 0.02 : -0.015;
    const newPrice = tokenData.price * (1 + priceImpact);
    const newMarketCap = newPrice * newTotalSupply;
    
    // Update user balance
    const userBalanceChange = type === 'buy' ? amount : -amount;
    
    setTokenData(prev => ({
      ...prev,
      price: newPrice,
      marketCap: newMarketCap,
      totalSupply: newTotalSupply,
      burnedTokens: newBurnedTokens,
      volume24h: prev.volume24h + solAmount,
      userBalance: prev.userBalance + userBalanceChange
    }));

    // Update bank inventory
    if (type === 'buy') {
      setBankInventory(prev => ({
        ...prev,
        solBalance: prev.solBalance + solAmount,
        tokenBalance: prev.tokenBalance - amount,
        totalRevenue: prev.totalRevenue + (solAmount * 0.05), // 5% tax
        lottoPool: prev.lottoPool + (solAmount * 0.95 * 0.95) // 95% of tax to lotto
      }));
    } else {
      setBankInventory(prev => ({
        ...prev,
        solBalance: prev.solBalance - solAmount,
        tokenBalance: prev.tokenBalance + amount,
        totalRevenue: prev.totalRevenue + (solAmount * 0.05),
        lottoPool: prev.lottoPool + (solAmount * 0.95 * 0.95)
      }));
    }

    // Refresh real data after trade
    try {
      if (user?.address) {
        const newUserBalance = await runGetUserTokenBalanceQueryForTokens('sof');
        const newUserBalanceFormatted = newUserBalance / Math.pow(10, 6);
        
        setTokenData(prev => ({
          ...prev,
          userBalance: newUserBalanceFormatted
        }));
      }
    } catch (error) {
      console.error('Error refreshing user balance:', error);
    }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={staggerContainer}
      className="container mx-auto px-4 py-8 space-y-8"
    >
      {/* Header Section */}
      <motion.div variants={fadeIn} className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 via-green-500 to-green-300 bg-clip-text text-transparent terminal-glow font-mono">
          [ANON_PROTOCOL]
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4 font-mono">
          Anonymous SOF token protocol. Hold tokens, win rewards. Stay anon.
        </p>
        
        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8 px-4 md:px-0">
          <Card className="floating-card">
            <CardContent className="p-3 md:p-4 text-center">
              <Coins className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-lg md:text-2xl font-bold font-mono">${tokenData.price.toFixed(8)}</div>
              <div className="text-xs md:text-sm text-muted-foreground font-mono">SOF_PRICE</div>
            </CardContent>
          </Card>
          
          <Card className="floating-card">
            <CardContent className="p-3 md:p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-400" />
              <div className="text-lg md:text-2xl font-bold font-mono">${(tokenData.marketCap / 1000).toFixed(0)}K</div>
              <div className="text-xs md:text-sm text-muted-foreground font-mono">MARKET_CAP</div>
            </CardContent>
          </Card>
          
          <Card className="floating-card">
            <CardContent className="p-3 md:p-4 text-center">
              <Flame className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <div className="text-lg md:text-2xl font-bold font-mono">{(tokenData.burnedTokens / 1000000).toFixed(1)}M</div>
              <div className="text-xs md:text-sm text-muted-foreground font-mono">SOF_BURNED</div>
            </CardContent>
          </Card>
          
          <Card className="floating-card">
            <CardContent className="p-3 md:p-4 text-center">
              <Trophy className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-green-500" />
              <div className="text-lg md:text-2xl font-bold font-mono">${currentTier.jackpot.toLocaleString()}</div>
              <div className="text-xs md:text-sm text-muted-foreground font-mono">REWARD_POOL</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Lotto Status & Admin Link */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <Badge variant={tokenData.lottoEnabled ? "default" : "secondary"} className="text-lg px-4 py-2 terminal-glow font-mono">
            {tokenData.lottoEnabled ? "PROTOCOL_ACTIVE" : "PROTOCOL_LOCKED"}
          </Badge>
          
          {user?.address === ADMIN_ADDRESS && (
            <Link to="/admin">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Admin Dashboard
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Sexy 8-bit Coin Banner */}
      <motion.div variants={fadeIn} className="mb-8">
        <CoinBanner />
      </motion.div>

      {/* Sexy 8-bit Lottery Entry */}
      {tokenData.lottoEnabled && user && (
        <motion.div variants={fadeIn} className="mb-8">
          <LottoEntry 
            jackpotAmount={currentTier.jackpot}
            userAddress={user.address}
            tokenPrice={tokenData.price}
            userBalance={tokenData.userBalance}
          />
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 px-4 lg:px-0">
        {/* Left Column */}
        <div className="space-y-4 md:space-y-6">
          <motion.div variants={fadeIn} className="floating-card">
            <TokenTrading 
              tokenData={tokenData}
              onTrade={handleTrade}
            />
          </motion.div>
          
          <motion.div variants={fadeIn} className="floating-card">
            <BurnStats 
              burnedTokens={tokenData.burnedTokens}
              totalSupply={tokenData.totalSupply}
              originalSupply={1000000000}
            />
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 md:space-y-6">
          <motion.div variants={fadeIn} className="floating-card">
            <JackpotDisplay 
              currentTier={currentTier}
              marketCap={tokenData.marketCap}
              lottoEnabled={tokenData.lottoEnabled}
            />
          </motion.div>
          
          {tokenData.lottoEnabled && user && (
            <motion.div variants={fadeIn} className="floating-card">
              <LottoEntry 
                jackpotAmount={currentTier.jackpot}
                userAddress={user.address}
                tokenPrice={tokenData.price}
                userBalance={tokenData.userBalance}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Liquidity & Fees Dashboard */}
      <motion.div variants={fadeIn} className="floating-card">
        <LiquidityFeesDisplay 
          volume24h={tokenData.volume24h}
          totalRevenue={bankInventory.totalRevenue}
          lottoPool={bankInventory.lottoPool}
          burnedTokens={tokenData.burnedTokens}
        />
      </motion.div>

      {/* LP Dashboard for Admin */}
      {user?.address === ADMIN_ADDRESS && (
        <motion.div variants={fadeIn} className="floating-card">
          <LPDashboard tokenData={tokenData} />
        </motion.div>
      )}

      {/* Drawing Interface */}
      <motion.div variants={fadeIn} className="floating-card">
        <DrawingInterface isAdmin={false} />
      </motion.div>
      
      {/* Bonding Curve Chart */}
      <motion.div variants={fadeIn} className="floating-card">
        <BondingCurveChart 
          currentPrice={tokenData.price}
          currentSupply={tokenData.totalSupply}
          volume24h={tokenData.volume24h}
        />
      </motion.div>
    </motion.div>
  );
};

export default LottoHomePage;