import { getSupabaseClient } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export type SyncOperation = {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  error?: string;
};

const SYNC_QUEUE_KEY = 'offline_sync_queue';
const MAX_RETRIES = 3;

export class SyncQueue {
  private static instance: SyncQueue;
  private queue: SyncOperation[] = [];
  private isProcessing = false;
  private syncListeners: Array<() => void> = [];

  private constructor() {
    this.loadQueue();
    this.setupSyncListener();
  }

  public static getInstance(): SyncQueue {
    if (!SyncQueue.instance) {
      SyncQueue.instance = new SyncQueue();
    }
    return SyncQueue.instance;
  }

  private loadQueue() {
    try {
      const savedQueue = localStorage.getItem(SYNC_QUEUE_KEY);
      if (savedQueue) {
        this.queue = JSON.parse(savedQueue);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
      this.notifySyncListeners();
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private notifySyncListeners() {
    this.syncListeners.forEach(listener => listener());
  }

  public addSyncListener(listener: () => void) {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  public async addOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>) {
    const newOperation: SyncOperation = {
      ...operation,
      id: uuidv4(),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'PENDING',
    };

    this.queue.push(newOperation);
    this.saveQueue();
    this.processQueue();
    return newOperation.id;
  }

  public getQueue() {
    return [...this.queue];
  }

  public getPendingCount() {
    return this.queue.filter(op => op.status === 'PENDING' || op.status === 'FAILED').length;
  }

  public async processQueue() {
    if (this.isProcessing || !navigator.onLine) return;
    
    const pendingOperations = this.queue.filter(
      op => op.status === 'PENDING' || (op.status === 'FAILED' && op.retryCount < MAX_RETRIES)
    );

    if (pendingOperations.length === 0) return;

    this.isProcessing = true;

    try {
      for (const operation of pendingOperations) {
        // Update operation status
        operation.status = 'IN_PROGRESS';
        operation.retryCount++;
        this.saveQueue();

        const supabase = getSupabaseClient();
        
        // Skip if Supabase client is not available
        if (!supabase) {
          console.warn('Supabase client not available, skipping operation:', operation.id);
          operation.status = 'FAILED';
          operation.error = 'Supabase client not available';
          this.saveQueue();
          continue;
        }

        try {
          let result: any;
          
          switch (operation.type) {
            case 'CREATE':
              result = await supabase
                .from(operation.table)
                .insert(operation.data)
                .select();
              break;

            case 'UPDATE':
              result = await supabase
                .from(operation.table)
                .update(operation.data)
                .eq('id', operation.data.id)
                .select();
              break;

            case 'DELETE':
              result = await supabase
                .from(operation.table)
                .delete()
                .eq('id', operation.data.id);
              break;
          }

          if (!result) {
            throw new Error('No response from Supabase');
          }

          if (result.error) {
            throw result.error;
          }

          // Mark as completed
          operation.status = 'COMPLETED';
          this.queue = this.queue.filter(op => op.id !== operation.id);
          this.saveQueue();

        } catch (error) {
          console.error(`Failed to process operation ${operation.id}:`, error);
          operation.status = 'FAILED';
          operation.error = error instanceof Error ? error.message : 'Unknown error';
          this.saveQueue();
        }
      }
    } finally {
      this.isProcessing = false;
      
      // If there are still pending operations, schedule a retry
      if (this.getPendingCount() > 0) {
        setTimeout(() => this.processQueue(), 30000); // Retry after 30 seconds
      }
    }
  }

  private setupSyncListener() {
    window.addEventListener('online', () => this.processQueue());
  }
}

// Export a singleton instance
export const syncQueue = SyncQueue.getInstance();

// Helper functions
export const addToSyncQueue = (
  type: 'CREATE' | 'UPDATE' | 'DELETE',
  table: string,
  data: any
) => {
  return syncQueue.addOperation({ type, table, data });
};

export const getSyncStatus = () => {
  const queue = syncQueue.getQueue();
  return {
    pendingCount: queue.filter(op => op.status === 'PENDING').length,
    failedCount: queue.filter(op => op.status === 'FAILED').length,
    total: queue.length,
    lastSync: queue.length > 0 ? Math.max(...queue.map(op => op.timestamp)) : null,
  };
};
