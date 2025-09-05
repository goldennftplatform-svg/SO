import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Shield, Zap, Key, Wallet } from 'lucide-react';
import { useMultiWallet } from '@/hooks/useMultiWallet';

interface WalletSelectorProps {
  onWalletSelect: (walletId: string) => void;
  connecting: boolean;
}

export const WalletSelector: React.FC<WalletSelectorProps> = ({ 
  onWalletSelect, 
  connecting 
}) => {
  const [open, setOpen] = useState(false);
  const { connectToWallet, isWalletAvailable } = useMultiWallet();

  // Social login options removed - using direct wallet connections only

  const walletOptions = [
    {
      id: 'phantom',
      name: 'Phantom',
      icon: '👻',
      description: 'Connect your Phantom wallet',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'solflare',
      name: 'Solflare',
      icon: '☀️',
      description: 'Connect your Solflare wallet',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      id: 'backpack',
      name: 'Backpack',
      icon: '🎒',
      description: 'Connect your Backpack wallet',
      color: 'bg-cyan-500 hover:bg-cyan-600'
    },
    {
      id: 'slope',
      name: 'Slope',
      icon: '📱',
      description: 'Connect your Slope wallet',
      color: 'bg-pink-500 hover:bg-pink-600'
    }
  ];

  const handleWalletSelect = async (walletId: string) => {
    try {
      console.log('👻 Attempting direct wallet connection with:', walletId);
      
      // Check if wallet is available
      if (!isWalletAvailable(walletId)) {
        // Open download page for the wallet
        const downloadUrls = {
          phantom: 'https://phantom.app/',
          solflare: 'https://solflare.com/',
          backpack: 'https://backpack.app/',
          slope: 'https://slope.finance/'
        };
        window.open(downloadUrls[walletId as keyof typeof downloadUrls], '_blank');
        throw new Error(`${walletId} wallet not found. Please install the wallet.`);
      }

      // Connect directly to the wallet
      await connectToWallet(walletId);
      console.log('✅ Direct wallet connection successful');
      onWalletSelect(walletId);
      setOpen(false);
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      // Don't close the dialog on error, let user try again
    }
  };

  // No loading state needed for direct wallet connections

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          disabled={connecting}
          className="min-w-[140px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {connecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Connect Wallet
            </>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Connect to SOFLOTTO
          </DialogTitle>
          <DialogDescription>
            Choose your preferred authentication method
          </DialogDescription>
        </DialogHeader>
        
                <div className="space-y-4">
          {/* Wallet Connection Section */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Connect Your Wallet
            </div>
            
            {walletOptions.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                className={`w-full justify-start h-auto p-3 border-2 hover:scale-105 transition-transform mb-2 ${option.color}`}
                onClick={() => handleWalletSelect(option.id)}
                disabled={connecting}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-xl">{option.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white">{option.name}</div>
                    <div className="text-xs text-white/80">
                      {option.description}
                    </div>
                  </div>
                  <Wallet className="h-4 w-4 text-white/80" />
                </div>
              </Button>
            ))}
          </div>
          
          <div className="border-t pt-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">
                🔒 Powered by Privy & Solana
              </div>
              <div className="text-xs text-muted-foreground">
                Secure wallet connection and creation
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
