export interface Farmer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  barangay: string;
  municipality: string;
  province: string;
  totalHectares: number;
  datePlanted?: string;
  dateHarvested?: string;
  dateRegistered: string;
  isActive: boolean;
  profilePicture?: string;
}

export interface Land {
  id: string;
  farmerId: string;
  name: string;
  area: number; // in hectares
  location: string;
  barangay: string;
  municipality: string;
  province: string;
  soilType: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  dateAcquired: string;
}

export interface Crop {
  id: string;
  landId: string;
  farmerId: string;
  cropType: string;
  variety: string;
  plantingDate: string;
  expectedHarvestDate: string;
  actualHarvestDate?: string;
  areaPlanted: number; // in hectares
  expectedYield: number; // in kg
  actualYield?: number; // in kg
  status: 'planted' | 'growing' | 'ready' | 'harvested';
  notes?: string;
}

export interface Transaction {
  id: string;
  farmerId: string;
  cropId?: string;
  type: 'purchase' | 'sale';
  buyerSeller: string; // processing plant or buyer name
  produce: string;
  quantity: number; // in kg
  pricePerKg: number;
  totalAmount: number;
  transactionDate: string;
  paymentStatus: 'pending' | 'partial' | 'paid';
  deliveryStatus: 'pending' | 'delivered';
  notes?: string;
}

export interface Dashboard {
  totalFarmers: number;
  totalLands: number;
  totalCrops: number;
  totalHarvestThisMonth: number;
  totalRevenueThisMonth: number;
  averageYieldPerHectare: number;
  topCrops: Array<{ crop: string; quantity: number }>;
  monthlyHarvest: Array<{ month: string; yield: number }>;
  barangayDistribution: Array<{ barangay: string; farmers: number }>;
}

export interface SyncStatus {
  lastSync: string | null;
  pendingChanges: number;
  isOnline: boolean;
  isSyncing: boolean;
}

export interface SupabaseConfig {
  url: string;
  apiKey: string;
  isConfigured: boolean;
}