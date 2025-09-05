import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface WalletContextType {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  connectToWallet: (walletId: string) => Promise<void>;
  disconnect: () => void;
  balance: number | null;
  refreshBalance: () => Promise<void>;
  walletType: string | null;
  availableWallets: string[];
  isWalletAvailable: (walletName: string) => boolean;
}

export const useMultiWallet = (): WalletContextType => {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);

  // Available wallet types
  const availableWallets = ['phantom', 'solflare', 'backpack', 'slope'];

  // Check if a specific wallet is available
  const isWalletAvailable = (walletName: string) => {
    switch (walletName) {
      case 'phantom':
        return 'solana' in window && window.solana?.isPhantom;
      case 'solflare':
        return 'solflare' in window && window.solflare?.isSolflare;
      case 'backpack':
        return 'solana' in window && window.solana?.isBackpack;
      case 'slope':
        return 'slope' in window && window.slope?.isSlope;
      default:
        return false;
    }
  };

  // Get wallet instance
  const getWallet = (walletName: string) => {
    switch (walletName) {
      case 'phantom':
        return window.solana;
      case 'solflare':
        return window.solflare;
      case 'backpack':
        return window.solana;
      case 'slope':
        return window.slope;
      default:
        return null;
    }
  };

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    try {
      const connection = new Connection('https://api.devnet.solana.com');
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance(null);
    }
  }, [publicKey]);

  // Connect to wallet
  const connect = useCallback(async () => {
    try {
      setConnecting(true);
      
      // Try to connect to the first available wallet
      let connectedWallet = null;
      let connectedWalletType = null;
      
      for (const walletName of availableWallets) {
        if (isWalletAvailable(walletName)) {
          const wallet = getWallet(walletName);
          try {
            const response = await wallet.connect();
            const newPublicKey = new PublicKey(response.publicKey.toString());
            
            setPublicKey(newPublicKey);
            setConnected(true);
            setWalletType(walletName);
            
            connectedWallet = wallet;
            connectedWalletType = walletName;
            
            // Fetch initial balance
            await refreshBalance();
            
            console.log(`Connected to ${walletName} wallet:`, newPublicKey.toString());
            break;
          } catch (error) {
            console.log(`Failed to connect to ${walletName}:`, error);
            continue;
          }
        }
      }
      
      if (!connectedWallet) {
        // No wallet available, open Phantom download page
        window.open('https://phantom.app/', '_blank');
        throw new Error('No wallet found. Please install Phantom, Solflare, or another Solana wallet.');
      }
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, []);

  // Connect to a specific wallet
  const connectToWallet = useCallback(async (walletId: string) => {
    try {
      setConnecting(true);
      
      if (!isWalletAvailable(walletId)) {
        throw new Error(`${walletId} wallet is not available`);
      }
      
      const wallet = getWallet(walletId);
      if (!wallet) {
        throw new Error(`Failed to get ${walletId} wallet instance`);
      }
      
      const response = await wallet.connect();
      const newPublicKey = new PublicKey(response.publicKey.toString());
      
      setPublicKey(newPublicKey);
      setConnected(true);
      setWalletType(walletId);
      
      // Fetch initial balance
      await refreshBalance();
      
      console.log(`Connected to ${walletId} wallet:`, newPublicKey.toString());
      
    } catch (error) {
      console.error(`Failed to connect to ${walletId}:`, error);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    try {
      if (walletType) {
        const wallet = getWallet(walletType);
        if (wallet && wallet.disconnect) {
          wallet.disconnect();
        }
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setPublicKey(null);
      setConnected(false);
      setBalance(null);
      setWalletType(null);
    }
  }, [walletType]);

  // Check for existing wallet connection on mount
  useEffect(() => {
    console.log('🔍 Checking for existing wallet connections...');
    // Check if any wallet is already connected
    for (const walletName of availableWallets) {
      if (isWalletAvailable(walletName)) {
        const wallet = getWallet(walletName);
        console.log(`Checking ${walletName}:`, {
          isAvailable: isWalletAvailable(walletName),
          wallet: !!wallet,
          isConnected: wallet?.isConnected,
          hasPublicKey: !!wallet?.publicKey
        });
        
        if (wallet && wallet.isConnected && wallet.publicKey) {
          console.log(`✅ Found connected ${walletName} wallet:`, wallet.publicKey.toString());
          setPublicKey(new PublicKey(wallet.publicKey.toString()));
          setConnected(true);
          setWalletType(walletName);
          
          // Fetch balance
          const fetchBalance = async () => {
            try {
              const connection = new Connection('https://api.devnet.solana.com');
              const balance = await connection.getBalance(wallet.publicKey);
              setBalance(balance / LAMPORTS_PER_SOL);
            } catch (error) {
              console.error('Failed to fetch balance:', error);
              setBalance(null);
            }
          };
          fetchBalance();
          break;
        }
      }
    }
    console.log('🔍 Wallet connection check complete');
  }, []); // Run only on mount

  // Listen for wallet events
  useEffect(() => {
    if (!walletType) return;
    
    const wallet = getWallet(walletType);
    if (!wallet) return;

    const handleAccountChanged = (publicKey: any) => {
      if (publicKey) {
        setPublicKey(new PublicKey(publicKey.toString()));
        setConnected(true);
        // Call refreshBalance directly instead of depending on it
        if (publicKey) {
          const fetchBalance = async () => {
            try {
              const connection = new Connection('https://api.devnet.solana.com');
              const balance = await connection.getBalance(new PublicKey(publicKey.toString()));
              setBalance(balance / LAMPORTS_PER_SOL);
            } catch (error) {
              console.error('Failed to fetch balance:', error);
              setBalance(null);
            }
          };
          fetchBalance();
        }
      } else {
        setPublicKey(null);
        setConnected(false);
        setBalance(null);
      }
    };

    const handleDisconnect = () => {
      setPublicKey(null);
      setConnected(false);
      setBalance(null);
      setWalletType(null);
    };

    // Check if already connected
    if (wallet.isConnected) {
      setPublicKey(new PublicKey(wallet.publicKey.toString()));
      setConnected(true);
      // Fetch balance directly
      const fetchBalance = async () => {
        try {
          const connection = new Connection('https://api.devnet.solana.com');
          const balance = await connection.getBalance(wallet.publicKey);
          setBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error('Failed to fetch balance:', error);
          setBalance(null);
        }
      };
      fetchBalance();
    }

    // Listen for events
    wallet.on('accountChanged', handleAccountChanged);
    wallet.on('disconnect', handleDisconnect);

    return () => {
      wallet.removeListener('accountChanged', handleAccountChanged);
      wallet.removeListener('disconnect', handleDisconnect);
    };
  }, [walletType]); // Removed refreshBalance dependency

  return {
    publicKey,
    connected,
    connecting,
    connect,
    connectToWallet,
    disconnect,
    balance,
    refreshBalance,
    walletType,
    availableWallets,
    isWalletAvailable,
  };
};

// Extend Window interface for multiple wallets
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      isBackpack?: boolean;
      isConnected?: boolean;
      publicKey?: any;
      connect: () => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
    solflare?: {
      isSolflare?: boolean;
      isConnected?: boolean;
      publicKey?: any;
      connect: () => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
    slope?: {
      isSlope?: boolean;
      isConnected?: boolean;
      publicKey?: any;
      connect: () => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

