import { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navigation } from './components/Navigation';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthPage } from './components/auth/AuthPage';
import { EmailVerificationPage } from './components/auth/EmailVerificationPage';
import { EmailVerificationBanner } from './components/auth/EmailVerificationBanner';

// Lazy load heavy components
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const FarmersManager = lazy(() => import('./components/FarmersManager').then(module => ({ default: module.FarmersManager })));
const CropsManager = lazy(() => import('./components/CropsManager').then(module => ({ default: module.CropsManager })));
const LandsManager = lazy(() => import('./components/LandsManager').then(module => ({ default: module.LandsManager })));
const TransactionsManager = lazy(() => import('./components/TransactionsManager').then(module => ({ default: module.TransactionsManager })));
const ReportsManager = lazy(() => import('./components/ReportsManager').then(module => ({ default: module.ReportsManager })));
const AnalyticsManager = lazy(() => import('./components/AnalyticsManager').then(module => ({ default: module.AnalyticsManager })));
const SettingsManager = lazy(() => import('./components/SettingsManager').then(module => ({ default: module.SettingsManager })));
const UserManager = lazy(() => import('./components/UserManager').then(module => ({ default: module.UserManager })));
import type { Farmer, Land, Crop, Transaction, SyncStatus, LoadingState } from './types';
import { 
  farmerOperations, 
  landOperations, 
  cropOperations, 
  transactionOperations,
  getSupabaseConfig
} from './utils/supabase';
import {
  getSyncStatus,
  addSyncStatusListener,
  removeSyncStatusListener,
  performFullSync,
  startAutoSync,
  getLocalFarmers,
  getLocalLands,
  getLocalCrops,
  getLocalTransactions,
  updateLocalFarmers,
  updateLocalLands,
  updateLocalCrops,
  updateLocalTransactions,
  syncFarmers,
  syncLands,
  syncCrops,
  syncTransactions,
  initializeSyncStatus
} from './utils/sync';

// Sample data for initial setup (used when no Supabase config or offline)
const initialFarmers: Farmer[] = [
  {
    id: '1',
    firstName: 'Juan',
    lastName: 'dela Cruz',
    phone: '+63 912 345 6789',
    address: '123 Barangay Street',
    barangay: 'San Isidro',
    municipality: 'Cabanatuan',
    province: 'Nueva Ecija',
    totalHectares: 4.3,
    datePlanted: '2024-03-15',
    dateHarvested: '2024-08-05',
    dateRegistered: '2024-01-15',
    isActive: true
  },
  {
    id: '2',
    firstName: 'Maria',
    lastName: 'Santos',
    phone: '+63 923 456 7890',
    address: '456 Rural Road',
    barangay: 'San Jose',
    municipality: 'Cabanatuan',
    province: 'Nueva Ecija',
    totalHectares: 3.2,
    datePlanted: '2024-02-20',
    dateRegistered: '2024-02-20',
    isActive: true
  },
  {
    id: '3',
    firstName: 'Pedro',
    lastName: 'Reyes',
    phone: '+63 934 567 8901',
    address: '789 Farm Lane',
    barangay: 'Santo Tomas',
    municipality: 'Cabanatuan',
    province: 'Nueva Ecija',
    totalHectares: 2.8,
    datePlanted: '2024-04-10',
    dateRegistered: '2024-03-10',
    isActive: true
  }
];

const initialLands: Land[] = [
  {
    id: '1',
    farmerId: '1',
    name: 'East Field',
    area: 2.5,
    location: 'East side of barangay',
    barangay: 'San Isidro',
    municipality: 'Cabanatuan',
    province: 'Nueva Ecija',
    soilType: 'Clay loam',
    dateAcquired: '2020-01-01'
  },
  {
    id: '2',
    farmerId: '1',
    name: 'West Field',
    area: 1.8,
    location: 'West side near river',
    barangay: 'San Isidro',
    municipality: 'Cabanatuan',
    province: 'Nueva Ecija',
    soilType: 'Sandy loam',
    dateAcquired: '2021-06-15'
  },
  {
    id: '3',
    farmerId: '2',
    name: 'Main Farm',
    area: 3.2,
    location: 'Center of barangay',
    barangay: 'San Jose',
    municipality: 'Cabanatuan',
    province: 'Nueva Ecija',
    soilType: 'Clay',
    dateAcquired: '2019-03-20'
  }
];

