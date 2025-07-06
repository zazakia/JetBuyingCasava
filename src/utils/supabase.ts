import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { 
  SupabaseConfig, 
  Farmer, 
  Land, 
  Crop, 
  Transaction,
  FarmerDB,
  LandDB,
  CropDB,
  TransactionDB,
  ApiResponse,
  OfflineAction,
  SyncResult
} from '../types';

let supabaseClient: SupabaseClient | null = null;

// Configuration management
export const getSupabaseConfig = (): SupabaseConfig => {
  const url = localStorage.getItem('supabase_url') || '';
  const apiKey = localStorage.getItem('supabase_api_key') || '';
  return {
    url,
    apiKey,
    isConfigured: url !== '' && apiKey !== ''
  };
};

export const saveSupabaseConfig = (config: SupabaseConfig): void => {
  localStorage.setItem('supabase_url', config.url);
  localStorage.setItem('supabase_api_key', config.apiKey);
};

export const clearSupabaseConfig = (): void => {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_api_key');
  supabaseClient = null;
};

// URL validation
export const isValidSupabaseUrl = (url: string): boolean => {
  const pattern = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/;
  return pattern.test(url);
};

// API key validation
export const isValidApiKey = (key: string): boolean => {
  return key.length >= 100 && key.startsWith('eyJ');
};

// Get or create Supabase client
export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  
  if (!config.isConfigured) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(config.url, config.apiKey);
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  }

  return supabaseClient;
};

// Test connection
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  
  if (!client) {
    return { success: false, message: 'Supabase not configured' };
  }

  try {
    const { data, error } = await client.from('farmers').select('count', { count: 'exact', head: true });
    
    if (error) {
      return { success: false, message: error.message };
    }
    
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, message: 'Connection failed' };
  }
};

// Data transformation utilities
const transformFarmerFromDB = (farmer: FarmerDB): Farmer => ({
  id: farmer.id,
  firstName: farmer.first_name,
  lastName: farmer.last_name,
  phone: farmer.phone,
  address: farmer.address,
  barangay: farmer.barangay,
  municipality: farmer.municipality,
  province: farmer.province,
  totalHectares: farmer.total_hectares,
  datePlanted: farmer.date_planted,
  dateHarvested: farmer.date_harvested,
  dateRegistered: farmer.date_registered,
  isActive: farmer.is_active,
  profilePicture: farmer.profile_picture
});

const transformFarmerToDB = (farmer: Farmer): Omit<FarmerDB, 'id' | 'created_at' | 'updated_at' | 'user_id'> => ({
  first_name: farmer.firstName,
  last_name: farmer.lastName,
  phone: farmer.phone,
  address: farmer.address,
  barangay: farmer.barangay,
  municipality: farmer.municipality,
  province: farmer.province,
  total_hectares: farmer.totalHectares,
  date_planted: farmer.datePlanted,
  date_harvested: farmer.dateHarvested,
  date_registered: farmer.dateRegistered,
  is_active: farmer.isActive,
  profile_picture: farmer.profilePicture
});

const transformLandFromDB = (land: LandDB): Land => ({
  id: land.id,
  farmerId: land.farmer_id,
  name: land.name,
  area: land.area,
  location: land.location,
  barangay: land.barangay,
  municipality: land.municipality,
  province: land.province,
  soilType: land.soil_type,
  coordinates: land.coordinates,
  dateAcquired: land.date_acquired
});

const transformLandToDB = (land: Land): Omit<LandDB, 'id' | 'created_at' | 'updated_at' | 'user_id'> => ({
  farmer_id: land.farmerId,
  name: land.name,
  area: land.area,
  location: land.location,
  barangay: land.barangay,
  municipality: land.municipality,
  province: land.province,
  soil_type: land.soilType,
  coordinates: land.coordinates,
  date_acquired: land.dateAcquired
});

const transformCropFromDB = (crop: CropDB): Crop => ({
  id: crop.id,
  landId: crop.land_id,
  farmerId: crop.farmer_id,
  cropType: crop.crop_type,
  variety: crop.variety,
  plantingDate: crop.planting_date,
  expectedHarvestDate: crop.expected_harvest_date,
  actualHarvestDate: crop.actual_harvest_date,
  areaPlanted: crop.area_planted,
  expectedYield: crop.expected_yield,
  actualYield: crop.actual_yield,
  status: crop.status,
  notes: crop.notes
});

const transformCropToDB = (crop: Crop): Omit<CropDB, 'id' | 'created_at' | 'updated_at' | 'user_id'> => ({
  land_id: crop.landId,
  farmer_id: crop.farmerId,
  crop_type: crop.cropType,
  variety: crop.variety,
  planting_date: crop.plantingDate,
  expected_harvest_date: crop.expectedHarvestDate,
  actual_harvest_date: crop.actualHarvestDate,
  area_planted: crop.areaPlanted,
  expected_yield: crop.expectedYield,
  actual_yield: crop.actualYield,
  status: crop.status,
  notes: crop.notes
});

