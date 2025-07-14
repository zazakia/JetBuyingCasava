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
  RefreshCw,
  Shield,
  LogOut,
  UserCircle
} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { SyncStatus as SyncStatusComponent } from './SyncStatus';
import { useAuth } from '../contexts/AuthContext';
import type { SyncStatus } from '../types';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  syncStatus: SyncStatus;
  onMobileMenuClose?: () => void;
  onManualSync?: () => void;
}

export function Navigation({ activeTab, onTabChange, syncStatus, onMobileMenuClose, onManualSync }: NavigationProps) {
  const { user, logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      if (onMobileMenuClose) onMobileMenuClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const baseMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, emoji: '🏠' },
    { id: 'farmers', label: 'Farmers', icon: Users, emoji: '👨‍🌾' },
    { id: 'lands', label: 'Lands', icon: MapPin, emoji: '🏞️' },
    { id: 'crops', label: 'Crops', icon: Sprout, emoji: '🌱' },
    { id: 'transactions', label: 'Transactions', icon: DollarSign, emoji: '💰' },
    { id: 'reports', label: 'Reports', icon: FileText, emoji: '📊' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, emoji: '📈' },
    { id: 'settings', label: 'Settings', icon: Settings, emoji: '⚙️' }
  ];

  // Add user management for admins and managers
  const adminMenuItems = [
    { id: 'users', label: 'User Management', icon: Shield, emoji: '👥' },
    { id: 'admin', label: 'Admin', icon: Shield, emoji: '🛡️' },
  ];

  const menuItems = [
    ...baseMenuItems,
    ...(user?.role === 'admin' || user?.role === 'manager' ? adminMenuItems : [])
  ];

  const handleSync = () => {
    if (syncStatus.isOnline && !syncStatus.isSyncing && onManualSync) {
      onManualSync();
    }
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    onMobileMenuClose?.();
  };

  return (
    <nav
      className={`flex flex-col h-full bg-glass border-r border-amber-200/30 shadow-lg overflow-y-auto max-h-screen`}
    >
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center animate-glow relative">
            <Sprout className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 text-lg animate-sprout">🌱</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-glass flex items-center">
              <span className="mr-1">🌾</span>
              AgriTracker
            </h1>
            <p className="text-sm text-glass-light flex items-center">
              <span className="mr-1">👨‍🌾</span>
              Farmers Management
            </p>
          </div>
        </div>

        {/* Theme Switcher */}
        <div className="mb-4">
          <ThemeSwitcher className="w-full justify-start" />
        </div>

        {/* Sync Status */}
        <div className="mb-6 p-3 glass-card rounded-lg text-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {syncStatus.isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium text-glass flex items-center">
                <span className="mr-1">{syncStatus.isOnline ? '🌐' : '📡'}</span>
                {syncStatus.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <button
              onClick={handleSync}
              disabled={!syncStatus.isOnline || syncStatus.isSyncing}
              className="p-1 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={syncStatus.isSyncing ? 'Syncing...' : 'Manual sync'}
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
            <div className="text-xs text-amber-300 mt-1 flex items-center">
              <span className="mr-1">⏳</span>
              {syncStatus.pendingChanges} pending changes
            </div>
          )}
          {syncStatus.isSyncing && (
            <div className="text-xs text-blue-300 mt-1 flex items-center">
              <span className="mr-1">🔄</span>
              Syncing data...
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
                      ? 'bg-green-600/20 text-green-300 border border-green-400/30 animate-glow'
                      : 'text-glass-muted hover:bg-amber-900/20 hover:text-glass'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 text-xs animate-sprout">{item.emoji}</span>
                  </div>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}