const initialCrops: Crop[] = [
  {
    id: '1',
    landId: '1',
    farmerId: '1',
    cropType: 'Cassava',
    variety: 'Golden Yellow',
    plantingDate: '2024-03-15',
    expectedHarvestDate: '2024-12-15',
    areaPlanted: 2.0,
    expectedYield: 4000,
    status: 'growing',
    notes: 'Good growing conditions'
  },
  {
    id: '2',
    landId: '2',
    farmerId: '1',
    cropType: 'Sweet Potato',
    variety: 'Purple',
    plantingDate: '2024-04-01',
    expectedHarvestDate: '2024-08-01',
    actualHarvestDate: '2024-08-05',
    areaPlanted: 1.5,
    expectedYield: 2250,
    actualYield: 2400,
    status: 'harvested'
  },
  {
    id: '3',
    landId: '3',
    farmerId: '2',
    cropType: 'Cassava',
    variety: 'White Gold',
    plantingDate: '2024-02-20',
    expectedHarvestDate: '2024-11-20',
    areaPlanted: 2.8,
    expectedYield: 5600,
    status: 'ready',
    notes: 'Ready for harvest next week'
  }
];

const initialTransactions: Transaction[] = [
  {
    id: '1',
    farmerId: '1',
    cropId: '2',
    type: 'sale',
    buyerSeller: 'AgriCorp Processing Plant',
    produce: 'Sweet Potato',
    quantity: 2400,
    pricePerKg: 25,
    totalAmount: 60000,
    transactionDate: '2024-08-10',
    paymentStatus: 'paid',
    deliveryStatus: 'delivered'
  },
  {
    id: '2',
    farmerId: '2',
    type: 'purchase',
    buyerSeller: 'Local Seed Supplier',
    produce: 'Cassava Stems',
    quantity: 500,
    pricePerKg: 5,
    totalAmount: 2500,
    transactionDate: '2024-02-15',
    paymentStatus: 'paid',
    deliveryStatus: 'delivered',
    notes: 'Quality planting materials'
  }
];

