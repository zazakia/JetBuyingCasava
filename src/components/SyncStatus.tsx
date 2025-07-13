import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Clock, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { getSupabaseClient } from '../utils/supabase';
import { syncQueue, getSyncStatus, SyncOperation } from '../utils/syncQueue';

interface SyncStatusData {
  table_name: string;
  total_records: number;
  pending_sync: number;
  synced: number;
  failed: number;
  last_operation: string;
  last_sync: string;
}

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function SyncStatus({ className = '', showDetails = false }: SyncStatusProps) {
  const [syncData, setSyncData] = useState<SyncStatusData[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [queueStatus, setQueueStatus] = useState({
    pendingCount: 0,
    failedCount: 0,
    total: 0,
    lastSync: null as number | null,
  });
  const [operations, setOperations] = useState<SyncOperation[]>([]);

  // Monitor online status and sync queue
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      syncQueue.processQueue();
    };
    
    const handleOffline = () => setIsOnline(false);

    // Subscribe to sync queue updates
    const unsubscribe = syncQueue.addSyncListener(updateQueueStatus);
    
    // Initial status update
    updateQueueStatus();
    
    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  // Update queue status from sync queue
  const updateQueueStatus = () => {
    const status = getSyncStatus();
    setQueueStatus(status);
    setOperations(syncQueue.getQueue());
    
    // Update last update timestamp
    setLastUpdate(new Date());
  };

  // Fetch sync status from server
  const fetchSyncStatus = async () => {
    const client = getSupabaseClient();
    if (!client) return;

    setIsLoading(true);
    try {
      if (!isOnline) {
        // Use local queue status when offline
        updateQueueStatus();
        return;
      }

      const { data, error } = await client
        .from('JetAgriTracker.sync_status_view')
        .select('*');

      if (error) {
        console.error('Error fetching sync status:', error);
      } else {
        setSyncData(data || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh sync status
  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline]);

  // Calculate overall sync status
  const totalPending = syncData.reduce((sum, item) => sum + item.pending_sync, 0);
  const totalFailed = syncData.reduce((sum, item) => sum + item.failed, 0);
  const totalSynced = syncData.reduce((sum, item) => sum + item.synced, 0);
  const totalRecords = syncData.reduce((sum, item) => sum + item.total_records, 0);

  const getSyncStatusColor = () => {
    if (!isOnline) return 'text-gray-500';
    if (totalFailed > 0) return 'text-red-500';
    if (totalPending > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getSyncStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (isLoading) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (totalFailed > 0) return <AlertCircle className="w-4 h-4" />;
    if (totalPending > 0) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getSyncStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isLoading) return 'Syncing...';
    if (totalFailed > 0) return `${totalFailed} failed`;
    if (totalPending > 0) return `${totalPending} pending`;
    return 'All synced';
  };

  if (!showDetails) {
    // Compact view for navigation/header
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`flex items-center space-x-1 ${getSyncStatusColor()}`}>
          {getSyncStatusIcon()}
          <span className="text-sm font-medium">{getSyncStatusText()}</span>
        </div>
        {!isOnline && <Wifi className="w-4 h-4 text-gray-400" />}
      </div>
    );
  }

  // Detailed view for settings/dashboard
  return (
    <div className={`p-4 rounded-lg bg-white shadow ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Synchronization Status</h3>
        <div className="flex items-center space-x-4">
          {isOnline ? (
            <div className="flex items-center text-green-600">
              <Wifi className="w-4 h-4 mr-1" />
              <span className="text-sm">Online</span>
            </div>
          ) : (
            <div className="flex items-center text-yellow-600">
              <WifiOff className="w-4 h-4 mr-1" />
              <span className="text-sm">Offline</span>
            </div>
          )}
          
          <button
            onClick={fetchSyncStatus}
            disabled={isLoading || !isOnline}
            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
            title="Refresh sync status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalRecords}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalSynced}</div>
            <div className="text-sm text-gray-600">Synced</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{totalPending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{totalFailed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
      </div>

      {/* Sync Queue Status */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Sync Queue</h4>
        {queueStatus.total === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <CheckCircle className="w-6 h-6 mx-auto text-green-500 mb-2" />
            <p>No pending sync operations</p>
            <p className="text-xs text-gray-400 mt-1">Changes will be synced automatically when online</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">
                {queueStatus.pendingCount > 0 && (
                  <span className="text-yellow-600">{queueStatus.pendingCount} pending</span>
                )}
                {queueStatus.pendingCount > 0 && queueStatus.failedCount > 0 && (
                  <span className="mx-2 text-gray-300">•</span>
                )}
                {queueStatus.failedCount > 0 && (
                  <span className="text-red-600">{queueStatus.failedCount} failed</span>
                )}
              </div>
              {isOnline && (
                <button
                  onClick={() => syncQueue.processQueue()}
                  disabled={isLoading}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50"
                >
                  {isLoading ? 'Syncing...' : 'Retry Failed'}
                </button>
              )}
            </div>

            {operations.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {operations.map((op) => (
                  <div 
                    key={op.id} 
                    className={`p-2 text-sm rounded ${
                      op.status === 'FAILED' 
                        ? 'bg-red-50 text-red-800' 
                        : op.status === 'IN_PROGRESS'
                        ? 'bg-blue-50 text-blue-800'
                        : 'bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium capitalize">{op.table}</span>
                        <span className="text-xs ml-2 px-1.5 py-0.5 rounded bg-black/10">
                          {op.type}
                        </span>
                      </div>
                      <span className="text-xs opacity-75">
                        {op.status === 'PENDING' && 'Queued'}
                        {op.status === 'IN_PROGRESS' && 'Syncing...'}
                        {op.status === 'FAILED' && 'Failed'}
                        {op.status === 'COMPLETED' && 'Completed'}
                      </span>
                    </div>
                    {op.error && (
                      <div className="mt-1 text-xs text-red-600 truncate" title={op.error}>
                        {op.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Table Status */}
      {syncData.length > 0 && (
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Table Status</h4>
          <div className="space-y-3">
            {syncData.map((table) => (
              <div key={table.table_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 capitalize">
                    {table.table_name.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {table.total_records} records
                    {table.last_sync && (
                      <span className="ml-2">
                        • Last sync: {new Date(table.last_sync).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {table.synced > 0 && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      <span className="text-sm">{table.synced}</span>
                    </div>
                  )}
                  
                  {table.pending_sync > 0 && (
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <Clock className="w-3 h-3" />
                      <span className="text-sm">{table.pending_sync}</span>
                    </div>
                  )}
                  
                  {table.failed > 0 && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-sm">{table.failed}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {syncData.length === 0 && !isLoading && (
        <div className="p-4 text-center text-gray-500">
          <div className="text-sm">No sync data available</div>
          {!isOnline && (
            <div className="text-xs mt-1">Connect to internet to view sync status</div>
          )}
        </div>
      )}
    </div>
  );
}