import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, BarChart3, DollarSign } from 'lucide-react';

interface BondingCurveChartProps {
  currentPrice: number;
  currentSupply: number;
  volume24h: number;
}

/* Mock data in use here */
const generateBondingCurveData = (currentPrice: number, currentSupply: number) => {
  const data = [];
  const totalSupply = 1000000000; // 1B total supply
  const step = totalSupply / 50; // 50 data points
  
  for (let i = 0; i <= 50; i++) {
    const supply = i * step;
    // Bonding curve formula: price increases exponentially with supply
    const price = 0.00001 * Math.pow(supply / totalSupply, 2) + 0.00001;
    const marketCap = price * supply;
    
    data.push({
      supply: supply / 1000000, // Convert to millions for readability
      price: price,
      marketCap: marketCap / 1000, // Convert to thousands
      isCurrent: Math.abs(supply - currentSupply) < step
    });
  }
  
  return data;
};

const generateVolumeData = () => {
  const data = [];
  const now = Date.now();
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now - i * 60 * 60 * 1000);
    const volume = Math.random() * 10000 + 2000; // Random volume between 2k-12k
    
    data.push({
      time: time.getHours() + ':00',
      volume: volume,
      trades: Math.floor(Math.random() * 50) + 10
    });
  }
  
  return data;
};

export const BondingCurveChart: React.FC<BondingCurveChartProps> = ({ 
  currentPrice, 
  currentSupply, 
  volume24h 
}) => {
  const bondingData = generateBondingCurveData(currentPrice, currentSupply);
  const volumeData = generateVolumeData();
  
  const currentSupplyInMillions = currentSupply / 1000000;
  const migrationThreshold = 690000000; // 690M tokens for migration
  const migrationSupplyInMillions = migrationThreshold / 1000000;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* Bonding Curve */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Bonding Curve
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Current: {currentSupplyInMillions.toFixed(0)}M tokens</Badge>
            <Badge variant="secondary">Migration: {migrationSupplyInMillions.toFixed(0)}M</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bondingData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="supply" 
                  tickFormatter={(value) => `${value}M`}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toFixed(6)}`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={[
                    (value: number, name: string) => [
                      name === 'price' ? `$${value.toFixed(8)}` : `$${value.toFixed(0)}K`,
                      name === 'price' ? 'Price' : 'Market Cap'
                    ]
                  ]}
                  labelFormatter={(value) => `Supply: ${value}M tokens`}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6' }}
                />
                {/* Migration line */}
                <Line 
                  type="monotone" 
                  dataKey={() => migrationSupplyInMillions}
                  stroke="#ef4444" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:text-base">
            <div className="space-y-1">
              <div className="text-muted-foreground">Current Price</div>
              <div className="font-bold">${currentPrice.toFixed(8)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Migration Progress</div>
              <div className="font-bold">{((currentSupply / migrationThreshold) * 100).toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Volume */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            24H Trading Volume
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <DollarSign className="h-3 w-3 mr-1" />
              ${volume24h.toLocaleString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="time" 
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={[
                    (value: number, name: string) => [
                      name === 'volume' ? `$${value.toLocaleString()}` : value,
                      name === 'volume' ? 'Volume' : 'Trades'
                    ]
                  ]}
                  labelFormatter={(value) => `Time: ${value}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#06b6d4" 
                  fill="#06b6d4"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-2 md:gap-4 text-xs md:text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">24H Volume</div>
              <div className="font-bold">${volume24h.toLocaleString()}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Avg Trade</div>
              <div className="font-bold">${(volume24h / 150).toFixed(0)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Total Trades</div>
              <div className="font-bold">~150</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BondingCurveChart;