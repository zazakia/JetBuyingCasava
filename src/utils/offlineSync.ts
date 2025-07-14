import { type SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Constants
const SYNC_QUEUE_KEY = 'offline_sync_queue';
const SYNC_STATUS_KEY = 'offline_sync_status';
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
// Maximum number of retry attempts for failed operations
const MAX_RETRIES = 3;

type OperationType = 'INSERT' | 'UPDATE' | 'DELETE';
type OperationStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface PendingOperation<T = any> {
  id: string;
  table: string;
  operation: OperationType;
  data: Partial<T>;
  recordId?: string;
  status: OperationStatus;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  lastError?: string | null;
  serverVersion?: number;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  pending: number;
  inProgress: number;
  failed: number;
}

type SyncListener = (status: SyncStatus) => void;

class OfflineSyncService {
  private client: SupabaseClient | null = null;
  private queue: PendingOperation[] = [];
  private syncStatus: SyncStatus = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSync: null,
    pending: 0,
    inProgress: 0,
    failed: 0,
  };
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: SyncListener[] = [];

  constructor(client?: SupabaseClient) {
    if (client) {
      this.initialize(client);
    }
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline() {
    this.syncStatus.isOnline = true;
    this.notifyListeners();
    this.processQueue();
  }

  private handleOffline() {
    this.syncStatus.isOnline = false;
    this.notifyListeners();
  }

  public initialize(client: SupabaseClient) {
    this.client = client;
    this.loadQueue();
    this.startSyncInterval();
    return this;
  }

  public addSyncListener(listener: SyncListener) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public setOnlineStatus(isOnline: boolean) {
    if (this.syncStatus.isOnline === isOnline) return;
    
    this.syncStatus.isOnline = isOnline;
    this.notifyListeners();
    
    if (isOnline) {
      this.processQueue();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  public getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  private loadQueue() {
    try {
      const queueStr = localStorage.getItem(SYNC_QUEUE_KEY);
      if (queueStr) {
        this.queue = JSON.parse(queueStr);
      }
    } catch (error) {
      console.error('Error loading queue from localStorage:', error);
    }
  }

  private loadSyncStatus(): void {
    try {
      const status = localStorage.getItem(SYNC_STATUS_KEY);
      if (status) {
        this.syncStatus = { ...this.syncStatus, ...JSON.parse(status) };
      }
    } catch (e) {
      console.error('Failed to load sync status:', e);
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
      this.updateSyncStatus();
      localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(this.syncStatus));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving queue to localStorage:', error);
    }
  }

  private updateSyncStatus(): void {
    this.syncStatus = {
      isOnline: this.syncStatus.isOnline,
      isSyncing: this.syncStatus.isSyncing,
      lastSync: this.syncStatus.lastSync || new Date().toISOString(),
      pending: this.queue.filter(op => op.status === 'pending').length,
      inProgress: this.queue.filter(op => op.status === 'processing').length,
      failed: this.queue.filter(op => op.status === 'failed').length,
    };

    this.notifyListeners();
  }

  public async sync<T>(table: string): Promise<{ data: T[] | null; error: Error | null }> {
    try {
      if (!this.client) {
        throw new Error('Supabase client not initialized');
      }
      
      // Process any pending operations for this table first
      await this.processQueue();
      
      // Then fetch fresh data with error handling for offline mode
      let data: T[] | null = null;
      
      if (this.syncStatus.isOnline) {
        const result = await this.client
          .from(table)
          .select('*')
          .order('created_at', { ascending: false });
          
        if (result.error) {
          throw result.error;
        }
        
        data = result.data as T[];
        
        // Cache the data for offline use
        try {
          localStorage.setItem(`${SYNC_QUEUE_KEY}_${table}`, JSON.stringify(data));
        } catch (e) {
          console.warn('Failed to cache data locally:', e);
        }
      } else {
        // Return local data if offline
        try {
          const localData = localStorage.getItem(`${SYNC_QUEUE_KEY}_${table}`);
          data = localData ? (JSON.parse(localData) as T[]) : [];
        } catch (e) {
          console.error('Error reading local data:', e);
          data = [];
        }
      }
      
      // Update sync status
      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.pending = this.queue.length;
      this.notifyListeners();
      
      return { data, error: null };
    } catch (error) {
      console.error(`Error syncing ${table}:`, error);
      
      // If online sync fails, try to return local data
      try {
        const localData = localStorage.getItem(`${SYNC_QUEUE_KEY}_${table}`);
        if (localData) {
          return { 
            data: JSON.parse(localData) as T[], 
            error: error instanceof Error ? error : new Error('Using cached data due to sync error')
          };
        }
      } catch (e) {
        console.error('Error loading local data:', e);
      }
      
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to sync data') 
      };
    }
  }

  public enqueue<T>(
    table: string,
    operation: OperationType,
    data: Partial<T>,
    recordId?: string
  ): string {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const newOperation: PendingOperation<T> = {
      id,
      table,
      operation,
      data,
      recordId,
      status: 'pending',
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    this.queue.push(newOperation as PendingOperation);
    this.saveQueue();
    
    // Try to process the queue if online
    if (this.syncStatus.isOnline) {
      void this.processQueue();
    }
    
    return id;
  }
  
  // Get the current queue of pending operations
  public getQueue(): PendingOperation[] {
    return [...this.queue];
  }
  
  // Clear the queue (use with caution)
  public clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
  
  // Start the sync interval
  public startSyncInterval() {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isOnline) {
        void this.processQueue();
      }
    }, SYNC_INTERVAL);
  }
  
  // Stop the sync interval
  public stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  // Cleanup resources when service is no longer needed
  public destroy() {
    this.stopSyncInterval();
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    this.listeners = [];
  }

  /**
   * Queues an operation to be synced with the server
   */
  public async queueOperation<T>(
    table: string,
    operation: OperationType,
    data: Partial<T>,
    recordId?: string
  ): Promise<{ success: boolean; operationId?: string; error?: string }> {
    try {
      const operationId = this.enqueue(table, operation, data, recordId);
      return { success: true, operationId };
    } catch (error) {
      console.error('Error queuing operation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to queue operation',
      };
    }
  }

  /**
   * Gets all pending operations
   */
  public getPendingOperations(): PendingOperation[] {
    return [...this.queue];
  }

  /**
   * Retries all failed operations
   */
  public async retryFailedOperations(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.processQueue();
      return { success: true };
    } catch (error) {
      console.error('Error retrying failed operations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retry operations',
      };
    }
  }

  /**
   * Resolves a conflict by updating the operation data
   */
  /**
   * Resolves a conflict by updating the operation data and retrying
   */
  private async resolveConflict<T>(
    operationId: string,
    resolvedData: Partial<T>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const opIndex = this.queue.findIndex((op) => op.id === operationId);

      if (opIndex === -1) {
        throw new Error(`Operation ${operationId} not found in queue`);
      }

      const operation = this.queue[opIndex];
      operation.data = { ...operation.data, ...resolvedData };
      operation.status = 'pending';
      operation.lastError = null;
      operation.retryCount = 0;

      await this.saveQueue();

      // Try to process immediately if online
      if (this.syncStatus.isOnline) {
        await this.processQueue();
      }

      return { success: true };
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resolve conflict',
      };
    }
  }

  private async processQueue(): Promise<void> {
    // Don't process if already syncing, no client, or offline
    if (this.syncStatus.isSyncing || !this.client || !this.syncStatus.isOnline) {
      return;
    }

    // Mark as syncing and update status
    this.syncStatus.isSyncing = true;
    this.updateSyncStatus();

    try {
      // Get all pending operations
      const pendingOps = this.queue.filter(op => op.status === 'pending');
      
      // Process each operation in sequence
      for (const op of pendingOps) {
        try {
          await this.processOperation(op);
        } catch (error) {
          console.error(`Error processing operation ${op.id}:`, error);
          // Continue with next operation even if one fails
        }
      }
    } catch (error) {
      console.error('Unexpected error in processQueue:', error);
    } finally {
      // Always ensure we clean up syncing state
      this.syncStatus.isSyncing = false;
      this.updateSyncStatus();
    }
  }

  private async processOperation(operation: PendingOperation): Promise<void> {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    try {
      operation.status = 'processing';
      this.updateSyncStatus();

      const { table, operation: opType, data, recordId } = operation;
      let result: any;

      // Remove any duplicate operations for the same record and operation type
      this.queue = this.queue.filter((op: PendingOperation) =>
        !(op.table === table && op.recordId === recordId && op.operation === opType)
      );

      switch (opType) {
        case 'INSERT':
          result = await this.client
            .from(table)
            .insert(data)
            .select();
          break;

        case 'UPDATE':
          if (!recordId) throw new Error('Record ID is required for update operations');

          result = await this.client
            .from(table)
            .update(data)
            .eq('id', recordId)
            .select();
          break;

        case 'DELETE':
          if (!recordId) throw new Error('Record ID is required for delete operations');

          result = await this.client
            .from(table)
            .delete()
            .eq('id', recordId);
          break;

        default:
          throw new Error(`Unsupported operation: ${opType}`);
      }

      if (result.error) {
        throw result.error;
      }

      operation.status = 'completed';
      this.updateSyncStatus();
    } catch (error) {
      console.error(`Error processing ${operation.operation} operation on ${operation.table}:`, error);
      operation.status = 'failed';
      operation.retryCount = (operation.retryCount || 0) + 1;
      operation.lastError = error instanceof Error ? error.message : String(error);
      this.updateSyncStatus();
      throw error;
    }
  }

  // Event handlers for online/offline events
  // Handle when the browser comes online
  private handleOnline = (): void => {
    this.syncStatus.isOnline = true;
    this.updateSyncStatus();
    this.startSyncInterval();
    this.processQueue().catch(console.error);
  };

  // Handle when the browser goes offline
  private handleOffline = (): void => {
    this.syncStatus.isOnline = false;
    this.updateSyncStatus();
    this.stopSyncInterval();
  };

  /**
   * Add a listener for sync status updates
   */
  public addListener(listener: SyncListener): void {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
      // Immediately notify new listener of current state
      listener(this.syncStatus);
    }
  }

  /**
   * Remove a previously added sync status listener
   */
  public removeListener(listener: SyncListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  public destroy(): void {
    this.stopSyncInterval();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.listeners = [];
  }

  private updateSyncStatus(): void {
    const pending = this.queue.filter(op => op.status === 'pending').length;
    const inProgress = this.queue.filter(op => op.status === 'processing').length;
    const failed = this.queue.filter(op => op.status === 'failed').length;
    
    this.syncStatus = {
      ...this.syncStatus,
      pending,
      inProgress,
      failed,
    };
    
    // Notify all listeners of the updated status
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  private saveQueue(): void {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error('Failed to save queue:', e);
    }
  }

  private loadQueue(): void {
    try {
      const queueData = localStorage.getItem(SYNC_QUEUE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
      }
    } catch (e) {
      console.error('Failed to load queue:', e);
    }
  }

  public addListener(listener: (syncStatus: any) => void) {
    this.listeners.push(listener);
  }

  public removeListener(listener: (syncStatus: any) => void) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all registered listeners of the current sync status
   */
  private notifyListeners(): void {
    const status = { ...this.syncStatus };
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }
}

// Export types for use in other files
export type { PendingOperation as SyncOperation, SyncStatus, SyncListener };

// Export a singleton instance
const offlineSync = new OfflineSyncService();

export default offlineSync;

/*
// Example usage:
// const offlineSyncService = new OfflineSyncService(supabaseClient);

// Queue an insert operation
// const operationId = await offlineSyncService.queueOperation(
//   'jetbuyingcasava_farmers',
//   'INSERT',
//   { name: 'John Doe', location: 'Nairobi' }
// );

// Queue an update operation
// offlineSyncService.queueOperation(
//   'jetbuyingcasava_farmers',
//   'UPDATE',
//   { name: 'John Updated' },
//   'some-farmer-id'
// );

// Queue a delete operation
// offlineSyncService.queueOperation(
//   'jetbuyingcasava_farmers',
//   'DELETE',
//   {},
//   'some-farmer-id'
// );

// Resolve a conflict
// offlineSyncService.resolveConflict(
//   'operation-id',
//   'merge',
//   { /* merged data */ }
// );
*/
