import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, Clock, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { getSupabaseClient } from '../utils/supabase';

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

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch sync status
  const fetchSyncStatus = async () => {
    const client = getSupabaseClient();
    if (!client || !isOnline) return;

    setIsLoading(true);
    try {
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
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Sync Status</h3>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 ${getSyncStatusColor()}`}>
              {getSyncStatusIcon()}
              <span className="text-sm font-medium">{getSyncStatusText()}</span>
            </div>
            <button
              onClick={fetchSyncStatus}
              disabled={isLoading || !isOnline}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="Refresh sync status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="mt-2 flex items-center space-x-2">
          {isOnline ? (
            <div className="flex items-center space-x-1 text-green-600">
              <Wifi className="w-3 h-3" />
              <span className="text-xs">Online</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-600">
              <WifiOff className="w-3 h-3" />
              <span className="text-xs">Offline</span>
            </div>
          )}
          
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