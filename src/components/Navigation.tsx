import React from 'react';
import { 
  Home, 
  Users, 
  MapPin, 
  Sprout, 
  BarChart3, 
  DollarSign,
  FileText,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { syncManager } from '../utils/sync';
import type { SyncStatus } from '../types';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  syncStatus: SyncStatus;
  onMobileMenuClose?: () => void;
}

export function Navigation({ activeTab, onTabChange, syncStatus, onMobileMenuClose }: NavigationProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'farmers', label: 'Farmers', icon: Users },
    { id: 'lands', label: 'Lands', icon: MapPin },
    { id: 'crops', label: 'Crops', icon: Sprout },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleSync = () => {
    if (syncStatus.isOnline && !syncStatus.isSyncing) {
      syncManager.syncWhenOnline();
    }
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    onMobileMenuClose?.();
  };
  return (
    <nav className="glass-nav h-full flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center animate-glow">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-glass">AgriTracker</h1>
            <p className="text-sm text-glass-light">Farmers Management</p>
          </div>
        </div>

        {/* Sync Status */}
        <div className="mb-6 p-3 glass-card rounded-lg text-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {syncStatus.isOnline ? (
                <Wifi className="w-4 h-4 text-emerald-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium text-glass">
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <button
              onClick={handleSync}
              disabled={!syncStatus.isOnline || syncStatus.isSyncing}
              className="p-1 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-glass-muted ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="text-xs text-glass-light truncate">
            {syncStatus.lastSync ? (
              <>Last: {new Date(syncStatus.lastSync).toLocaleTimeString()}</>
            ) : (
              'Never synced'
            )}
          </div>
          {syncStatus.pendingChanges > 0 && (
            <div className="text-xs text-amber-300 mt-1">
              {syncStatus.pendingChanges} pending changes
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <ul className="space-y-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'text-glass-muted hover:bg-white/10 hover:text-glass'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* Mobile Close Button */}
      <div className="lg:hidden p-4 border-t border-white/20">
        <button
          onClick={onMobileMenuClose}
          className="w-full flex items-center justify-center px-4 py-2 text-glass-muted hover:text-glass hover:bg-white/10 rounded-lg transition-colors"
        >
          <span className="text-sm font-medium">Close Menu</span>
        </button>
      </div>
    </nav>
  );
}