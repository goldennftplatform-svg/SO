import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Wallet, DollarSign, TrendingUp, Droplets, Target, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@tarobase/js-sdk';
import { AuthContextType } from '@/components/types';
import { setLiquidityPools, runGetPoolSolBalanceQueryForLiquidityPools, runGetPoolTokenBalanceQueryForLiquidityPools, Token, Address, Time } from '@/lib/tarobase';
import { generateRandomId } from '@/lib/utils';
import { ADMIN_ADDRESS } from '@/lib/constants';
import { useTarobaseData } from '@/hooks/use-tarobase-data';
import { subscribeManyLiquidityPools } from '@/lib/tarobase';

interface LPDashboardProps {
  tokenData?: {
    price: number;
    marketCap: number;
    totalSupply: number;
    burnedTokens: number;
  };
}

interface LPPosition {
  id: string;
  poolType: 'game-owned' | 'donated';
  solAmount: number;
  tokenAmount: number;
  feesEarned: number;
  isActive: boolean;
  isRenounced?: boolean;
}

export function LPDashboard({ tokenData }: LPDashboardProps) {
  const { user } = useAuth() as AuthContextType;
  const [gameOwnedPool, setGameOwnedPool] = useState<LPPosition | null>(null);
  const [donatedPool, setDonatedPool] = useState<LPPosition | null>(null);
  const [isCreatingPools, setIsCreatingPools] = useState(false);
  const [totalLiquidity, setTotalLiquidity] = useState(0);
  const [gameOwnedFees, setGameOwnedFees] = useState(0);

  // Subscribe to LP pools data
  const { data: poolsData, loading: poolsLoading } = useTarobaseData<any[]>(
    subscribeManyLiquidityPools,
    true,
    "limit 10"
  );

  useEffect(() => {
    if (poolsData) {
      const gameOwned = poolsData.find(pool => pool.poolType === 'game-owned');
      const donated = poolsData.find(pool => pool.poolType === 'donated');
      
      if (gameOwned) {
        setGameOwnedPool({
          id: gameOwned.id || 'game-owned',
          poolType: 'game-owned',
          solAmount: (gameOwned.solBalance || 0) / Math.pow(10, 9),
          tokenAmount: (gameOwned.tokenBalance || 0) / Math.pow(10, 6),
          feesEarned: (gameOwned.feesCollected || 0) / Math.pow(10, 9),
          isActive: gameOwned.isActive || false
        });
        setGameOwnedFees((gameOwned.feesCollected || 0) / Math.pow(10, 9));
      }
      
      if (donated) {
        setDonatedPool({
          id: donated.id || 'donated',
          poolType: 'donated',
          solAmount: (donated.solBalance || 0) / Math.pow(10, 9),
          tokenAmount: (donated.tokenBalance || 0) / Math.pow(10, 6),
          feesEarned: 0,
          isActive: donated.isActive || false,
          isRenounced: true
        });
      }
      
      const totalSol = (gameOwned?.solBalance || 0) + (donated?.solBalance || 0);
      setTotalLiquidity(totalSol / Math.pow(10, 9));
    }
  }, [poolsData]);

  const handleCreateDualPools = async () => {
    if (!user) {
      toast.error('Please connect wallet');
      return;
    }

    setIsCreatingPools(true);
    try {
      // Create game-owned pool ($125 + 500M tokens)
      const gameOwnedId = generateRandomId();
      await setLiquidityPools(gameOwnedId, {
        poolType: 'game-owned',
        creatorAddress: Address.fromString(user.address),
        solBalance: Token.amount('SOL', 125),
        tokenBalance: Token.amount('other', 500000000),
        feesCollected: Token.amount('SOL', 0),
        isActive: true,
        createdAt: Time.Now
      });
      
      // Create donated pool ($125 + 500M tokens)
      const donatedId = generateRandomId();
      await setLiquidityPools(donatedId, {
        poolType: 'donated',
        creatorAddress: Address.fromString('11111111111111111111111111111111'),
        solBalance: Token.amount('SOL', 125),
        tokenBalance: Token.amount('other', 500000000),
        feesCollected: Token.amount('SOL', 0),
        isActive: true,
        isRenounced: true,
        createdAt: Time.Now
      });
      
      toast.success('Dual LP pools created successfully!');
    } catch (error) {
      console.error('Error creating dual pools:', error);
      toast.error('Failed to create dual LP pools');
    } finally {
      setIsCreatingPools(false);
    }
  };

  const isAdmin = user?.address === ADMIN_ADDRESS;

  if (!isAdmin) {
    return (
      <Card className="border-green-500/20 bg-black/40">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            LP Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-300/70">LP functionality is restricted to the protocol admin.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/20 bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-300">Total Liquidity</CardTitle>
            <Droplets className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{totalLiquidity.toFixed(2)} SOL</div>
            <p className="text-xs text-green-300/70">
              $250 across dual pools
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-300">Game-Owned Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{gameOwnedFees.toFixed(6)} SOL</div>
            <p className="text-xs text-green-300/70">
              Revenue from trading
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-300">Token Price</CardTitle>
            <Target className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">$0.00025</div>
            <p className="text-xs text-green-300/70">
              Initial launch price
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dual Pool Setup */}
      <Card className="border-green-500/20 bg-black/40">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Dual LP Pool Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-green-300/70 mb-4">
            Creates two pools: Game-owned ($125 + 500M SOF) for earnings, and Donated ($125 + 500M SOF) for permanent liquidity.
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-green-500/30 rounded-lg bg-green-900/10">
              <h4 className="font-medium text-green-300 mb-2">Game-Owned Pool</h4>
              <p className="text-sm text-green-300/70 mb-2">$125 SOL + 500M SOF</p>
              <Badge variant="outline" className="border-green-500 text-green-400">Earns Fees</Badge>
            </div>
            <div className="p-4 border border-green-500/30 rounded-lg bg-green-900/10">
              <h4 className="font-medium text-green-300 mb-2">Donated Pool</h4>
              <p className="text-sm text-green-300/70 mb-2">$125 SOL + 500M SOF</p>
              <Badge variant="secondary" className="border-green-500/50 text-green-300">Permanent Liquidity</Badge>
            </div>
          </div>
          
          <Button 
            onClick={handleCreateDualPools} 
            disabled={isCreatingPools || !user || (gameOwnedPool && donatedPool)}
            className="w-full bg-green-600 hover:bg-green-700 text-black font-bold"
          >
            {isCreatingPools ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating Dual Pools...
              </>
            ) : (gameOwnedPool && donatedPool) ? (
              'Dual Pools Already Created'
            ) : (
              'Create Dual LP Pools ($250 Total)'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Pool Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Game-Owned Pool */}
        <Card className="border-green-500/20 bg-black/40">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Game-Owned Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            {poolsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-green-400" />
              </div>
            ) : !gameOwnedPool ? (
              <div className="text-center py-8 text-green-300/70">
                Game-owned pool not created yet
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-green-400" />
                    <span className="font-medium text-green-300">Revenue Pool</span>
                  </div>
                  <Badge variant="default" className="bg-green-600 text-black">Earning Fees</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-300/70">SOL Liquidity</p>
                    <p className="font-medium text-green-400">{gameOwnedPool.solAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-green-300/70">SOF Tokens</p>
                    <p className="font-medium text-green-400">{(gameOwnedPool.tokenAmount / 1000000).toFixed(0)}M</p>
                  </div>
                  <div>
                    <p className="text-green-300/70">Fees Earned</p>
                    <p className="font-medium text-green-400">{gameOwnedPool.feesEarned.toFixed(6)} SOL</p>
                  </div>
                  <div>
                    <p className="text-green-300/70">Status</p>
                    <p className="font-medium text-green-400">Active</p>
                  </div>
                </div>
                
                <Separator className="bg-green-500/20" />
                <div className="text-xs text-green-300/70">
                  This pool earns SOL fees from all trading activity to fund jackpots.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donated Pool */}
        <Card className="border-green-500/20 bg-black/40">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Donated Pool
            </CardTitle>
          </CardHeader>
          <CardContent>
            {poolsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-green-400" />
              </div>
            ) : !donatedPool ? (
              <div className="text-center py-8 text-green-300/70">
                Donated pool not created yet
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-green-400" />
                    <span className="font-medium text-green-300">Permanent Liquidity</span>
                  </div>
                  <Badge variant="secondary" className="border-green-500/50 text-green-300">Renounced</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-300/70">SOL Liquidity</p>
                    <p className="font-medium text-green-400">{donatedPool.solAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-green-300/70">SOF Tokens</p>
                    <p className="font-medium text-green-400">{(donatedPool.tokenAmount / 1000000).toFixed(0)}M</p>
                  </div>
                  <div>
                    <p className="text-green-300/70">Ownership</p>
                    <p className="font-medium text-orange-400">Burned</p>
                  </div>
                  <div>
                    <p className="text-green-300/70">Status</p>
                    <p className="font-medium text-green-400">Permanent</p>
                  </div>
                </div>
                
                <Separator className="bg-green-500/20" />
                <div className="text-xs text-green-300/70">
                  This pool provides permanent price floor and cannot be rugged. LP tokens are burned.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}