import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMultiWallet } from '@/hooks/useMultiWallet';
import { Button } from '@/components/ui/button';
import { WalletSelector } from '@/components/WalletSelector';
import { TAROBASE_CONFIG } from '@/lib/config';
import { Wallet, RefreshCw, Copy, Check, ExternalLink, Plus, Shield } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

// If a header is wanted, change this to the name of the app
const AppName = 'SOFLOTTO';
const PLACEHOLDER_CA = 'SOF7xK9mP2vQ8nR4tL6wE3sJ1cA5bF8dH9gY2mX4pZ7k';

export const Header: React.FC = () => {
  const { 
    publicKey, 
    connected, 
    connecting, 
    connect, 
    disconnect, 
    balance,
    walletType
  } = useMultiWallet();
  
  const [justCopied, setJustCopied] = useState(false);
  const [caCopied, setCaCopied] = useState(false);

  const refetch = () => {
    // Privy handles balance updates automatically
    console.log('Balance refresh requested');
  };



  const handleLogout = async (): Promise<void> => {
    try { 
      disconnect(); 
    } catch (error) { 
      console.error('Failed to disconnect wallet', error); 
    }
  };

  const getNetworkInfo = () => {
    const isMainnet = TAROBASE_CONFIG.chain === 'solana_mainnet';
    return {
      name: isMainnet ? 'Mainnet' : 'Devnet',
      dotColor: isMainnet ? 'bg-green-500' : 'bg-orange-500',
      isMainnet
    };
  };

  const formatBalance = (bal: number | null) => {
    if (bal === null) return '--';
    return bal.toLocaleString('en-US', { 
      minimumFractionDigits: 3, 
      maximumFractionDigits: 3 
    });
  };

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString());
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    }
  };



  const copyCA = async () => {
    try {
      await navigator.clipboard.writeText(PLACEHOLDER_CA);
      setCaCopied(true);
      toast.success('Contract address copied!');
      setTimeout(() => setCaCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  return (
    <header className="w-full border-b border-border bg-background">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-medium">
            <span className="text-foreground">{AppName}</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Admin Button - Only show when connected */}
            {connected && (
              <Link to="/admin">
                <Button variant="outline" className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600">
                  🏛️ Admin Dashboard
                </Button>
              </Link>
            )}
            
            {connecting ? (
              <div className="h-9 w-24 rounded animate-pulse bg-muted" />
            ) : connected ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`h-2 w-2 rounded-full ${getNetworkInfo().dotColor} cursor-default`} style={{
                              animation: 'subtle-pulse 3s ease-in-out infinite'
                            }} />
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>Solana {getNetworkInfo().name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="font-medium">
                      {formatBalance(balance)} SOL
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      Privy
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={refetch}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title="Refresh balance"
                    >
                      <RefreshCw className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <button
                      onClick={copyAddress}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title="Copy address"
                    >
                      {justCopied ? (
                        <Check className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => window.open('https://faucet.solana.com/', '_blank')}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title="Fund wallet"
                    >
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                >
                  Disconnect
                </Button>
              </div>
            ) : connecting ? (
              <Button variant="default" disabled className="min-w-[140px]">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Connecting...
              </Button>
            ) : (
              <WalletSelector 
                onWalletSelect={connect}
                connecting={connecting}
              />
            )}
          </div>
        </div>
        
        {/* Contract Address Display */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-yellow-400">MAINNET SOON</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-green-500/30" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-green-400 font-mono hidden md:inline">CA:</span>
            <code className="text-xs font-mono text-green-300 truncate max-w-[120px] sm:max-w-[200px]">
              {PLACEHOLDER_CA}
            </code>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyCA}
                    className="h-6 w-6 p-0 hover:bg-green-500/20"
                  >
                    {caCopied ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-green-400" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy contract address</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://solscan.io/token/${PLACEHOLDER_CA}`, '_blank')}
                    className="h-6 w-6 p-0 hover:bg-green-500/20"
                  >
                    <ExternalLink className="h-3 w-3 text-green-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View on Solscan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;