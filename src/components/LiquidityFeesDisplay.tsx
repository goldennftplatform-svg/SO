import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  TrendingUp, 
  Flame, 
  ArrowRight, 
  BarChart3, 
  Droplets,
  RefreshCw,
  Target,
  Zap,
  PieChart
} from 'lucide-react';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface LiquidityFeesDisplayProps {
  volume24h: number;
  totalRevenue: number;
  lottoPool: number;
  burnedTokens: number;
}

interface FlywheelMetrics {
  tradingVolume: number;
  feesCollected: number;
  jackpotFunding: number;
  burnRate: number;
  liquidityHealth: number;
  activeTraders: number;
}

const COLORS = ['#db2777', '#ec4899', '#9333ea', '#06b6d4'];

export const LiquidityFeesDisplay: React.FC<LiquidityFeesDisplayProps> = ({ 
  volume24h, 
  totalRevenue, 
  lottoPool, 
  burnedTokens 
}) => {
  const [flywheelMetrics, setFlywheelMetrics] = useState<FlywheelMetrics>({
    tradingVolume: volume24h,
    feesCollected: totalRevenue,
    jackpotFunding: lottoPool,
    burnRate: 0.05,
    liquidityHealth: 87,
    activeTraders: 156
  });

  // Update metrics when props change
  useEffect(() => {
    setFlywheelMetrics(prev => ({
      ...prev,
      tradingVolume: volume24h,
      feesCollected: totalRevenue,
      jackpotFunding: lottoPool
    }));
  }, [volume24h, totalRevenue, lottoPool]);

  const [realtimeData, setRealtimeData] = useState([
    { time: '00:00', volume: 2500, fees: 125, jackpot: 8200 },
    { time: '04:00', volume: 3200, fees: 160, jackpot: 8360 },
    { time: '08:00', volume: 4100, fees: 205, jackpot: 8565 },
    { time: '12:00', volume: 3800, fees: 190, jackpot: 8755 },
    { time: '16:00', volume: 4500, fees: 225, jackpot: 8980 },
    { time: '20:00', volume: 3900, fees: 195, jackpot: 9175 },
    { time: '24:00', volume: 4200, fees: 210, jackpot: 9385 }
  ]);

  // Revenue breakdown data for pie chart
  const revenueBreakdown = [
    { name: 'Jackpot Pool', value: 82, amount: totalRevenue * 0.82, color: '#db2777' },
    { name: 'Runner-up Prizes', value: 6, amount: totalRevenue * 0.06, color: '#ec4899' },
    { name: 'SOF Magic Rewards', value: 12, amount: totalRevenue * 0.12, color: '#9333ea' }
  ];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setFlywheelMetrics(prev => ({
        ...prev,
        tradingVolume: prev.tradingVolume + Math.random() * 1000,
        feesCollected: prev.feesCollected + Math.random() * 50,
        jackpotFunding: prev.jackpotFunding + Math.random() * 25,
        activeTraders: Math.floor(prev.activeTraders + (Math.random() - 0.5) * 10)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <Card className="floating-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-cyan-500" />
            SOF Liquidity & Fees Dashboard
          </CardTitle>
          <Badge variant="outline" className="w-fit flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Live Flywheel Metrics
          </Badge>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {/* Real-time Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 rounded-lg">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-pink-500" />
              <div className="text-lg md:text-xl font-bold">${formatNumber(flywheelMetrics.tradingVolume)}</div>
              <div className="text-xs text-muted-foreground">24H Volume</div>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
              <DollarSign className="h-5 w-5 mx-auto mb-2 text-purple-500" />
              <div className="text-lg md:text-xl font-bold">${formatNumber(flywheelMetrics.feesCollected)}</div>
              <div className="text-xs text-muted-foreground">Fees Collected</div>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 rounded-lg">
              <Target className="h-5 w-5 mx-auto mb-2 text-pink-500" />
              <div className="text-lg md:text-xl font-bold">${formatNumber(flywheelMetrics.jackpotFunding)}</div>
              <div className="text-xs text-muted-foreground">Jackpot Pool</div>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
              <Flame className="h-5 w-5 mx-auto mb-2 text-red-500" />
              <div className="text-lg md:text-xl font-bold">{formatNumber(burnedTokens)}</div>
              <div className="text-xs text-muted-foreground">SOF Burned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flywheel Flow Visualization */}
      <Card className="floating-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            SOF Flywheel Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            {/* Step 1: Trading */}
            <div className="flex-1 text-center p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 rounded-lg">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-cyan-500" />
              <div className="font-bold text-lg">SOF Trading</div>
              <div className="text-sm text-muted-foreground">Users buy/sell SOF</div>
              <div className="text-xs mt-1 font-medium">${formatNumber(flywheelMetrics.tradingVolume)}/24h</div>
            </div>
            
            <ArrowRight className="h-6 w-6 text-pink-500 transform md:transform-none rotate-90 md:rotate-0" />
            
            {/* Step 2: Fees & Burn */}
            <div className="flex-1 text-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 rounded-lg">
              <Flame className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <div className="font-bold text-lg">Fees & Burn</div>
              <div className="text-sm text-muted-foreground">5% tax + 0.05% burn</div>
              <div className="text-xs mt-1 font-medium">${formatNumber(flywheelMetrics.feesCollected)} collected</div>
            </div>
            
            <ArrowRight className="h-6 w-6 text-pink-500 transform md:transform-none rotate-90 md:rotate-0" />
            
            {/* Step 3: Jackpot Funding */}
            <div className="flex-1 text-center p-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 text-pink-500" />
              <div className="font-bold text-lg">Jackpot Growth</div>
              <div className="text-sm text-muted-foreground">95% of fees → prizes</div>
              <div className="text-xs mt-1 font-medium">${formatNumber(flywheelMetrics.jackpotFunding)} pool</div>
            </div>
            
            <ArrowRight className="h-6 w-6 text-pink-500 transform md:transform-none rotate-90 md:rotate-0" />
            
            {/* Step 4: Holding Incentive */}
            <div className="flex-1 text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="font-bold text-lg">Hold & Win</div>
              <div className="text-sm text-muted-foreground">Bigger prizes = more holding</div>
              <div className="text-xs mt-1 font-medium">{flywheelMetrics.activeTraders} active holders</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Real-time Activity Chart */}
        <Card className="floating-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-500" />
              24H Activity Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={realtimeData}>
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={[
                      (value: number, name: string) => [
                        name === 'volume' ? `$${formatNumber(value)}` : 
                        name === 'fees' ? `$${value}` : `$${formatNumber(value)}`,
                        name === 'volume' ? 'Volume' : 
                        name === 'fees' ? 'Fees' : 'Jackpot'
                      ]
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    stackId="1"
                    stroke="#06b6d4" 
                    fill="#06b6d4"
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="fees" 
                    stackId="2"
                    stroke="#db2777" 
                    fill="#db2777"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="floating-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-500" />
              Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip 
                    formatter={[
                      (value: number, name: string) => [`${value}%`, name]
                    ]}
                  />
                  <pie
                    data={revenueBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              {revenueBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded" style={{ backgroundColor: `${item.color}20` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-sm font-bold">{item.value}% (${formatNumber(item.amount)})</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liquidity Health */}
      <Card className="floating-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-cyan-500" />
            Liquidity Pool Health
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pool Health</span>
                <span className="font-medium">{flywheelMetrics.liquidityHealth}%</span>
              </div>
              <Progress value={flywheelMetrics.liquidityHealth} className="h-2" />
              <div className="text-xs text-muted-foreground">Excellent liquidity depth</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Burn Impact</span>
                <span className="font-medium">{flywheelMetrics.burnRate}%</span>
              </div>
              <Progress value={flywheelMetrics.burnRate * 20} className="h-2" />
              <div className="text-xs text-muted-foreground">Per transaction burn rate</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Traders</span>
                <span className="font-medium">{flywheelMetrics.activeTraders}</span>
              </div>
              <Progress value={(flywheelMetrics.activeTraders / 200) * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">24H unique traders</div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          {/* Flywheel Benefits */}
          <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 rounded-lg">
            <div className="text-sm text-pink-700 dark:text-pink-300">
              <p className="font-medium mb-2">🎰 How the SOF Flywheel Powers Jackpots:</p>
              <ul className="space-y-1 text-xs">
                <li>• Every SOF trade generates 5% fees for the ecosystem</li>
                <li>• 95% of fees flow directly into jackpot prizes</li>
                <li>• 0.05% token burn creates scarcity and price support</li>
                <li>• Bigger jackpots attract more holders and traders</li>
                <li>• More trading = bigger prizes = stronger flywheel</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiquidityFeesDisplay;