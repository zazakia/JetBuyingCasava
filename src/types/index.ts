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

// New types for database integration
export interface DatabaseRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: 'farmers' | 'lands' | 'crops' | 'transactions';
  data: any;
  timestamp: string;
  synced: boolean;
}

export interface SyncLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  synced: boolean;
  created_at: string;
  user_id: string;
}

// Database table interfaces (snake_case for Supabase)
export interface FarmerDB extends DatabaseRecord {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  barangay: string;
  municipality: string;
  province: string;
  total_hectares: number;
  date_planted?: string;
  date_harvested?: string;
  date_registered: string;
  is_active: boolean;
  profile_picture?: string;
}

export interface LandDB extends DatabaseRecord {
  farmer_id: string;
  name: string;
  area: number;
  location: string;
  barangay: string;
  municipality: string;
  province: string;
  soil_type: string;
  coordinates?: any;
  date_acquired: string;
}

export interface CropDB extends DatabaseRecord {
  land_id: string;
  farmer_id: string;
  crop_type: string;
  variety: string;
  planting_date: string;
  expected_harvest_date: string;
  actual_harvest_date?: string;
  area_planted: number;
  expected_yield: number;
  actual_yield?: number;
  status: 'planted' | 'growing' | 'ready' | 'harvested';
  notes?: string;
}

export interface TransactionDB extends DatabaseRecord {
  farmer_id: string;
  crop_id?: string;
  type: 'purchase' | 'sale';
  buyer_seller: string;
  produce: string;
  quantity: number;
  price_per_kg: number;
  total_amount: number;
  transaction_date: string;
  payment_status: 'pending' | 'partial' | 'paid';
  delivery_status: 'pending' | 'delivered';
  notes?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Sync and offline types
export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

// Authentication types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'manager' | 'user';
  isActive: boolean;
  profilePicture?: string;
  phone?: string;
  organization?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'manager' | 'user';
  is_active: boolean;
  profile_picture?: string;
  phone?: string;
  organization?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'manager' | 'user';
  organization?: string;
  phone?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}