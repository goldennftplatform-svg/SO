import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Flame, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@tarobase/js-sdk';
import { AuthContextType } from '@/components/types';
import { setTokensTransfers, Address, Token } from '@/lib/tarobase';
import { generateRandomId } from '@/lib/utils';
import { ADMIN_ADDRESS } from '@/lib/constants';

interface TokenData {
  price: number;
  marketCap: number;
  totalSupply: number;
  burnedTokens: number;
  volume24h: number;
  lottoEnabled: boolean;
}

interface TokenTradingProps {
  tokenData: TokenData;
  onTrade: (type: 'buy' | 'sell', tokenAmount: number, solAmount: number) => void;
}

export const TokenTrading: React.FC<TokenTradingProps> = ({ tokenData, onTrade }) => {
  const { user } = useAuth() as AuthContextType;
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [activeTab, setActiveTab] = useState('buy');
  const [isTrading, setIsTrading] = useState(false);

  const calculateTokensFromSol = (solAmount: number): number => {
    return solAmount / tokenData.price;
  };

  const calculateSolFromTokens = (tokenAmount: number): number => {
    return tokenAmount * tokenData.price;
  };

  const calculateBurnAmount = (tokenAmount: number): number => {
    return tokenAmount * 0.0005; // 0.05% burn
  };

  const handleBuy = async () => {
    if (!user?.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    const solAmount = parseFloat(buyAmount);
    if (!solAmount || solAmount <= 0) {
      toast.error('Please enter a valid SOL amount');
      return;
    }

    setIsTrading(true);
    try {
      const tokenAmount = calculateTokensFromSol(solAmount);
      const burnAmount = calculateBurnAmount(tokenAmount);
      
      // Create a transfer from admin (bank) to user
      const transferId = generateRandomId();
      const success = await setTokensTransfers('sof', transferId, {
        from: Address.publicKey(ADMIN_ADDRESS), // Bank address
        to: Address.publicKey(user.address),
        tokenAmount: Token.amount('other', tokenAmount) // SOF tokens (6 decimals)
      });

      if (success) {
        onTrade('buy', tokenAmount, solAmount);
        toast.success(`Bought ${tokenAmount.toLocaleString()} SOF tokens! ${burnAmount.toLocaleString()} burned (0.05%)`);
        setBuyAmount('');
      } else {
        toast.error('Transaction failed. Please try again.');
      }
    } catch (error) {
      console.error('Buy transaction error:', error);
      toast.error('Transaction failed. Please try again.');
    } finally {
      setIsTrading(false);
    }
  };

  const handleSell = async () => {
    if (!user?.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    const tokenAmount = parseFloat(sellAmount);
    if (!tokenAmount || tokenAmount <= 0) {
      toast.error('Please enter a valid token amount');
      return;
    }

    setIsTrading(true);
    try {
      const solAmount = calculateSolFromTokens(tokenAmount);
      const burnAmount = calculateBurnAmount(tokenAmount);
      
      // Create a transfer from user to admin (bank)
      const transferId = generateRandomId();
      const success = await setTokensTransfers('sof', transferId, {
        from: Address.publicKey(user.address),
        to: Address.publicKey(ADMIN_ADDRESS), // Bank address
        tokenAmount: Token.amount('other', tokenAmount) // SOF tokens (6 decimals)
      });

      if (success) {
        onTrade('sell', tokenAmount, solAmount);
        toast.success(`Sold ${tokenAmount.toLocaleString()} SOF tokens! ${burnAmount.toLocaleString()} burned (0.05%)`);
        setSellAmount('');
      } else {
        toast.error('Transaction failed. Please try again.');
      }
    } catch (error) {
      console.error('Sell transaction error:', error);
      toast.error('Transaction failed. Please try again.');
    } finally {
      setIsTrading(false);
    }
  };

  const buyTokenAmount = buyAmount ? calculateTokensFromSol(parseFloat(buyAmount)) : 0;
  const sellSolAmount = sellAmount ? calculateSolFromTokens(parseFloat(sellAmount)) : 0;
  const buyBurnAmount = buyTokenAmount ? calculateBurnAmount(buyTokenAmount) : 0;
  const sellBurnAmount = sellAmount ? calculateBurnAmount(parseFloat(sellAmount)) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-pink-500" />
          SOF Token Trading
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Flame className="h-4 w-4 text-red-500" />
          <span>0.05% burn on all SOF trades</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 md:h-10">
            <TabsTrigger value="buy" className="flex items-center gap-1 md:gap-2 text-sm md:text-base">
              <TrendingUp className="h-4 w-4" />
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center gap-1 md:gap-2 text-sm md:text-base">
              <TrendingDown className="h-4 w-4" />
              Sell
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="buy" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="buy-amount">SOL Amount</Label>
              <Input
                id="buy-amount"
                type="number"
                placeholder="0.0"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
            
            {buyAmount && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>You'll receive:</span>
                  <span className="font-medium">{buyTokenAmount.toLocaleString()} SOF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-500">Burn amount:</span>
                  <span className="font-medium text-red-500">{buyBurnAmount.toLocaleString()} SOF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Price per token:</span>
                  <span className="font-medium">${tokenData.price.toFixed(8)}</span>
                </div>
              </div>
            )}
            
            <Button onClick={handleBuy} className="w-full h-12 text-base font-medium glow-green font-mono" disabled={!buyAmount || isTrading || !user}>
              {isTrading ? 'PROCESSING...' : 'BUY_SOF_TOKENS'}
            </Button>
          </TabsContent>
          
          <TabsContent value="sell" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="sell-amount">SOF Token Amount</Label>
              <Input
                id="sell-amount"
                type="number"
                placeholder="0"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                step="1000"
                min="0"
              />
            </div>
            
            {sellAmount && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>You'll receive:</span>
                  <span className="font-medium">{sellSolAmount.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-500">Burn amount:</span>
                  <span className="font-medium text-red-500">{sellBurnAmount.toLocaleString()} SOF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Price per token:</span>
                  <span className="font-medium">${tokenData.price.toFixed(8)}</span>
                </div>
              </div>
            )}
            
            <Button onClick={handleSell} className="w-full h-12 text-base font-medium glow-matrix font-mono" disabled={!sellAmount || isTrading || !user}>
              {isTrading ? 'PROCESSING...' : 'SELL_SOF_TOKENS'}
            </Button>
          </TabsContent>
        </Tabs>
        
        {/* Trading Info */}
        <div className="mt-4 p-3 md:p-4 bg-pink-50 dark:bg-pink-950 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-pink-500 mt-0.5" />
            <div className="text-sm text-pink-700 dark:text-pink-300">
              <p className="font-medium mb-1">SOF Trading Magic:</p>
              <ul className="space-y-1 text-xs md:text-sm">
                <li>• 0.05% of SOF tokens burned on every trade</li>
                <li>• 5% tax goes to slots jackpot pool</li>
                <li>• Price floats up with buys, down with sells</li>
                <li>• Casino bank maintains SOF liquidity</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenTrading;