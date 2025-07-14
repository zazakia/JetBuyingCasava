import { Farmer, Land, Crop, Transaction } from '../types';
import { offlineSyncService } from './offlineSync';

// Types
export interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  pending: number;
  inProgress: number;
  failed: number;
}

export interface SyncResult<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Local storage keys
const STORAGE_KEYS = {
  FARMERS: 'jetbuyingcasava_farmers',
  LANDS: 'jetbuyingcasava_lands',
  CROPS: 'jetbuyingcasava_crops',
  TRANSACTIONS: 'jetbuyingcasava_transactions',
  LAST_SYNC: 'jetbuyingcasava_last_sync'
};

// Get data from local storage
const getLocalData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting ${key} from local storage:`, error);
    return [];
  }
};

// Save data to local storage
const saveLocalData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to local storage:`, error);
  }
};

// Local data getters
export const getLocalFarmers = (): Farmer[] => getLocalData<Farmer>(STORAGE_KEYS.FARMERS);
export const getLocalLands = (): Land[] => getLocalData<Land>(STORAGE_KEYS.LANDS);
export const getLocalCrops = (): Crop[] => getLocalData<Crop>(STORAGE_KEYS.CROPS);
export const getLocalTransactions = (): Transaction[] => getLocalData<Transaction>(STORAGE_KEYS.TRANSACTIONS);

// Local data setters
export const updateLocalFarmers = (farmers: Farmer[]): void => saveLocalData(STORAGE_KEYS.FARMERS, farmers);
export const updateLocalLands = (lands: Land[]): void => saveLocalData(STORAGE_KEYS.LANDS, lands);
export const updateLocalCrops = (crops: Crop[]): void => saveLocalData(STORAGE_KEYS.CROPS, crops);
export const updateLocalTransactions = (transactions: Transaction[]): void => saveLocalData(STORAGE_KEYS.TRANSACTIONS, transactions);

// Initialize sync status
export const initializeSyncStatus = (): SyncStatus => ({
  isOnline: navigator.onLine,
  lastSync: localStorage.getItem(STORAGE_KEYS.LAST_SYNC),
  pending: 0,
  inProgress: 0,
  failed: 0
});

// Get current sync status
export const getSyncStatus = (): SyncStatus => ({
  isOnline: navigator.onLine,
  lastSync: localStorage.getItem(STORAGE_KEYS.LAST_SYNC),
  ...offlineSyncService.getStatus()
});

// Check if Supabase is configured
export const getSupabaseConfig = () => ({
  isConfigured: !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY
});

// Start auto-sync
export const startAutoSync = (intervalMinutes: number) => {
  const intervalMs = intervalMinutes * 60 * 1000;
  return setInterval(async () => {
    if (navigator.onLine) {
      await performFullSync();
    }
  }, intervalMs);
};

// Perform full sync of all data
export const performFullSync = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const results = await Promise.all([
      syncFarmers(),
      syncLands(),
      syncCrops(),
      syncTransactions()
    ]);

    const allSuccess = results.every(result => !result.error);
    if (allSuccess) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    }

    return { success: allSuccess };
  } catch (error) {
    console.error('Full sync failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Individual sync functions
const syncFarmers = async (): Promise<SyncResult<Farmer>> => {
  try {
    const { data, error } = await offlineSyncService.sync<Farmer>('jetbuyingcasava_farmers');
    return {
      data: data || [],
      isLoading: false,
      error: error?.message || null,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error syncing farmers:', error);
    return {
      data: [],
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to sync farmers',
      lastUpdated: null
    };
  }
};

const syncLands = async (): Promise<SyncResult<Land>> => {
  try {
    const { data, error } = await offlineSyncService.sync<Land>('jetbuyingcasava_lands');
    return {
      data: data || [],
      isLoading: false,
      error: error?.message || null,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error syncing lands:', error);
    return {
      data: [],
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to sync lands',
      lastUpdated: null
    };
  }
};

const syncCrops = async (): Promise<SyncResult<Crop>> => {
  try {
    const { data, error } = await offlineSyncService.sync<Crop>('jetbuyingcasava_crops');
    return {
      data: data || [],
      isLoading: false,
      error: error?.message || null,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error syncing crops:', error);
    return {
      data: [],
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to sync crops',
      lastUpdated: null
    };
  }
};

const syncTransactions = async (): Promise<SyncResult<Transaction>> => {
  try {
    const { data, error } = await offlineSyncService.sync<Transaction>('jetbuyingcasava_transactions');
    return {
      data: data || [],
      isLoading: false,
      error: error?.message || null,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error syncing transactions:', error);
    return {
      data: [],
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to sync transactions',
      lastUpdated: null
    };
  }
};

// Export all sync functions
export {
  syncFarmers,
  syncLands,
  syncCrops,
  syncTransactions
};

// Event listeners for online/offline status
window.addEventListener('online', () => {
  offlineSyncService.setOnline(true);
  performFullSync();
});

window.addEventListener('offline', () => {
  offlineSyncService.setOnline(false);
});
