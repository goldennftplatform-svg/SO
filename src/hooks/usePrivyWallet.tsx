import { usePrivy } from '@privy-io/react-auth';
import { PublicKey } from '@solana/web3.js';

export const usePrivyWallet = () => {
  const { 
    login, 
    logout, 
    authenticated, 
    user, 
    ready, 
    wallet, 
    balance, 
    sendTransaction,
    getAccessToken 
  } = usePrivy();

  // Convert wallet address to PublicKey if available
  const publicKey = wallet?.address ? (() => {
    try {
      return new PublicKey(wallet.address);
    } catch (error) {
      console.error('Invalid wallet address:', wallet.address, error);
      return null;
    }
  })() : null;

  // Debug logging
  console.log('Privy Hook State:', { 
    authenticated, 
    ready, 
    wallet: !!wallet, 
    balance,
    user: !!user,
    walletAddress: wallet?.address,
    walletType: wallet?.walletClient,
    userLinkedAccounts: user?.linkedAccounts?.map(acc => acc.type)
  });

  return {
    // Connection state - user is connected if they have a wallet address
    connected: authenticated && !!wallet && !!wallet.address,
    // Show connecting state if user is authenticated but no wallet yet
    connecting: !ready || (authenticated && !wallet),
    loading: !ready,
    
    // Wallet info
    publicKey,
    balance: balance || null,
    
    // Actions
    connect: login,
    disconnect: logout,
    
    // Additional Privy features
    user,
    wallet,
    sendTransaction,
    getAccessToken,
    
    // Helper methods
    getAddress: () => wallet?.address || null,
    getBalance: () => balance || 0,
  };
};
