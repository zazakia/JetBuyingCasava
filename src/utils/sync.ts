import { 
  syncOfflineActions, 
  getPendingSyncCount,
  isOnline,
  farmerOperations,
  landOperations,
  cropOperations,
  transactionOperations
} from './supabase';
import type { 
  Farmer, 
  Land, 
  Crop, 
  Transaction, 
  SyncStatus, 
  SyncResult,
  LoadingState 
} from '../types';

// Sync status management
let syncStatus: SyncStatus = {
  lastSync: null,
  pendingChanges: 0,
  isOnline: navigator.onLine,
  isSyncing: false
};

// Event listeners for sync status updates
const syncStatusListeners: Array<(status: SyncStatus) => void> = [];

export const addSyncStatusListener = (listener: (status: SyncStatus) => void): void => {
  syncStatusListeners.push(listener);
};

export const removeSyncStatusListener = (listener: (status: SyncStatus) => void): void => {
  const index = syncStatusListeners.indexOf(listener);
  if (index > -1) {
    syncStatusListeners.splice(index, 1);
  }
};

const updateSyncStatus = (updates: Partial<SyncStatus>): void => {
  syncStatus = { ...syncStatus, ...updates };
  syncStatusListeners.forEach(listener => listener(syncStatus));
};

// Initialize sync status
export const initializeSyncStatus = (): void => {
  const lastSync = localStorage.getItem('last_sync');
  updateSyncStatus({
    lastSync,
    pendingChanges: getPendingSyncCount(),
    isOnline: isOnline(),
    isSyncing: false
  });

  // Listen for online/offline events
  window.addEventListener('online', () => {
    updateSyncStatus({ isOnline: true });
    // Auto-sync when coming back online
    if (getPendingSyncCount() > 0) {
      performFullSync();
    }
  });

  window.addEventListener('offline', () => {
    updateSyncStatus({ isOnline: false });
  });
};

// Get current sync status
export const getSyncStatus = (): SyncStatus => syncStatus;

// Local data management
const getLocalData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveLocalData = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Data keys
const DATA_KEYS = {
  farmers: 'agritracker_farmers',
  lands: 'agritracker_lands',
  crops: 'agritracker_crops',
  transactions: 'agritracker_transactions'
};

// Sync individual entity types
export const syncFarmers = async (): Promise<LoadingState & { data: Farmer[] }> => {
  const state: LoadingState & { data: Farmer[] } = {
    isLoading: true,
    error: null,
    lastUpdated: null,
    data: getLocalData<Farmer>(DATA_KEYS.farmers)
  };

  try {
    if (isOnline()) {
      const response = await farmerOperations.fetchAll();
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        state.data = response.data;
        saveLocalData(DATA_KEYS.farmers, response.data);
        state.lastUpdated = new Date().toISOString();
      }
    }

    state.isLoading = false;
    return state;
  } catch (error) {
    state.isLoading = false;
    state.error = error instanceof Error ? error.message : 'Failed to sync farmers';
    return state;
  }
};

export const syncLands = async (): Promise<LoadingState & { data: Land[] }> => {
  const state: LoadingState & { data: Land[] } = {
    isLoading: true,
    error: null,
    lastUpdated: null,
    data: getLocalData<Land>(DATA_KEYS.lands)
  };

  try {
    if (isOnline()) {
      const response = await landOperations.fetchAll();
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        state.data = response.data;
        saveLocalData(DATA_KEYS.lands, response.data);
        state.lastUpdated = new Date().toISOString();
      }
    }

    state.isLoading = false;
    return state;
  } catch (error) {
    state.isLoading = false;
    state.error = error instanceof Error ? error.message : 'Failed to sync lands';
    return state;
  }
};

export const syncCrops = async (): Promise<LoadingState & { data: Crop[] }> => {
  const state: LoadingState & { data: Crop[] } = {
    isLoading: true,
    error: null,
    lastUpdated: null,
    data: getLocalData<Crop>(DATA_KEYS.crops)
  };

  try {
    if (isOnline()) {
      const response = await cropOperations.fetchAll();
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        state.data = response.data;
        saveLocalData(DATA_KEYS.crops, response.data);
        state.lastUpdated = new Date().toISOString();
      }
    }

    state.isLoading = false;
    return state;
  } catch (error) {
    state.isLoading = false;
    state.error = error instanceof Error ? error.message : 'Failed to sync crops';
    return state;
  }
};

