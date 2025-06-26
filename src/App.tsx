import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { FarmersManager } from './components/FarmersManager';
import { CropsManager } from './components/CropsManager';
import { LandsManager } from './components/LandsManager';
import { TransactionsManager } from './components/TransactionsManager';
import { ReportsManager } from './components/ReportsManager';
import { AnalyticsManager } from './components/AnalyticsManager';
import { SettingsManager } from './components/SettingsManager';
import type { Farmer, Land, Crop, Transaction, SyncStatus } from './types';

// Sample data - loaded immediately
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Simple state management - no complex initialization
  const [farmers, setFarmers] = useState<Farmer[]>(initialFarmers);
  const [lands, setLands] = useState<Land[]>(initialLands);
  const [crops, setCrops] = useState<Crop[]>(initialCrops);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  // Simple sync status
  const [syncStatus] = useState<SyncStatus>({
    lastSync: new Date().toISOString(),
    pendingChanges: 0,
    isOnline: navigator.onLine,
    isSyncing: false
  });

  // Simple handlers
  const addFarmer = (farmer: Farmer) => {
    setFarmers(prev => [...prev, farmer]);
  };

  const updateFarmer = (farmer: Farmer) => {
    setFarmers(prev => prev.map(f => f.id === farmer.id ? farmer : f));
  };

  const addLand = (land: Land) => {
    setLands(prev => [...prev, land]);
  };

  const addCrop = (crop: Crop) => {
    setCrops(prev => [...prev, crop]);
  };

  const updateCrop = (crop: Crop) => {
    setCrops(prev => prev.map(c => c.id === crop.id ? crop : c));
  };

  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [...prev, transaction]);
  };

  const updateTransaction = (transaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            farmers={farmers}
            lands={lands}
            crops={crops}
            transactions={transactions}
          />
        );
      case 'farmers':
        return (
          <FarmersManager
            farmers={farmers}
            onAddFarmer={addFarmer}
            onUpdateFarmer={updateFarmer}
          />
        );
      case 'crops':
        return (
          <CropsManager
            crops={crops}
            farmers={farmers}
            lands={lands}
            onAddCrop={addCrop}
            onUpdateCrop={updateCrop}
          />
        );
      case 'lands':
        return (
          <LandsManager
            lands={lands}
            farmers={farmers}
            onAddLand={addLand}
          />
        );
      case 'transactions':
        return (
          <TransactionsManager
            transactions={transactions}
            farmers={farmers}
            crops={crops}
            onAddTransaction={addTransaction}
            onUpdateTransaction={updateTransaction}
          />
        );
      case 'reports':
        return (
          <ReportsManager
            farmers={farmers}
            lands={lands}
            crops={crops}
            transactions={transactions}
          />
        );
      case 'analytics':
        return (
          <AnalyticsManager
            farmers={farmers}
            lands={lands}
            crops={crops}
            transactions={transactions}
          />
        );
      case 'settings':
        return <SettingsManager />;
      default:
        return <div className="p-6">Page not found</div>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Navigation Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          syncStatus={syncStatus}
          onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden glass border-b border-white/20 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-md text-glass hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-glass">AgriTracker Pro</h1>
          <div className="w-10" />
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;