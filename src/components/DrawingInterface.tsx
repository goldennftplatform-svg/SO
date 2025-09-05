import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dice1, Trophy, Users, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@tarobase/js-sdk';
import { AuthContextType } from '@/components/types';
import { 
  setJackpotsDraws, 
  runGetRandomNumberQueryForJackpotsDraws,
  getManyTokens,
  runGetUserTokenBalanceQueryForTokens,
  updateJackpots,
  Token,
  Time,
  Address
} from '@/lib/tarobase';
import { generateRandomId } from '@/lib/utils';
import { ADMIN_ADDRESS } from '@/lib/constants';
import { useTarobaseData } from '@/hooks/use-tarobase-data';
import { subscribeManyJackpotsDraws, subscribeManyJackpots } from '@/lib/tarobase';

interface DrawingInterfaceProps {
  isAdmin?: boolean;
}

interface DrawEntry {
  userAddress: string;
  entries: number;
  holdingValue: number;
}

interface DrawResult {
  drawId: string;
  winnerAddress: string;
  randomNumber: number;
  totalEntries: number;
  solPayout: number;
  timestamp: number;
  verified: boolean;
}

const HOLDING_TIERS = [
  { min: 20, max: 99, entries: 1 },
  { min: 100, max: 999, entries: 2 },
  { min: 1000, max: 9999, entries: 3 },
  { min: 10000, max: Infinity, entries: 5 }
];

export function DrawingInterface({ isAdmin = false }: DrawingInterfaceProps) {
  const { user } = useAuth() as AuthContextType;
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawEntries, setDrawEntries] = useState<DrawEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentJackpot, setCurrentJackpot] = useState(0);

  const { data: draws, loading: drawsLoading } = useTarobaseData(
    subscribeManyJackpotsDraws,
    true,
    'limit 10'
  );

  const { data: jackpots } = useTarobaseData(
    subscribeManyJackpots,
    true,
    'limit 1'
  );

  useEffect(() => {
    if (jackpots && jackpots.length > 0) {
      const latestJackpot = jackpots[0];
      setCurrentJackpot(latestJackpot.solBalance || 0);
    }
  }, [jackpots]);

  const calculateEntries = async () => {
    try {
      const tokens = await getManyTokens('limit 1');
      if (!tokens || tokens.length === 0) return;

      const tokenId = tokens[0].id;
      const entries: DrawEntry[] = [];
      let total = 0;

      const holders = await runGetUserTokenBalanceQueryForTokens(tokenId, '');
      
      if (holders && Array.isArray(holders)) {
        for (const holder of holders) {
          const balance = holder.balance || 0;
          const holdingValue = balance * 0.001; // Assuming token price for calculation
          
          const tier = HOLDING_TIERS.find(t => holdingValue >= t.min && holdingValue < t.max);
          if (tier) {
            entries.push({
              userAddress: holder.address,
              entries: tier.entries,
              holdingValue
            });
            total += tier.entries;
          }
        }
      }

      setDrawEntries(entries);
      setTotalEntries(total);
      toast.success(`Calculated ${total} total entries from ${entries.length} holders`);
    } catch (error) {
      console.error('Error calculating entries:', error);
      toast.error('Failed to calculate entries');
    }
  };

  const triggerDraw = async () => {
    if (!user || user.address !== ADMIN_ADDRESS) {
      toast.error('Only admin can trigger drawings');
      return;
    }

    if (totalEntries === 0) {
      toast.error('No entries found. Calculate entries first.');
      return;
    }

    setIsDrawing(true);
    
    try {
      const drawId = generateRandomId();
      
      // Get random number using the query function
      const randomResult = await runGetRandomNumberQueryForJackpotsDraws(drawId, '');
      
      if (!randomResult || typeof randomResult.randomNumber !== 'number') {
        throw new Error('Failed to get random number');
      }

      const randomNumber = randomResult.randomNumber;
      const winnerIndex = randomNumber % totalEntries;
      
      // Find winner based on entry distribution
      let currentIndex = 0;
      let winner: DrawEntry | null = null;
      
      for (const entry of drawEntries) {
        if (winnerIndex >= currentIndex && winnerIndex < currentIndex + entry.entries) {
          winner = entry;
          break;
        }
        currentIndex += entry.entries;
      }

      if (!winner) {
        throw new Error('Failed to determine winner');
      }

      // Record the draw
      await setJackpotsDraws(drawId, {
        winnerAddress: Address.fromString(winner.userAddress),
        randomNumber,
        totalEntries,
        solPayout: Token.amount('SOL', currentJackpot),
        timestamp: Time.Now,
        verified: true
      });

      // Update jackpot (reset after payout)
      if (jackpots && jackpots.length > 0) {
        await updateJackpots(jackpots[0].id, {
          solBalance: Token.amount('SOL', 0)
        });
      }

      toast.success(`Winner selected: ${winner.userAddress.slice(0, 8)}... wins ${currentJackpot} SOL!`);
      
      // Refresh data
      await calculateEntries();
      
    } catch (error) {
      console.error('Error triggering draw:', error);
      toast.error('Failed to trigger draw');
    } finally {
      setIsDrawing(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Card className="border-green-500/20 bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <Dice1 className="h-5 w-5" />
              Admin Drawing Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{totalEntries}</div>
                <div className="text-sm text-gray-400">Total Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{drawEntries.length}</div>
                <div className="text-sm text-gray-400">Eligible Holders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{currentJackpot.toFixed(2)}</div>
                <div className="text-sm text-gray-400">SOL Jackpot</div>
              </div>
            </div>
            
            <Separator className="bg-green-500/20" />
            
            <div className="flex gap-2">
              <Button 
                onClick={calculateEntries}
                variant="outline"
                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Calculate Entries
              </Button>
              
              <Button 
                onClick={triggerDraw}
                disabled={isDrawing || totalEntries === 0}
                className="bg-green-600 hover:bg-green-700 text-black font-bold"
              >
                {isDrawing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Drawing...
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    Trigger Draw
                  </>
                )}
              </Button>
            </div>
            
            {drawEntries.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-green-400 mb-2">Entry Distribution:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {drawEntries.slice(0, 5).map((entry, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-400">{formatAddress(entry.userAddress)}</span>
                      <span className="text-green-400">{entry.entries} entries</span>
                    </div>
                  ))}
                  {drawEntries.length > 5 && (
                    <div className="text-xs text-gray-500">...and {drawEntries.length - 5} more</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Clock className="h-5 w-5" />
            Recent Drawings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {drawsLoading ? (
            <div className="text-center py-4 text-gray-400">Loading drawings...</div>
          ) : draws && draws.length > 0 ? (
            <div className="space-y-3">
              {draws.map((draw, index) => (
                <div key={draw.id} className="border border-green-500/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-green-400" />
                      <span className="font-medium text-green-400">Draw #{draws.length - index}</span>
                      {draw.verified && (
                        <Badge variant="outline" className="border-green-500/50 text-green-400">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">
                      {formatTimestamp(draw.timestamp)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Winner:</span>
                      <div className="text-green-400 font-mono">
                        {formatAddress(draw.winnerAddress)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Payout:</span>
                      <div className="text-green-400 font-bold">
                        {(draw.solPayout / Math.pow(10, 9)).toFixed(2)} SOL
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Random #:</span>
                      <div className="text-green-400 font-mono">
                        {draw.randomNumber}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Entries:</span>
                      <div className="text-green-400">
                        {draw.totalEntries}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No drawings yet</p>
              <p className="text-sm">Admin can trigger the first drawing</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}