export const syncTransactions = async (): Promise<LoadingState & { data: Transaction[] }> => {
  const state: LoadingState & { data: Transaction[] } = {
    isLoading: true,
    error: null,
    lastUpdated: null,
    data: getLocalData<Transaction>(DATA_KEYS.transactions)
  };

  try {
    if (isOnline()) {
      const response = await transactionOperations.fetchAll();
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        state.data = response.data;
        saveLocalData(DATA_KEYS.transactions, response.data);
        state.lastUpdated = new Date().toISOString();
      }
    }

    state.isLoading = false;
    return state;
  } catch (error) {
    state.isLoading = false;
    state.error = error instanceof Error ? error.message : 'Failed to sync transactions';
    return state;
  }
};

// Perform full synchronization
export const performFullSync = async (): Promise<SyncResult> => {
  if (!isOnline()) {
    return {
      success: false,
      synced: 0,
      failed: 0,
      errors: ['Device is offline']
    };
  }

  updateSyncStatus({ isSyncing: true });

  try {
    // First, sync offline actions to server
    const offlineResult = await syncOfflineActions();
    
    // Then, fetch latest data from server
    const [farmersResult, landsResult, cropsResult, transactionsResult] = await Promise.all([
      syncFarmers(),
      syncLands(),
      syncCrops(),
      syncTransactions()
    ]);

    const errors: string[] = [...offlineResult.errors];
    
    if (farmersResult.error) errors.push(`Farmers: ${farmersResult.error}`);
    if (landsResult.error) errors.push(`Lands: ${landsResult.error}`);
    if (cropsResult.error) errors.push(`Crops: ${cropsResult.error}`);
    if (transactionsResult.error) errors.push(`Transactions: ${transactionsResult.error}`);

    const success = errors.length === 0;
    const lastSync = new Date().toISOString();
    
    if (success) {
      localStorage.setItem('last_sync', lastSync);
    }

    updateSyncStatus({
      lastSync: success ? lastSync : syncStatus.lastSync,
      pendingChanges: getPendingSyncCount(),
      isSyncing: false
    });

    return {
      success,
      synced: offlineResult.synced,
      failed: offlineResult.failed + errors.length - offlineResult.errors.length,
      errors
    };
  } catch (error) {
    updateSyncStatus({ isSyncing: false });
    
    return {
      success: false,
      synced: 0,
      failed: 1,
      errors: [error instanceof Error ? error.message : 'Sync failed']
    };
  }
};

// Auto-sync functionality
let autoSyncInterval: NodeJS.Timeout | null = null;

export const startAutoSync = (intervalMinutes: number = 5): void => {
  stopAutoSync();
  
  autoSyncInterval = setInterval(() => {
    if (isOnline() && !syncStatus.isSyncing && getPendingSyncCount() > 0) {
      performFullSync();
    }
  }, intervalMinutes * 60 * 1000);
};

export const stopAutoSync = (): void => {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
};

// Data access functions for components
export const getLocalFarmers = (): Farmer[] => getLocalData<Farmer>(DATA_KEYS.farmers);
export const getLocalLands = (): Land[] => getLocalData<Land>(DATA_KEYS.lands);
export const getLocalCrops = (): Crop[] => getLocalData<Crop>(DATA_KEYS.crops);
export const getLocalTransactions = (): Transaction[] => getLocalData<Transaction>(DATA_KEYS.transactions);

// Update local data when operations are performed
export const updateLocalFarmers = (farmers: Farmer[]): void => {
  saveLocalData(DATA_KEYS.farmers, farmers);
  updateSyncStatus({ pendingChanges: getPendingSyncCount() });
};

export const updateLocalLands = (lands: Land[]): void => {
  saveLocalData(DATA_KEYS.lands, lands);
  updateSyncStatus({ pendingChanges: getPendingSyncCount() });
};

export const updateLocalCrops = (crops: Crop[]): void => {
  saveLocalData(DATA_KEYS.crops, crops);
  updateSyncStatus({ pendingChanges: getPendingSyncCount() });
};

export const updateLocalTransactions = (transactions: Transaction[]): void => {
  saveLocalData(DATA_KEYS.transactions, transactions);
  updateSyncStatus({ pendingChanges: getPendingSyncCount() });
};

// Conflict resolution (simple last-write-wins for now)
export const resolveConflicts = async <T extends { id: string }>(
  localData: T[],
  remoteData: T[]
): Promise<T[]> => {
  const merged: T[] = [...remoteData];
  
  // Add local items that don't exist remotely (offline created items)
  localData.forEach(localItem => {
    if (!remoteData.find(remoteItem => remoteItem.id === localItem.id)) {
      merged.push(localItem);
    }
  });
  
  return merged;
};

// Initialize sync on module load
initializeSyncStatus();