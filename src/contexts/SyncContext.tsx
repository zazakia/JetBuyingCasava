import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { offlineSyncService } from '../utils/offlineSync';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  syncStatus: {
    pending: number;
    inProgress: number;
    failed: number;
    lastSync: Date | null;
  };
  syncNow: () => Promise<void>;
  getPendingOperations: () => Promise<any[]>;
  resolveConflict: (operationId: string, resolution: 'server' | 'client' | 'merge', mergedData?: any) => Promise<void>;
  currentConflict: any | null;
  setCurrentConflict: (conflict: any | null) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<any | null>(null);
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    inProgress: 0,
    failed: 0,
    lastSync: null as Date | null,
  });

  const updateSyncStatus = useCallback(async () => {
    try {
      const queue = await offlineSyncService['getQueue']();
      setSyncStatus({
        pending: queue.filter((op: any) => op.status === 'pending').length,
        inProgress: queue.filter((op: any) => op.status === 'processing').length,
        failed: queue.filter((op: any) => op.status === 'failed').length,
        lastSync: new Date(),
      });
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }, []);

  // Initial status update
  useEffect(() => {
    updateSyncStatus();
  }, [updateSyncStatus]);

  // Set up event listeners for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Process queue when coming back online
      syncNow().catch(console.error);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set up an interval to update sync status periodically
    const intervalId = setInterval(updateSyncStatus, 30000);

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [updateSyncStatus]);

  const syncNow = useCallback(async () => {
    if (isSyncing || !isOnline) return;
    
    try {
      setIsSyncing(true);
      await offlineSyncService.processQueue();
      await updateSyncStatus();
    } catch (error) {
      console.error('Error during sync:', error);
      // Check if this is a conflict error
      if (error && typeof error === 'object' && 'code' in error && error.code === 'CONFLICT') {
        setCurrentConflict({
          id: (error as any).operationId,
          table: (error as any).table,
          operation: (error as any).operation,
          localData: (error as any).localData,
          serverData: (error as any).serverData,
          error: (error as Error).message,
        });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, updateSyncStatus]);

  const getPendingOperations = useCallback(async () => {
    const queue = await offlineSyncService['getQueue']();
    return queue.filter((op: any) => op.status === 'pending' || op.status === 'failed');
  }, []);

  const resolveConflict = useCallback(
    async (operationId: string, resolution: 'server' | 'client' | 'merge', mergedData?: any) => {
      try {
        setIsSyncing(true);
        await offlineSyncService.resolveConflict(operationId, resolution, mergedData);
        await updateSyncStatus();
        setCurrentConflict(null);
        // Retry sync after resolving conflict
        await syncNow();
      } catch (error) {
        console.error('Error resolving conflict:', error);
        throw error;
      } finally {
        setIsSyncing(false);
      }
    },
    [updateSyncStatus, syncNow]
  );

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        isSyncing,
        syncStatus,
        syncNow,
        getPendingOperations,
        resolveConflict,
        currentConflict,
        setCurrentConflict,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

export default SyncContext;
