import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Wallet, Clock, Users, TrendingUp, Target, Star } from 'lucide-react';
import { toast } from 'sonner';
import { runGetUserTokenBalanceQueryForTokens } from '@/lib/tarobase';

interface LottoEntryProps {
  jackpotAmount: number;
  userAddress: string;
  tokenPrice: number;
  userBalance?: number;
}

// Real contract data structure
interface LottoRound {
  id: number;
  endTime: Date;
  totalEntries: number;
}

interface HoldingTier {
  usdValue: number;
  entries: number;
  label: string;
  color: string;
}

const HOLDING_TIERS: HoldingTier[] = [
  { usdValue: 20, entries: 1, label: 'Bronze Holder', color: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300' },
  { usdValue: 100, entries: 2, label: 'Silver Holder', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
  { usdValue: 1000, entries: 3, label: 'Gold Holder', color: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' },
  { usdValue: 10000, entries: 5, label: 'Diamond Holder', color: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' }
];

export const LottoEntry: React.FC<LottoEntryProps> = ({ jackpotAmount, userAddress, tokenPrice, userBalance = 0 }) => {
  const [userHoldings, setUserHoldings] = useState({
    sofTokens: 0,
    usdValue: 0
  });
  const [loading, setLoading] = useState(true);

  // Update holdings when userBalance changes
  useEffect(() => {
    if (userBalance !== undefined) {
      const usdValue = userBalance * tokenPrice;
      setUserHoldings({
        sofTokens: userBalance,
        usdValue
      });
      setLoading(false);
    }
  }, [userBalance, tokenPrice]);
  
  const [currentRound] = useState<LottoRound>({
    id: 42,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    totalEntries: 1247
  });

  const timeUntilDraw = currentRound.endTime.getTime() - Date.now();
  const hoursLeft = Math.floor(timeUntilDraw / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeUntilDraw % (1000 * 60 * 60)) / (1000 * 60));

  // Calculate current tier and entries based on holdings
  const getCurrentTier = (usdValue: number) => {
    for (let i = HOLDING_TIERS.length - 1; i >= 0; i--) {
      if (usdValue >= HOLDING_TIERS[i].usdValue) {
        return HOLDING_TIERS[i];
      }
    }
    return null;
  };

  const getNextTier = (usdValue: number) => {
    for (let i = 0; i < HOLDING_TIERS.length; i++) {
      if (usdValue < HOLDING_TIERS[i].usdValue) {
        return HOLDING_TIERS[i];
      }
    }
    return null;
  };

  const currentTier = getCurrentTier(userHoldings.usdValue);
  const nextTier = getNextTier(userHoldings.usdValue);
  const currentEntries = currentTier?.entries || 0;
  
  const calculateWinChance = (entries: number): number => {
    const totalEntries = currentRound.totalEntries + entries;
    return totalEntries > 0 ? (entries / totalEntries) * 100 : 0;
  };

  const winChance = calculateWinChance(currentEntries);
  
  // Calculate progress to next tier
  const progressToNext = nextTier && currentTier 
    ? ((userHoldings.usdValue - currentTier.usdValue) / (nextTier.usdValue - currentTier.usdValue)) * 100
    : nextTier 
    ? (userHoldings.usdValue / nextTier.usdValue) * 100
    : 100;

  const handleBuyMoreTokens = () => {
    toast.success('🚀 Scroll up to buy more SOF tokens!');
    // In a real app, this would scroll to or navigate to the trading section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono">
          <Wallet className="h-5 w-5 text-green-500" />
          ANON_PROTOCOL - ROUND #{currentRound.id}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {hoursLeft}h {minutesLeft}m left
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {currentRound.totalEntries.toLocaleString()} total entries
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Current Jackpot */}
        <div className="text-center p-4 md:p-6 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 rounded-lg">
          <div className="text-2xl md:text-3xl font-bold text-pink-600 dark:text-pink-400">
            ${jackpotAmount.toLocaleString()}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">Current Jackpot</div>
        </div>

        {/* Your Holdings & Entries */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2 font-mono">
            <Star className="h-4 w-4 text-green-500" />
            YOUR_SOF_HOLDINGS
          </h4>
          
          <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg md:text-xl font-bold">{userHoldings.sofTokens.toLocaleString()}</div>
                <div className="text-xs md:text-sm text-muted-foreground">SOF Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-xl font-bold">${userHoldings.usdValue.toFixed(2)}</div>
                <div className="text-xs md:text-sm text-muted-foreground">USD Value</div>
              </div>
            </div>
            
            {loading ? (
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                <div className="font-medium text-gray-600 dark:text-gray-400">Loading Holdings...</div>
              </div>
            ) : currentTier ? (
              <div className={`p-3 rounded-lg ${currentTier.color} text-center`}>
                <div className="font-medium">{currentTier.label}</div>
                <div className="text-2xl font-bold mt-1">{currentEntries} Lotto Entries</div>
                <div className="text-sm mt-1">Win Chance: {winChance.toFixed(4)}%</div>
              </div>
            ) : null}
            
            {!currentTier && (
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                <div className="font-medium text-gray-600 dark:text-gray-400">No Entries</div>
                <div className="text-sm mt-1">Hold $20+ worth of SOF to enter</div>
              </div>
            )}
          </div>
        </div>

        {/* Holding Tiers */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2 font-mono">
            <Target className="h-4 w-4" />
            HOLDING_TIERS - STAKE_MORE_WIN_MORE
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {HOLDING_TIERS.map((tier, index) => {
              const isActive = userHoldings.usdValue >= tier.usdValue;
              const isCurrent = currentTier?.usdValue === tier.usdValue;
              
              return (
                <div 
                  key={tier.label}
                  className={`p-3 rounded-lg border ${
                    isCurrent 
                      ? 'border-pink-300 bg-pink-100 dark:bg-pink-950' 
                      : isActive 
                      ? 'border-green-300 bg-green-50 dark:bg-green-950' 
                      : 'border-gray-200 bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">${tier.usdValue.toLocaleString()} SOF</div>
                      <div className="text-xs text-muted-foreground">{tier.label}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{tier.entries} {tier.entries === 1 ? 'Entry' : 'Entries'}</div>
                      {isCurrent && <div className="text-xs text-pink-600 dark:text-pink-400">Current</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress to {nextTier.label}
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current: ${userHoldings.usdValue.toFixed(2)}</span>
                <span>Target: ${nextTier.usdValue.toLocaleString()}</span>
              </div>
              <Progress value={Math.min(progressToNext, 100)} className="h-2" />
              <div className="text-center text-sm font-mono">
                <span className="text-muted-foreground">NEED </span>
                <span className="font-bold text-green-500">${(nextTier.usdValue - userHoldings.usdValue).toFixed(2)} MORE</span>
                <span className="text-muted-foreground"> FOR {nextTier.entries} ENTRIES</span>
              </div>
            </div>
          </div>
        )}

        {/* Buy More Tokens CTA */}
        <div className="space-y-3">
          <Button 
            onClick={handleBuyMoreTokens} 
            className="w-full h-12 text-base font-medium glow-green font-mono" 
          >
            ACQUIRE_MORE_SOF
          </Button>
          <div className="text-center text-xs text-muted-foreground">
            Increase your holdings to get more lotto entries!
          </div>
        </div>

        <Separator />

        {/* Prize Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium font-mono">REWARD_BREAKDOWN</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 md:p-2 bg-green-50 dark:bg-green-950 rounded">
              <span className="text-sm font-mono">[ANON_WINNER] (82%)</span>
              <span className="font-bold font-mono">${(jackpotAmount * 0.82).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 md:p-2 bg-green-100 dark:bg-green-900 rounded">
              <span className="text-sm font-mono">[RUNNER_UPS] (3x 2%)</span>
              <span className="font-bold font-mono">${(jackpotAmount * 0.02).toLocaleString()} each</span>
            </div>
            <div className="flex justify-between items-center p-3 md:p-2 bg-green-50 dark:bg-green-950 rounded">
              <span className="text-sm font-mono">[SOF_REWARDS] (12%)</span>
              <span className="font-bold font-mono">${(jackpotAmount * 0.12).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Flywheel Benefits */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-700 dark:text-green-300">
            <p className="font-medium mb-2 font-mono">[ANON_PROTOCOL_RULES]:</p>
            <ul className="space-y-1 text-xs font-mono">
              <li>• HOLD $20+ SOF = 1 ENTRY AUTOMATIC</li>
              <li>• HOLD $100+ SOF = 2 ENTRIES (2X CHANCE)</li>
              <li>• HOLD $1,000+ SOF = 3 ENTRIES (3X POWER)</li>
              <li>• HOLD $10,000+ SOF = 5 ENTRIES (ANON_STATUS)</li>
              <li>• NO_TICKETS_REQUIRED - JUST_HOLD_AND_WIN</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LottoEntry;