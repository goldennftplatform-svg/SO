import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface WalletContextType {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  balance: number | null;
  refreshBalance: () => Promise<void>;
}

export const useSolanaWallet = (): WalletContextType => {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  // Check if Phantom wallet is available
  const isPhantomAvailable = () => {
    return 'solana' in window && window.solana?.isPhantom;
  };

  // Get Phantom wallet
  const getPhantomWallet = () => {
    if (isPhantomAvailable()) {
      return window.solana;
    }
    return null;
  };

  // Connect to wallet
  const connect = useCallback(async () => {
    try {
      setConnecting(true);
      const wallet = getPhantomWallet();
      
      if (!wallet) {
        // Open Phantom wallet download page
        window.open('https://phantom.app/', '_blank');
        throw new Error('Phantom wallet not found. Please install Phantom wallet.');
      }

      // Connect to wallet
      const response = await wallet.connect();
      const newPublicKey = new PublicKey(response.publicKey.toString());
      
      setPublicKey(newPublicKey);
      setConnected(true);
      
      // Fetch initial balance
      await refreshBalance();
      
      console.log('Connected to wallet:', newPublicKey.toString());
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    try {
      const wallet = getPhantomWallet();
      if (wallet) {
        wallet.disconnect();
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setPublicKey(null);
      setConnected(false);
      setBalance(null);
    }
  }, []);

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

  // Listen for wallet events
  useEffect(() => {
    const wallet = getPhantomWallet();
    if (!wallet) return;

    const handleAccountChanged = (publicKey: any) => {
      if (publicKey) {
        setPublicKey(new PublicKey(publicKey.toString()));
        setConnected(true);
        refreshBalance();
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
    };

    // Check if already connected
    if (wallet.isConnected) {
      setPublicKey(new PublicKey(wallet.publicKey.toString()));
      setConnected(true);
      refreshBalance();
    }

    // Listen for events
    wallet.on('accountChanged', handleAccountChanged);
    wallet.on('disconnect', handleDisconnect);

    return () => {
      wallet.removeListener('accountChanged', handleAccountChanged);
      wallet.removeListener('disconnect', handleDisconnect);
    };
  }, [refreshBalance]);

  return {
    publicKey,
    connected,
    connecting,
    connect,
    disconnect,
    balance,
    refreshBalance,
  };
};

// Extend Window interface for Phantom wallet
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      isConnected?: boolean;
      publicKey?: any;
      connect: () => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}
