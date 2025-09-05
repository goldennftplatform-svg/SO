import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useMultiWallet } from '@/hooks/useMultiWallet';
import { AdminPageProps } from '@/components/types';

export const AdminPage: React.FC<AdminPageProps> = ({ adminAddresses }) => {
  const { connected, publicKey } = useMultiWallet();
  
  // Real contract data (will be loaded from contract)
  const [bankInventory, setBankInventory] = useState({
    solBalance: 0,
    tokenBalance: 0,
    totalRevenue: 0,
    lottoPool: 0
  });

  // Check if current wallet is an admin
  const isAdmin = connected && publicKey && adminAddresses.includes(publicKey.toString());
  
  // Load real contract data
  useEffect(() => {
    const loadContractData = async () => {
      try {
        // TODO: Replace with actual contract calls to get real data
        // For now, using placeholder data until contract integration is complete
        setBankInventory({
          solBalance: 0,
          tokenBalance: 0,
          totalRevenue: 0,
          lottoPool: 0
        });
      } catch (error) {
        console.error('Error loading contract data:', error);
      }
    };

    if (isAdmin) {
      loadContractData();
    }
  }, [isAdmin]);
  
  // Debug logging
  console.log('AdminPage Debug:', {
    connected,
    publicKey: publicKey?.toString(),
    publicKeyType: typeof publicKey,
    adminAddresses,
    adminAddressesType: typeof adminAddresses,
    isAdmin,
    publicKeyString: publicKey?.toString(),
    includesCheck: adminAddresses.includes(publicKey?.toString() || ''),
    exactMatch: publicKey?.toString() === "2QAQ367aBeHgCoHQwHo8x7ga34dANguG5Nu82Rs4ky42"
  });

  // If not an admin, don't show the page content
  if (!isAdmin) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-xl text-muted-foreground mb-12">You don't have permission to view this page</p>
            
            {/* Debug Info */}
            <div className="bg-muted p-4 rounded-lg text-left text-sm font-mono">
              <div><strong>Connected:</strong> {connected ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Public Key:</strong> {publicKey?.toString() || 'None'}</div>
              <div><strong>Admin Addresses:</strong> {JSON.stringify(adminAddresses)}</div>
              <div><strong>Is Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Exact Match:</strong> {publicKey?.toString() === "2QAQ367aBeHgCoHQwHo8x7ga34dANguG5Nu82Rs4ky42" ? '✅ Yes' : '❌ No'}</div>
            </div>
            
            <Link to="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  const handleUpdateInventory = (updates: Partial<typeof bankInventory>) => {
    setBankInventory(prev => ({ ...prev, ...updates }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Lotto
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage bank inventory and lotto system</p>
          </div>
        </div>
        
        <AdminDashboard 
          bankInventory={bankInventory}
          onUpdateInventory={handleUpdateInventory}
        />
      </div>
    </motion.div>
  );
};

export default AdminPage;