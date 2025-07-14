import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Check, AlertTriangle } from 'lucide-react';

type ConflictResolution = 'server' | 'client' | 'merge';

interface ConflictResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (resolution: ConflictResolution, mergedData?: any) => Promise<void>;
  conflict: {
    id: string;
    table: string;
    operation: string;
    localData: any;
    serverData: any;
    error: string;
  } | null;
}

const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  isOpen,
  onClose,
  onResolve,
  conflict,
}) => {
  const [isResolving, setIsResolving] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<ConflictResolution>('server');
  const [mergedData, setMergedData] = useState<any>(null);

  useEffect(() => {
    if (conflict) {
      // Initialize merged data with server data by default
      setMergedData({
        ...(conflict.serverData || {}),
        ...(conflict.localData || {}),
      });
    }
  }, [conflict]);

  if (!isOpen || !conflict) return null;

  const handleResolve = async (resolution: ConflictResolution) => {
    try {
      setIsResolving(true);
      await onResolve(resolution, resolution === 'merge' ? mergedData : undefined);
      onClose();
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const formatData = (data: any) => {
    if (!data) return 'No data';
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center">
            <AlertTriangle className="text-yellow-500 mr-2" />
            Conflict Detected
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isResolving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-grow">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              There's a conflict between your local changes and the server data for{' '}
              <span className="font-medium">{conflict.table}</span>.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Error:</span> {conflict.error}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border rounded p-3">
              <h3 className="font-medium mb-2 text-sm">Server Version</h3>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                {formatData(conflict.serverData)}
              </pre>
            </div>
            <div className="border rounded p-3">
              <h3 className="font-medium mb-2 text-sm">Your Changes</h3>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                {formatData(conflict.localData)}
              </pre>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="useServer"
                name="resolution"
                checked={selectedResolution === 'server'}
                onChange={() => setSelectedResolution('server')}
                className="h-4 w-4 text-blue-600"
                disabled={isResolving}
              />
              <label htmlFor="useServer" className="ml-2 block text-sm">
                <span className="font-medium">Use server version</span>
                <p className="text-xs text-gray-500">Discard local changes and use the server version</p>
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="radio"
                id="useLocal"
                name="resolution"
                checked={selectedResolution === 'client'}
                onChange={() => setSelectedResolution('client')}
                className="h-4 w-4 text-blue-600"
                disabled={isResolving}
              />
              <label htmlFor="useLocal" className="ml-2 block text-sm">
                <span className="font-medium">Keep local changes</span>
                <p className="text-xs text-gray-500">Overwrite server with your local changes</p>
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="radio"
                id="merge"
                name="resolution"
                checked={selectedResolution === 'merge'}
                onChange={() => setSelectedResolution('merge')}
                className="h-4 w-4 text-blue-600 mt-1"
                disabled={isResolving}
              />
              <div className="ml-2 flex-1">
                <label htmlFor="merge" className="block text-sm">
                  <span className="font-medium">Merge changes</span>
                  <p className="text-xs text-gray-500 mb-2">
                    Combine server and local changes (preview below)
                  </p>
                </label>
                {selectedResolution === 'merge' && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Merged data:</div>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                      {formatData(mergedData)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={isResolving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleResolve(selectedResolution)}
            disabled={isResolving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
          >
            {isResolving ? (
              <>
                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Resolving...
              </>
            ) : (
              <>
                <Check className="-ml-1 mr-2 h-4 w-4" />
                Resolve
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionDialog;