function App() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Data state with loading states
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [lands, setLands] = useState<Land[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Loading states
  const [farmersLoading, setFarmersLoading] = useState<LoadingState>({
    isLoading: true,
    error: null,
    lastUpdated: null
  });
  const [landsLoading, setLandsLoading] = useState<LoadingState>({
    isLoading: true,
    error: null,
    lastUpdated: null
  });
  const [cropsLoading, setCropsLoading] = useState<LoadingState>({
    isLoading: true,
    error: null,
    lastUpdated: null
  });
  
  // Sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());

  // Initialize data and sync
  useEffect(() => {
    const initializeApp = async () => {
      console.log('Initializing AgriTracker app...');
      
      try {
        // Initialize sync status first
        initializeSyncStatus();
        
        const config = getSupabaseConfig();
        console.log('Supabase config:', { isConfigured: config.isConfigured });
        
        if (!config.isConfigured) {
          console.log('Using sample data (no Supabase config)');
          // Use sample data if no Supabase config
          setFarmers(initialFarmers);
          setLands(initialLands);
          setCrops(initialCrops);
          setTransactions(initialTransactions);
          
          // Update loading states
          setFarmersLoading({ isLoading: false, error: null, lastUpdated: new Date().toISOString() });
          setLandsLoading({ isLoading: false, error: null, lastUpdated: new Date().toISOString() });
          setCropsLoading({ isLoading: false, error: null, lastUpdated: new Date().toISOString() });
        } else {
          console.log('Loading data from Supabase...');
          // Load local data first for immediate display
          const localFarmers = getLocalFarmers();
          const localLands = getLocalLands();
          const localCrops = getLocalCrops();
          const localTransactions = getLocalTransactions();
          
          setFarmers(localFarmers);
          setLands(localLands);
          setCrops(localCrops);
          setTransactions(localTransactions);
          
          // Set initial loading states based on local data availability
          const hasLocalData = localFarmers.length > 0 || localLands.length > 0 || localCrops.length > 0 || localTransactions.length > 0;
          const timestamp = hasLocalData ? new Date().toISOString() : null;
          
          setFarmersLoading({ isLoading: !hasLocalData, error: null, lastUpdated: timestamp });
          setLandsLoading({ isLoading: !hasLocalData, error: null, lastUpdated: timestamp });
          setCropsLoading({ isLoading: !hasLocalData, error: null, lastUpdated: timestamp });
        }
        
        console.log('App initialization complete');
      } catch (error) {
        console.error('Error initializing app:', error);
        // Set error states for all loading states
        const errorState = {
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize app',
          lastUpdated: null
        };
        setFarmersLoading(errorState);
        setLandsLoading(errorState);
        setCropsLoading(errorState);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
    
    // Start auto-sync after initialization
    const autoSyncTimeout = setTimeout(() => {
      startAutoSync(5); // Every 5 minutes
    }, 1000);
    
    // Listen to sync status changes
    addSyncStatusListener(setSyncStatus);
    
    return () => {
      removeSyncStatusListener(setSyncStatus);
      clearTimeout(autoSyncTimeout);
    };
  }, []);

  // Load all data from server
  const loadAllData = async () => {
    try {
      // Load data sequentially to avoid race conditions
      const farmersResult = await syncFarmers();
      setFarmers(farmersResult.data);
      setFarmersLoading({
        isLoading: farmersResult.isLoading,
        error: farmersResult.error,
        lastUpdated: farmersResult.lastUpdated
      });

      const landsResult = await syncLands();
      setLands(landsResult.data);
      setLandsLoading({
        isLoading: landsResult.isLoading,
        error: landsResult.error,
        lastUpdated: landsResult.lastUpdated
      });

      const cropsResult = await syncCrops();
      setCrops(cropsResult.data);
      setCropsLoading({
        isLoading: cropsResult.isLoading,
        error: cropsResult.error,
        lastUpdated: cropsResult.lastUpdated
      });

      const transactionsResult = await syncTransactions();
      setTransactions(transactionsResult.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Set error states for all loading states
      const errorState = {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
        lastUpdated: null
      };
      setFarmersLoading(errorState);
      setLandsLoading(errorState);
      setCropsLoading(errorState);
    }
  };

  // CRUD handlers with database integration
  const addFarmer = async (farmer: Farmer) => {
    setFarmersLoading(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await farmerOperations.create(farmer);
      
      if (response.data) {
        const updatedFarmers = [...farmers, response.data];
        setFarmers(updatedFarmers);
        updateLocalFarmers(updatedFarmers);
      }
      
      setFarmersLoading({
        isLoading: false,
        error: response.error,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      setFarmersLoading({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to add farmer',
        lastUpdated: null
      });
    }
  };

  const updateFarmer = async (farmer: Farmer) => {
    setFarmersLoading(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await farmerOperations.update(farmer.id, farmer);
      
      if (response.data) {
        const updatedFarmers = farmers.map(f => f.id === farmer.id ? response.data! : f);
        setFarmers(updatedFarmers);
        updateLocalFarmers(updatedFarmers);
      }
      
      setFarmersLoading({
        isLoading: false,
        error: response.error,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      setFarmersLoading({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update farmer',
        lastUpdated: null
      });
    }
  };

  const deleteFarmer = async (farmerId: string) => {
    setFarmersLoading(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await farmerOperations.delete(farmerId);
      
      if (response.data) {
        const updatedFarmers = farmers.filter(f => f.id !== farmerId);
        setFarmers(updatedFarmers);
        updateLocalFarmers(updatedFarmers);
      }
      
      setFarmersLoading({
        isLoading: false,
        error: response.error,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      setFarmersLoading({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete farmer',
        lastUpdated: null
      });
    }
  };

  const addLand = async (land: Land) => {
    setLandsLoading(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await landOperations.create(land);
      
      if (response.data) {
        const updatedLands = [...lands, response.data];
        setLands(updatedLands);
        updateLocalLands(updatedLands);
      }
      
      setLandsLoading({
        isLoading: false,
        error: response.error,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      setLandsLoading({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to add land',
        lastUpdated: null
      });
    }
  };

  const addCrop = async (crop: Crop) => {
    setCropsLoading(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await cropOperations.create(crop);
      
      if (response.data) {
        const updatedCrops = [...crops, response.data];
        setCrops(updatedCrops);
        updateLocalCrops(updatedCrops);
      }
      
      setCropsLoading({
        isLoading: false,
        error: response.error,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      setCropsLoading({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to add crop',
        lastUpdated: null
      });
    }
  };

  const updateCrop = async (crop: Crop) => {
    setCropsLoading(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await cropOperations.update(crop.id, crop);
      
      if (response.data) {
        const updatedCrops = crops.map(c => c.id === crop.id ? response.data! : c);
        setCrops(updatedCrops);
        updateLocalCrops(updatedCrops);
      }
      
      setCropsLoading({
        isLoading: false,
        error: response.error,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      setCropsLoading({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update crop',
        lastUpdated: null
      });
    }
  };

  const addTransaction = async (transaction: Transaction) => {
    try {
      const response = await transactionOperations.create(transaction);
      if (response.data) {
        const updatedTransactions = [...transactions, response.data];
        setTransactions(updatedTransactions);
        updateLocalTransactions(updatedTransactions);
      }
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    try {
      const response = await transactionOperations.update(transaction.id, transaction);
      if (response.data) {
        const updatedTransactions = transactions.map(t => t.id === transaction.id ? response.data! : t);
        setTransactions(updatedTransactions);
        updateLocalTransactions(updatedTransactions);
      }
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }
  };

  // Manual sync handler
  const handleManualSync = async () => {
    try {
      const result = await performFullSync();
      if (result.success) {
        await loadAllData();
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            farmers={farmers || []}
            lands={lands || []}
            crops={crops || []}
            transactions={transactions || []}
          />
        );
      case 'farmers':
        return (
          <FarmersManager
            farmers={farmers || []}
            lands={lands || []}
            onAddFarmer={addFarmer}
            onUpdateFarmer={updateFarmer}
            onDeleteFarmer={deleteFarmer}
            loading={farmersLoading}
          />
        );
      case 'crops':
        return (
          <CropsManager
            crops={crops || []}
            farmers={farmers || []}
            lands={lands || []}
            onAddCrop={addCrop}
            onUpdateCrop={updateCrop}
            loading={cropsLoading}
          />
        );
      case 'lands':
        return (
          <LandsManager
            lands={lands || []}
            farmers={farmers || []}
            onAddLand={addLand}
            loading={landsLoading}
          />
        );
      case 'transactions':
        return (
          <TransactionsManager
            transactions={transactions || []}
            farmers={farmers || []}
            onAddTransaction={addTransaction}
            onUpdateTransaction={updateTransaction}
          />
        );
      case 'reports':
        return (
          <ReportsManager
            farmers={farmers || []}
            lands={lands || []}
            crops={crops || []}
            transactions={transactions || []}
          />
        );
      case 'analytics':
        return (
          <AnalyticsManager
            farmers={farmers || []}
            lands={lands || []}
            crops={crops || []}
            transactions={transactions || []}
          />
        );
      case 'settings':
        return <SettingsManager />;
      case 'users':
        return <UserManager />;
      default:
        return <div className="p-6">Page not found</div>;
    }
  };

  // Handle special routes first
  if (location.pathname === '/auth/verify') {
    return <EmailVerificationPage />;
  }

  // Show auth page if not authenticated
  if (!isAuthenticated && !authLoading) {
    return <AuthPage />;
  }

  // Show loading screen during auth check or app initialization
  if (authLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AgriTracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Navigation Sidebar - Hidden on mobile, shown on desktop */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          syncStatus={syncStatus}
          onMobileMenuClose={() => setIsMobileMenuOpen(false)}
          onManualSync={handleManualSync}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden glass border-b border-amber-200/30 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-md text-glass hover:text-white hover:bg-amber-900/20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-lg animate-sprout">🌾</span>
            <h1 className="text-lg font-semibold text-glass">AgriTracker Pro</h1>
            <span className="text-lg animate-float">🌱</span>
          </div>
          <div className="w-10" />
        </div>
        
        {/* Content Area - Add bottom padding on mobile for bottom nav */}
        <div className="flex-1 overflow-auto mobile-content-padding lg:pb-0">
          {isInitializing ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
            </div>
          ) : (
            <>
              {/* Email Verification Banner */}
              <EmailVerificationBanner className="m-6 mb-4" />
              <Suspense fallback={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                  <span className="ml-3 text-glass">Loading...</span>
                </div>
              }>
                {renderContent()}
              </Suspense>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}

// Wrapper component with ThemeProvider and AuthProvider
function AppWithTheme() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default AppWithTheme;