import { useState, useEffect, useCallback } from 'react';
import { offlineSyncService, SyncOperation } from '../utils/offlineSync';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<{
    pending: number;
    inProgress: number;
    failed: number;
    lastSync: Date | null;
  }>({
    pending: 0,
    inProgress: 0,
    failed: 0,
    lastSync: null,
  });

  const updateSyncStatus = useCallback(async () => {
    const queue = await offlineSyncService['getQueue']();
    setSyncStatus({
      pending: queue.filter(op => op.status === 'pending').length,
      inProgress: queue.filter(op => op.status === 'in-progress').length,
      failed: queue.filter(op => op.status === 'failed').length,
      lastSync: new Date(),
    });
  }, []);

  // Update sync status when the component mounts
  useEffect(() => {
    updateSyncStatus();
  }, [updateSyncStatus]);

  // Set up event listeners for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateSyncStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen for online/offline events
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

  // Queue operations with automatic status updates
  const queueOperation = useCallback(
    async (table: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', data: any, recordId?: string) => {
      const op = await offlineSyncService.queueOperation(table, operation, data, recordId);
      await updateSyncStatus();
      return op;
    },
    [updateSyncStatus]
  );

  // Manually trigger sync
  const syncNow = useCallback(async () => {
    // This will trigger the queue processing
    await offlineSyncService['processQueue']();
    await updateSyncStatus();
  }, [updateSyncStatus]);

  // Get all pending operations
  const getPendingOperations = useCallback(async (): Promise<SyncOperation[]> => {
    const queue = await offlineSyncService['getQueue']();
    return queue.filter(op => op.status === 'pending' || op.status === 'failed');
  }, []);

  // Get operations for a specific table
  const getOperationsForTable = useCallback(async (table: string): Promise<SyncOperation[]> => {
    const queue = await offlineSyncService['getQueue']();
    return queue.filter(op => op.table === table);
  }, []);

  // Clear all operations (use with caution)
  const clearQueue = useCallback(async () => {
    await offlineSyncService['saveQueue']([]);
    await updateSyncStatus();
  }, [updateSyncStatus]);

  // Resolve a conflict
  const resolveConflict = useCallback(
    async (operationId: string, resolution: 'server' | 'client' | 'merge', mergedData?: any) => {
      await offlineSyncService.resolveConflict(operationId, resolution, mergedData);
      await updateSyncStatus();
    },
    [updateSyncStatus]
  );

  return {
    isOnline,
    syncStatus,
    queueOperation,
    syncNow,
    getPendingOperations,
    getOperationsForTable,
    clearQueue,
    resolveConflict,
  };
}

// Example usage in a component:
/*
function MyComponent() {
  const {
    isOnline,
    syncStatus,
    queueOperation,
    syncNow,
  } = useOfflineSync();

  const handleCreateFarmer = async (farmerData) => {
    try {
      await queueOperation('jetbuyingcasava_farmers', 'INSERT', farmerData);
      // Show success message
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      <div>Status: {isOnline ? 'Online' : 'Offline'}</div>
      <div>Pending sync: {syncStatus.pending}</div>
      <div>In progress: {syncStatus.inProgress}</div>
      <div>Failed: {syncStatus.failed}</div>
      <button onClick={syncNow} disabled={!isOnline || syncStatus.pending === 0}>
        Sync Now
      </button>
    </div>
  );
}
*/