const transformTransactionFromDB = (transaction: TransactionDB): Transaction => ({
  id: transaction.id,
  farmerId: transaction.farmer_id,
  cropId: transaction.crop_id,
  type: transaction.type,
  buyerSeller: transaction.buyer_seller,
  produce: transaction.produce,
  quantity: transaction.quantity,
  pricePerKg: transaction.price_per_kg,
  totalAmount: transaction.total_amount,
  transactionDate: transaction.transaction_date,
  paymentStatus: transaction.payment_status,
  deliveryStatus: transaction.delivery_status,
  notes: transaction.notes
});

const transformTransactionToDB = (transaction: Transaction): Omit<TransactionDB, 'id' | 'created_at' | 'updated_at' | 'user_id'> => ({
  farmer_id: transaction.farmerId,
  crop_id: transaction.cropId,
  type: transaction.type,
  buyer_seller: transaction.buyerSeller,
  produce: transaction.produce,
  quantity: transaction.quantity,
  price_per_kg: transaction.pricePerKg,
  total_amount: transaction.totalAmount,
  transaction_date: transaction.transactionDate,
  payment_status: transaction.paymentStatus,
  delivery_status: transaction.deliveryStatus,
  notes: transaction.notes
});

// Offline support utilities
const getOfflineActions = (): OfflineAction[] => {
  const actions = localStorage.getItem('offline_actions');
  return actions ? JSON.parse(actions) : [];
};

const saveOfflineAction = (action: OfflineAction): void => {
  const actions = getOfflineActions();
  actions.push(action);
  localStorage.setItem('offline_actions', JSON.stringify(actions));
};

const removeOfflineAction = (actionId: string): void => {
  const actions = getOfflineActions().filter(a => a.id !== actionId);
  localStorage.setItem('offline_actions', JSON.stringify(actions));
};

const generateId = (): string => {
  return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Generic CRUD operations with offline support
const createRecord = async <T, TDB>(
  table: string,
  data: T,
  transformer: (data: T) => Omit<TDB, 'id' | 'created_at' | 'updated_at' | 'user_id'>,
  reverseTransformer: (data: TDB) => T
): Promise<ApiResponse<T>> => {
  const client = getSupabaseClient();
  
  if (!client) {
    // Store offline
    const tempId = generateId();
    const offlineAction: OfflineAction = {
      id: tempId,
      type: 'CREATE',
      table: table as any,
      data: { ...data, id: tempId },
      timestamp: new Date().toISOString(),
      synced: false
    };
    saveOfflineAction(offlineAction);
    
    return {
      data: { ...data, id: tempId } as T,
      error: null,
      loading: false
    };
  }

  try {
    const dbData = transformer(data);
    const { data: result, error } = await client
      .from(table)
      .insert(dbData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data: reverseTransformer(result),
      error: null,
      loading: false
    };
  } catch (error) {
    // Store offline as fallback
    const tempId = generateId();
    const offlineAction: OfflineAction = {
      id: tempId,
      type: 'CREATE',
      table: table as any,
      data: { ...data, id: tempId },
      timestamp: new Date().toISOString(),
      synced: false
    };
    saveOfflineAction(offlineAction);

    return {
      data: { ...data, id: tempId } as T,
      error: `Offline: ${error instanceof Error ? error.message : 'Unknown error'}`,
      loading: false
    };
  }
};

const updateRecord = async <T, TDB>(
  table: string,
  id: string,
  data: T,
  transformer: (data: T) => Omit<TDB, 'id' | 'created_at' | 'updated_at' | 'user_id'>,
  reverseTransformer: (data: TDB) => T
): Promise<ApiResponse<T>> => {
  const client = getSupabaseClient();
  
  if (!client) {
    // Store offline
    const offlineAction: OfflineAction = {
      id: generateId(),
      type: 'UPDATE',
      table: table as any,
      data: { ...data, id },
      timestamp: new Date().toISOString(),
      synced: false
    };
    saveOfflineAction(offlineAction);
    
    return {
      data: { ...data, id } as T,
      error: null,
      loading: false
    };
  }

  try {
    const dbData = transformer(data);
    const { data: result, error } = await client
      .from(table)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data: reverseTransformer(result),
      error: null,
      loading: false
    };
  } catch (error) {
    // Store offline as fallback
    const offlineAction: OfflineAction = {
      id: generateId(),
      type: 'UPDATE',
      table: table as any,
      data: { ...data, id },
      timestamp: new Date().toISOString(),
      synced: false
    };
    saveOfflineAction(offlineAction);

    return {
      data: { ...data, id } as T,
      error: `Offline: ${error instanceof Error ? error.message : 'Unknown error'}`,
      loading: false
    };
  }
};

