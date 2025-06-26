import type { SyncStatus } from '../types';

class SyncManager {
  private syncStatus: SyncStatus = {
    lastSync: null,
    pendingChanges: 0,
    isOnline: navigator.onLine,
    isSyncing: false
  };

  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.updateStatus({ isOnline: true });
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      this.updateStatus({ isOnline: false });
    });

    // Auto-sync every 5 minutes when online
    setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
        this.syncWhenOnline();
      }
    }, 5 * 60 * 1000);
  }

  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private updateStatus(updates: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  async addToSyncQueue(action: string, data: any) {
    try {
      // In a simplified version, we just update the pending changes count
      this.updateStatus({ pendingChanges: this.syncStatus.pendingChanges + 1 });
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  async syncWhenOnline() {
    if (!this.syncStatus.isOnline || this.syncStatus.isSyncing) {
      return;
    }

    this.updateStatus({ isSyncing: true });

    try {
      // Simulate sync process
      await this.simulateSync();
      
      this.updateStatus({
        lastSync: new Date().toISOString(),
        pendingChanges: 0,
        isSyncing: false
      });
    } catch (error) {
      console.error('Sync failed:', error);
      this.updateStatus({ isSyncing: false });
    }
  }

  private async simulateSync(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  getStatus(): SyncStatus {
    return this.syncStatus;
  }
}

export const syncManager = new SyncManager();