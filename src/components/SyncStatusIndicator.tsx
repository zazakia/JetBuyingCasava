import React, { useState, useEffect } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { RefreshCw, Wifi, WifiOff, AlertCircle, Clock } from 'lucide-react';

const SyncStatusIndicator: React.FC = () => {
  const { isOnline, syncStatus, syncNow, getPendingOperations } = useOfflineSync();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const loadPendingOperations = async () => {
      const operations = await getPendingOperations();
      setPendingOperations(operations);
    };

    loadPendingOperations();
  }, [getPendingOperations, syncStatus]);

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      await syncNow();
      const operations = await getPendingOperations();
      setPendingOperations(operations);
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (syncStatus.failed > 0) return 'bg-red-500';
    if (syncStatus.pending > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatTableName = (table: string) => {
    return table.replace('jetbuyingcasava_', '').replace(/_/g, ' ');
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return <span className="text-green-500">+</span>;
      case 'UPDATE':
        return <span className="text-blue-500">↻</span>;
      case 'DELETE':
        return <span className="text-red-500">×</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        {/* Main status button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-3 rounded-full shadow-lg flex items-center justify-center ${
            isOnline ? 'bg-white' : 'bg-gray-200'
          } border-2 ${getStatusColor()} border-opacity-50`}
          title={isOnline ? 'Online' : 'Offline'}
        >
          {isOnline ? (
            <Wifi className="w-6 h-6 text-gray-700" />
          ) : (
            <WifiOff className="w-6 h-6 text-gray-500" />
          )}
          
          {(syncStatus.pending > 0 || syncStatus.failed > 0) && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {syncStatus.failed > 0 ? syncStatus.failed : syncStatus.pending}
            </span>
          )}
        </button>

        {/* Dropdown panel */}
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">
                  Sync Status
                </h3>
                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing || !isOnline || (syncStatus.pending === 0 && syncStatus.failed === 0)}
                  className={`flex items-center text-sm ${
                    isSyncing || !isOnline || (syncStatus.pending === 0 && syncStatus.failed === 0)
                      ? 'text-gray-400'
                      : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
              
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Pending</div>
                  <div className="font-semibold">{syncStatus.pending}</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">In Progress</div>
                  <div className="font-semibold">{syncStatus.inProgress}</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Failed</div>
                  <div className="font-semibold text-red-500">{syncStatus.failed}</div>
                </div>
              </div>
              
              {!isOnline && (
                <div className="mt-2 text-sm text-yellow-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  You're currently offline. Changes will sync when you're back online.
                </div>
              )}
            </div>

            {/* Pending operations list */}
            <div className="max-h-96 overflow-y-auto">
              {pendingOperations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No pending operations
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {pendingOperations.map((op) => (
                    <li key={op.id} className="p-3 hover:bg-gray-50">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          {op.status === 'failed' ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          ) : op.status === 'in-progress' ? (
                            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getOperationIcon(op.operation)} {formatTableName(op.table)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {op.operation} • {new Date(op.created_at).toLocaleString()}
                          </p>
                          {op.error && (
                            <p className="text-xs text-red-500 mt-1 truncate">
                              Error: {op.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
              Last sync: {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncStatusIndicator;
