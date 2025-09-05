import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Lock, Unlock } from 'lucide-react';
import { useTarobaseData } from '@/hooks/use-tarobase-data';
import { subscribeManyJackpots } from '@/lib/tarobase';

interface JackpotTier {
  tier: string;
  jackpot: number;
}

interface JackpotDisplayProps {
  currentTier: JackpotTier;
  marketCap: number;
  lottoEnabled: boolean;
}

const JACKPOT_TIERS = [
  { mcRequired: 100000, jackpot: 1000, label: '100K MC' },
  { mcRequired: 500000, jackpot: 5000, label: '500K MC' },
  { mcRequired: 1000000, jackpot: 10000, label: '1M MC' },
  { mcRequired: 5000000, jackpot: 25000, label: '5M MC' },
  { mcRequired: 10000000, jackpot: 50000, label: '10M MC' },
  { mcRequired: 100000000, jackpot: 100000, label: '100M MC' },
  { mcRequired: 500000000, jackpot: 250000, label: '500M MC' },
  { mcRequired: 1000000000, jackpot: 420000, label: '1B MC' },
];

export const JackpotDisplay: React.FC<JackpotDisplayProps> = ({ 
  currentTier, 
  marketCap, 
  lottoEnabled 
}) => {
  const [realJackpotAmount, setRealJackpotAmount] = useState(currentTier.jackpot);
  
  // Subscribe to real jackpot data
  const { data: jackpots, loading: jackpotsLoading } = useTarobaseData(
    subscribeManyJackpots,
    true,
    "limit 1 order by tarobase_created_at desc"
  );

  // Update jackpot amount from real data
  useEffect(() => {
    if (jackpots && jackpots.length > 0) {
      const currentJackpot = jackpots[0];
      if (currentJackpot.isOpen) {
        // Convert lamports to USD (approximate)
        const solAmount = currentJackpot.potLamports / Math.pow(10, 9);
        const usdAmount = solAmount * 180; // Approximate SOL price
        setRealJackpotAmount(Math.max(usdAmount, currentTier.jackpot));
      } else {
        setRealJackpotAmount(currentTier.jackpot);
      }
    }
  }, [jackpots, currentTier.jackpot]);
  // Find current and next tier
  const currentTierIndex = JACKPOT_TIERS.findIndex(tier => tier.mcRequired > marketCap);
  const nextTier = currentTierIndex >= 0 ? JACKPOT_TIERS[currentTierIndex] : null;
  const currentTierData = currentTierIndex > 0 ? JACKPOT_TIERS[currentTierIndex - 1] : null;
  
  // Calculate progress to next tier
  const progressToNext = nextTier && currentTierData 
    ? ((marketCap - currentTierData.mcRequired) / (nextTier.mcRequired - currentTierData.mcRequired)) * 100
    : nextTier 
    ? (marketCap / nextTier.mcRequired) * 100
    : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono">
          <Trophy className="h-5 w-5 text-green-500" />
          ANON_REWARD_POOL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Current Jackpot */}
        <div className="text-center space-y-2 md:space-y-3">
          <div className="text-3xl md:text-4xl font-bold text-green-400 font-mono">
            {(realJackpotAmount / 100).toFixed(4)} SOL
          </div>
          <Badge variant={lottoEnabled ? "default" : "secondary"} className="text-sm font-mono">
            {lottoEnabled ? (
              <><Unlock className="h-3 w-3 mr-1" /> {currentTier.tier}</>
            ) : (
              <><Lock className="h-3 w-3 mr-1" /> PROTOCOL_LOCKED</>
            )}
          </Badge>
        </div>

        {/* Prize Distribution */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2 font-mono">
            <Target className="h-4 w-4" />
            REWARD_DISTRIBUTION
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 md:p-2 bg-green-50 dark:bg-green-950 rounded text-sm md:text-base">
              <span className="font-medium font-mono">[ANON_WINNER]</span>
              <span className="font-bold font-mono">82% ({((realJackpotAmount * 0.82) / 100).toFixed(4)} SOL)</span>
            </div>
            <div className="flex justify-between items-center p-3 md:p-2 bg-green-100 dark:bg-green-900 rounded text-sm md:text-base">
              <span className="font-medium font-mono">[RUNNER_UPS] (3x)</span>
              <span className="font-bold font-mono">2% each ({((realJackpotAmount * 0.02) / 100).toFixed(4)} SOL)</span>
            </div>
            <div className="flex justify-between items-center p-3 md:p-2 bg-green-50 dark:bg-green-950 rounded text-sm md:text-base">
              <span className="font-medium font-mono">[SOF_REWARDS]</span>
              <span className="font-bold font-mono">12% ({((realJackpotAmount * 0.12) / 100).toFixed(4)} SOL)</span>
            </div>
          </div>
        </div>

        {/* Progress to Next Tier */}
        {nextTier && (
          <div className="space-y-3">
            <h4 className="font-medium font-mono">NEXT_TIER_PROGRESS</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current MC: ${(marketCap / 1000).toFixed(0)}K</span>
                <span>Target: ${(nextTier.mcRequired / 1000).toFixed(0)}K</span>
              </div>
              <Progress value={Math.min(progressToNext, 100)} className="h-2" />
              <div className="text-center text-sm md:text-base text-muted-foreground font-mono">
                Next reward: <span className="font-bold text-green-400">${nextTier.jackpot.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* All Tiers */}
        <div className="space-y-3">
          <h4 className="font-medium font-mono">ALL_REWARD_TIERS</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm">
            {JACKPOT_TIERS.map((tier, index) => {
              const isActive = marketCap >= tier.mcRequired;
              const isCurrent = currentTierData?.mcRequired === tier.mcRequired;
              
              return (
                <div 
                  key={tier.label}
                  className={`p-2 rounded border ${
                    isCurrent 
                      ? 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300' 
                      : isActive 
                      ? 'bg-green-50 dark:bg-green-950 border-green-200' 
                      : 'bg-muted border-border'
                  }`}
                >
                  <div className="font-medium">{tier.label}</div>
                  <div className="text-muted-foreground">{(tier.jackpot / 100).toFixed(4)} SOL</div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JackpotDisplay;