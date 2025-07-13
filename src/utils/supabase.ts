import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
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
import { syncQueue } from './syncQueue';

let supabaseClient: SupabaseClient<Database> | null = null;

// Types for connection health
type ConnectionHealth = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  latency?: number;
  lastChecked: string;
};

// Cache for connection health
let connectionHealth: ConnectionHealth | null = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

// Configuration management - Environment variables only
// SECURITY: API keys are ONLY loaded from environment variables and NEVER stored in localStorage or persisted in the browser.
export const getSupabaseConfig = (): SupabaseConfig => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  // Enforce SSL for production connections (must use https unless localhost)
  if (url && !url.startsWith('https://') && !url.includes('localhost')) {
    throw new Error('Supabase URL must use https:// for secure connections.');
  }

  return {
    url,
    apiKey,
    isConfigured: url !== '' && apiKey !== ''
  };
};


// Get or create Supabase client
export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  
  if (!config.isConfigured) {
    console.log('Supabase not configured - running in offline mode');
    return null;
  }

  // Basic URL validation
  if (!config.url.toLowerCase().includes('supabase.co') && !config.url.includes('localhost')) {
    console.error('Invalid Supabase URL format:', config.url);
    return null;
  }

  if (!supabaseClient) {
    try {
      // Create client with proper typing
      supabaseClient = createClient<Database>(config.url, config.apiKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        global: {
          headers: {
            'X-Client-Info': 'agritracker-web/1.0',
            'X-Request-Id': crypto.randomUUID()
          }
        }
      });

      // Add request/response monitoring using the Supabase realtime API
      // We'll use the built-in fetch interceptor for monitoring
      const originalFetch = globalThis.fetch;
      
      // Create a type-safe fetch wrapper
      const fetchWithMonitoring = async (
        input: RequestInfo | URL, 
        init?: RequestInit
      ): Promise<Response> => {
        const url = input instanceof URL ? input.toString() : 
                  typeof input === 'string' ? input : input.url || '';
                  
        const method = init?.method || 'GET';
        const startTime = performance.now();
        
        console.debug('[Supabase] Request:', {
          url,
          method,
          timestamp: new Date().toISOString()
        });
        
        try {
          const response = await originalFetch(input, init);
          const responseTime = Math.round(performance.now() - startTime);
          
          console.debug('[Supabase] Response:', {
            status: response.status,
            url,
            method,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString()
          });
          
          // Update connection health on responses
          if (response.status >= 200 && response.status < 300) {
            updateConnectionHealth(true, responseTime);
          } else {
            updateConnectionHealth(false, undefined, `HTTP ${response.status}`);
          }
          
          return response;
        } catch (error) {
          const responseTime = Math.round(performance.now() - startTime);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('[Supabase] Request failed:', { url, method, error: errorMessage });
          updateConnectionHealth(false, responseTime, errorMessage);
          throw error;
        }
      };
      
      // Override the global fetch
      globalThis.fetch = fetchWithMonitoring;
      
      return supabaseClient;
    } catch (error) {
      console.error('[Supabase] Failed to create client:', error);
      updateConnectionHealth(false, undefined, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  return supabaseClient;
};

// Update connection health based on the latest request/response
const updateConnectionHealth = (
  success: boolean,
  latency?: number,
  errorMessage?: string
): void => {
  const now = Date.now();
  const lastChecked = new Date(now).toISOString();
  
  if (success) {
    const status = latency && latency > 1000 ? 'degraded' : 'healthy';
    connectionHealth = {
      status,
      message: status === 'healthy' 
        ? 'Connection is healthy' 
        : `High latency: ${latency}ms`,
      latency,
      lastChecked
    };
  } else {
    connectionHealth = {
      status: 'unhealthy',
      message: errorMessage || 'Connection failed',
      lastChecked
    };
  }
  
  lastHealthCheck = now;
};

/**
 * Check the health of the database connection
 * @param force Force a new health check even if the last one was recent
 * @returns Promise with connection health status
 */
export const checkConnectionHealth = async (force = false): Promise<ConnectionHealth> => {
  const now = Date.now();
  
  // Return cached health if it's still fresh
  if (!force && connectionHealth && (now - lastHealthCheck) < HEALTH_CHECK_INTERVAL) {
    return connectionHealth;
  }
  
  const client = getSupabaseClient();
  if (!client) {
    connectionHealth = {
      status: 'unhealthy',
      message: 'Supabase client not initialized',
      lastChecked: new Date().toISOString()
    };
    return connectionHealth;
  }
  
  try {
    const startTime = performance.now();
    
    // Use a lightweight query to test the connection
    // Use a type-safe query with the correct schema
    const { error } = await client
      .from('farmers')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    const latency = Math.round(performance.now() - startTime);
    
    if (error) {
      // No rows is actually a successful connection
      if (error.code === 'PGRST116') {
        updateConnectionHealth(true, latency);
      } else {
        updateConnectionHealth(false, undefined, `Database error: ${error.message}`);
      }
    } else {
      updateConnectionHealth(true, latency);
    }
  } catch (error) {
    updateConnectionHealth(
      false, 
      undefined, 
      `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
  
  return connectionHealth!;
};

// Test connection with retry logic
export const testConnection = async (maxRetries = 2): Promise<{ success: boolean; message: string; latency?: number }> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const health = await checkConnectionHealth(true);
      
      if (health.status === 'healthy' || health.status === 'degraded') {
        return { 
          success: true, 
          message: health.message,
          latency: health.latency
        };
      }
      
      lastError = new Error(health.message);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error during connection test');
    }
    
    // If not the last attempt, wait before retrying
    if (attempt <= maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
  
  return { 
    success: false, 
    message: `Connection failed after ${maxRetries + 1} attempts: ${lastError?.message}` 
  };
};

// Legacy testConnection - now a wrapper around the new implementation
export const testConnectionLegacy = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const result = await checkConnectionHealth(true);
    return {
      success: result.status !== 'unhealthy',
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed',
    };
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
// SECURITY: Only non-sensitive, non-auth data is stored in offline_actions. No API keys or user credentials are ever stored here.
// TODO: Implement client-side encryption for offline_actions in the future for additional security.
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

// Use crypto.randomUUID() for secure, collision-resistant IDs if available
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
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
      .from(`jetagritracker.${table}`)
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
      .from(`jetagritracker.${table}`)
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
      .from(`jetagritracker.${table}`)
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
      .from(`jetagritracker.${table}`)
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
  create: async (farmer: Farmer) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // Offline - add to sync queue
      // Add to sync queue and get operation ID
      const operationId = await syncQueue.addOperation({
        type: 'CREATE',
        table: 'farmers',
        data: farmer,
      });
      return {
        data: { ...farmer, id: operationId, _local: true } as Farmer,
        error: null,
        status: 202,
        statusText: 'Queued for sync',
      };
    }
    return createRecord<Farmer, FarmerDB>('farmers', farmer, transformFarmerToDB, transformFarmerFromDB);
  },
  
  update: async (id: string, farmer: Farmer) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // Offline - add to sync queue
      // Add to sync queue and get operation ID
      await syncQueue.addOperation({
        type: 'UPDATE',
        table: 'farmers',
        data: { ...farmer, id },
      });
      return {
        data: { ...farmer, _local: true } as Farmer,
        error: null,
        status: 202,
        statusText: 'Queued for sync',
      };
    }
    return updateRecord<Farmer, FarmerDB>('farmers', id, farmer, transformFarmerToDB, transformFarmerFromDB);
  },
  
  delete: async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // Offline - add to sync queue
      // Add to sync queue and get operation ID
      await syncQueue.addOperation({
        type: 'DELETE',
        table: 'farmers',
        data: { id },
      });
      return {
        data: true,
        error: null,
        status: 202,
        statusText: 'Delete queued for sync',
      };
    }
    return deleteRecord('farmers', id);
  },
  
  fetchAll: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // Return local data when offline
      const localFarmers = JSON.parse(localStorage.getItem('farmers') || '[]');
      return {
        data: localFarmers,
        error: null,
        status: 200,
        statusText: 'OK (offline)',
      };
    }
    return fetchRecords<Farmer, FarmerDB>('farmers', transformFarmerFromDB);
  }
};

export const landOperations = {
  create: async (land: Land) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const operationId = await syncQueue.addOperation({
        type: 'CREATE',
        table: 'lands',
        data: land,
      });
      return {
        data: { ...land, id: operationId, _local: true } as Land,
        error: null,
        status: 202,
        statusText: 'Queued for sync',
      };
    }
    return createRecord<Land, LandDB>('lands', land, transformLandToDB, transformLandFromDB);
  },
  
  update: async (id: string, land: Land) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      await syncQueue.addOperation({
        type: 'UPDATE',
        table: 'lands',
        data: { ...land, id },
      });
      return {
        data: { ...land, _local: true } as Land,
        error: null,
        status: 202,
        statusText: 'Queued for sync',
      };
    }
    return updateRecord<Land, LandDB>('lands', id, land, transformLandToDB, transformLandFromDB);
  },
  
  delete: async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      await syncQueue.addOperation({
        type: 'DELETE',
        table: 'lands',
        data: { id },
      });
      return {
        data: true,
        error: null,
        status: 202,
        statusText: 'Delete queued for sync',
      };
    }
    return deleteRecord('lands', id);
  },
  
  fetchAll: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const localLands = JSON.parse(localStorage.getItem('lands') || '[]');
      return {
        data: localLands,
        error: null,
        status: 200,
        statusText: 'OK (offline)',
      };
    }
    return fetchRecords<Land, LandDB>('lands', transformLandFromDB);
  }
};

export const cropOperations = {
  create: async (crop: Crop) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const operationId = await syncQueue.addOperation({
        type: 'CREATE',
        table: 'crops',
        data: crop,
      });
      return {
        data: { ...crop, id: operationId, _local: true } as Crop,
        error: null,
        status: 202,
        statusText: 'Queued for sync',
      };
    }
    return createRecord<Crop, CropDB>('crops', crop, transformCropToDB, transformCropFromDB);
  },
  
  update: async (id: string, crop: Crop) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      await syncQueue.addOperation({
        type: 'UPDATE',
        table: 'crops',
        data: { ...crop, id },
      });
      return {
        data: { ...crop, _local: true } as Crop,
        error: null,
        status: 202,
        statusText: 'Queued for sync',
      };
    }
    return updateRecord<Crop, CropDB>('crops', id, crop, transformCropToDB, transformCropFromDB);
  },
  
  delete: async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      await syncQueue.addOperation({
        type: 'DELETE',
        table: 'crops',
        data: { id },
      });
      return {
        data: true,
        error: null,
        status: 202,
        statusText: 'Delete queued for sync',
      };
    }
    return deleteRecord('crops', id);
  },
  
  fetchAll: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const localCrops = JSON.parse(localStorage.getItem('crops') || '[]');
      return {
        data: localCrops,
        error: null,
        status: 200,
        statusText: 'OK (offline)',
      };
    }
    return fetchRecords<Crop, CropDB>('crops', transformCropFromDB);
  }
};

export const transactionOperations = {
  create: async (transaction: Transaction) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const operationId = await syncQueue.addOperation({
        type: 'CREATE',
        table: 'transactions',
        data: transaction,
      });
      return {
        data: { ...transaction, id: operationId, _local: true } as Transaction,
        error: null,
        status: 202,
        statusText: 'Queued for sync',
      };
    }
    return createRecord<Transaction, TransactionDB>('transactions', transaction, transformTransactionToDB, transformTransactionFromDB);
  },
  
  update: async (id: string, transaction: Transaction) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      await syncQueue.addOperation({
        type: 'UPDATE',
        table: 'transactions',
        data: { ...transaction, id },
      });
      return {
        data: { ...transaction, _local: true } as Transaction,
        error: null,
        status: 202,
        statusText: 'Queued for sync',
      };
    }
    return updateRecord<Transaction, TransactionDB>('transactions', id, transaction, transformTransactionToDB, transformTransactionFromDB);
  },
  
  delete: async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      await syncQueue.addOperation({
        type: 'DELETE',
        table: 'transactions',
        data: { id },
      });
      return {
        data: true,
        error: null,
        status: 202,
        statusText: 'Delete queued for sync',
      };
    }
    return deleteRecord('transactions', id);
  },
  
  fetchAll: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const localTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      return {
        data: localTransactions,
        error: null,
        status: 200,
        statusText: 'OK (offline)',
      };
    }
    return fetchRecords<Transaction, TransactionDB>('transactions', transformTransactionFromDB);
  }
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
        const { error } = await client.from(`jetagritracker.${table}`).insert(dbData);
        
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
          .from(`jetagritracker.${table}`)
          .update(dbData)
          .eq('id', action.data.id);
        
        if (error) throw error;
        
      } else if (action.type === 'DELETE') {
        const { error } = await client
          .from(`jetagritracker.${action.table}`)
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