const deleteRecord = async (table: string, id: string): Promise<ApiResponse<boolean>> => {
  const client = getSupabaseClient();
  
  if (!client) {
    // Store offline
    const offlineAction: OfflineAction = {
      id: generateId(),
      type: 'DELETE',
      table: table as any,
      data: { id },
      timestamp: new Date().toISOString(),
      synced: false
    };
    saveOfflineAction(offlineAction);
    
    return {
      data: true,
      error: null,
      loading: false
    };
  }

  try {
    const { error } = await client
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return {
      data: true,
      error: null,
      loading: false
    };
  } catch (error) {
    // Store offline as fallback
    const offlineAction: OfflineAction = {
      id: generateId(),
      type: 'DELETE',
      table: table as any,
      data: { id },
      timestamp: new Date().toISOString(),
      synced: false
    };
    saveOfflineAction(offlineAction);

    return {
      data: true,
      error: `Offline: ${error instanceof Error ? error.message : 'Unknown error'}`,
      loading: false
    };
  }
};

const fetchRecords = async <T, TDB>(
  table: string,
  reverseTransformer: (data: TDB) => T
): Promise<ApiResponse<T[]>> => {
  const client = getSupabaseClient();
  
  if (!client) {
    return {
      data: [],
      error: 'Supabase not configured',
      loading: false
    };
  }

  try {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return {
      data: data?.map(reverseTransformer) || [],
      error: null,
      loading: false
    };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      loading: false
    };
  }
};

// Specific CRUD operations for each entity
export const farmerOperations = {
  create: (farmer: Farmer) => createRecord('farmers', farmer, transformFarmerToDB, transformFarmerFromDB),
  update: (id: string, farmer: Farmer) => updateRecord('farmers', id, farmer, transformFarmerToDB, transformFarmerFromDB),
  delete: (id: string) => deleteRecord('farmers', id),
  fetchAll: () => fetchRecords('farmers', transformFarmerFromDB)
};

export const landOperations = {
  create: (land: Land) => createRecord('lands', land, transformLandToDB, transformLandFromDB),
  update: (id: string, land: Land) => updateRecord('lands', id, land, transformLandToDB, transformLandFromDB),
  delete: (id: string) => deleteRecord('lands', id),
  fetchAll: () => fetchRecords('lands', transformLandFromDB)
};

export const cropOperations = {
  create: (crop: Crop) => createRecord('crops', crop, transformCropToDB, transformCropFromDB),
  update: (id: string, crop: Crop) => updateRecord('crops', id, crop, transformCropToDB, transformCropFromDB),
  delete: (id: string) => deleteRecord('crops', id),
  fetchAll: () => fetchRecords('crops', transformCropFromDB)
};

export const transactionOperations = {
  create: (transaction: Transaction) => createRecord('transactions', transaction, transformTransactionToDB, transformTransactionFromDB),
  update: (id: string, transaction: Transaction) => updateRecord('transactions', id, transaction, transformTransactionToDB, transformTransactionFromDB),
  delete: (id: string) => deleteRecord('transactions', id),
  fetchAll: () => fetchRecords('transactions', transformTransactionFromDB)
};

// Sync functionality
export const syncOfflineActions = async (): Promise<SyncResult> => {
  const client = getSupabaseClient();
  const actions = getOfflineActions();
  
  if (!client || actions.length === 0) {
    return { success: true, synced: 0, failed: 0, errors: [] };
  }

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const action of actions) {
    try {
      if (action.type === 'CREATE') {
        let transformer: any;
        const table = action.table;
        
        switch (table) {
          case 'farmers':
            transformer = transformFarmerToDB;
            break;
          case 'lands':
            transformer = transformLandToDB;
            break;
          case 'crops':
            transformer = transformCropToDB;
            break;
          case 'transactions':
            transformer = transformTransactionToDB;
            break;
          default:
            throw new Error(`Unknown table: ${table}`);
        }

        const dbData = transformer(action.data);
        const { error } = await client.from(table).insert(dbData);
        
        if (error) throw error;
        
      } else if (action.type === 'UPDATE') {
        let transformer: any;
        const table = action.table;
        
        switch (table) {
          case 'farmers':
            transformer = transformFarmerToDB;
            break;
          case 'lands':
            transformer = transformLandToDB;
            break;
          case 'crops':
            transformer = transformCropToDB;
            break;
          case 'transactions':
            transformer = transformTransactionToDB;
            break;
          default:
            throw new Error(`Unknown table: ${table}`);
        }

        const dbData = transformer(action.data);
        const { error } = await client
          .from(table)
          .update(dbData)
          .eq('id', action.data.id);
        
        if (error) throw error;
        
      } else if (action.type === 'DELETE') {
        const { error } = await client
          .from(action.table)
          .delete()
          .eq('id', action.data.id);
        
        if (error) throw error;
      }

      removeOfflineAction(action.id);
      synced++;
    } catch (error) {
      failed++;
      errors.push(`${action.type} ${action.table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { success: failed === 0, synced, failed, errors };
};

// Get pending sync count
export const getPendingSyncCount = (): number => {
  return getOfflineActions().length;
};

// Check online status
export const isOnline = (): boolean => {
  return navigator.onLine;
}; 