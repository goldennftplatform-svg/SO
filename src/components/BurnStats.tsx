import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flame, TrendingDown, Percent, BarChart } from 'lucide-react';

interface BurnStatsProps {
  burnedTokens: number;
  totalSupply: number;
  originalSupply: number;
}

export const BurnStats: React.FC<BurnStatsProps> = ({ 
  burnedTokens, 
  totalSupply, 
  originalSupply 
}) => {
  const burnPercentage = (burnedTokens / originalSupply) * 100;
  const remainingPercentage = (totalSupply / originalSupply) * 100;
  
  // Calculate burn rate projections based on current burn
  const dailyBurnEstimate = burnedTokens > 0 ? burnedTokens * 0.1 : 50000; // Default estimate if no burns yet
  const weeklyBurnEstimate = dailyBurnEstimate * 7;
  const monthlyBurnEstimate = dailyBurnEstimate * 30;
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-red-500" />
          SOF Burn Statistics
        </CardTitle>
        <Badge variant="destructive" className="w-fit">
          0.05% SOF burn per trade
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Burned */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-red-500">
            {formatNumber(burnedTokens)}
          </div>
          <div className="text-sm text-muted-foreground">SOF Tokens Burned Forever</div>
          <div className="text-xs text-muted-foreground">
            {burnPercentage.toFixed(3)}% of original supply
          </div>
        </div>

        {/* Supply Progress */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Supply Reduction</span>
            <span className="font-medium">{burnPercentage.toFixed(2)}%</span>
          </div>
          <Progress value={burnPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Original: {formatNumber(originalSupply)}</span>
            <span>Current: {formatNumber(totalSupply)}</span>
          </div>
        </div>

        {/* Burn Rate Projections */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Burn Rate Projections
          </h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950 rounded">
              <span className="text-sm flex items-center gap-1">
                <BarChart className="h-3 w-3" />
                Daily Estimate
              </span>
              <span className="font-medium">{formatNumber(dailyBurnEstimate)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950 rounded">
              <span className="text-sm flex items-center gap-1">
                <BarChart className="h-3 w-3" />
                Weekly Estimate
              </span>
              <span className="font-medium">{formatNumber(weeklyBurnEstimate)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-950 rounded">
              <span className="text-sm flex items-center gap-1">
                <BarChart className="h-3 w-3" />
                Monthly Estimate
              </span>
              <span className="font-medium">{formatNumber(monthlyBurnEstimate)}</span>
            </div>
          </div>
        </div>

        {/* Deflationary Impact */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Deflationary Impact
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Supply Remaining:</span>
              <span className="font-medium">{remainingPercentage.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Scarcity Increase:</span>
              <span className="font-medium text-green-600">+{(100 - remainingPercentage).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Price Support:</span>
              <span className="font-medium text-green-600">Continuous</span>
            </div>
          </div>
        </div>

        {/* Burn Mechanism Info */}
        <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
          <div className="text-sm text-orange-700 dark:text-orange-300">
            <p className="font-medium mb-1">How Burns Work:</p>
            <ul className="space-y-1 text-xs">
              <li>• 0.05% of tokens burned on every buy/sell</li>
              <li>• Burned tokens are removed from supply forever</li>
              <li>• Reduces total supply, increasing scarcity</li>
              <li>• Creates deflationary pressure on price</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BurnStats;