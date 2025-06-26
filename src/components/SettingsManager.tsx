import React, { useState, useEffect } from 'react';
import { Settings, User, Bell, Database, Download, Upload, Trash2, Save, Server, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection,
  validateSupabaseUrl,
  validateApiKey,
  type SupabaseConfig 
} from '../utils/supabase';

export function SettingsManager() {
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState({
    profile: {
      organizationName: 'AgriTracker Pro',
      contactEmail: 'admin@agritracker.com',
      contactPhone: '+63 912 345 6789',
      address: 'Cabanatuan City, Nueva Ecija'
    },
    notifications: {
      harvestReminders: true,
      paymentAlerts: true,
      lowStockWarnings: true,
      weeklyReports: false
    },
    data: {
      autoSync: true,
      syncInterval: 30,
      backupFrequency: 'weekly'
    }
  });

  // Supabase configuration state
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    apiKey: '',
    isConfigured: false
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Load Supabase config on component mount
  useEffect(() => {
    const config = getSupabaseConfig();
    setSupabaseConfig(config);
  }, []);

  const handleSave = () => {
    // In a real app, this would save settings to the database
    alert('Settings saved successfully!');
  };

  const handleExportData = () => {
    // In a real app, this would export all data
    alert('Data export would be implemented here');
  };

  const handleImportData = () => {
    // In a real app, this would import data
    alert('Data import would be implemented here');
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      // In a real app, this would clear the database
      alert('Data clearing would be implemented here');
    }
  };

  // Supabase configuration handlers
  const handleSupabaseConfigChange = (field: 'url' | 'apiKey', value: string) => {
    setSupabaseConfig(prev => ({
      ...prev,
      [field]: value,
      isConfigured: field === 'url' ? (value.trim() !== '' && prev.apiKey.trim() !== '') 
                                    : (prev.url.trim() !== '' && value.trim() !== '')
    }));
    
    // Reset connection status when config changes
    if (connectionStatus.status !== 'idle') {
      setConnectionStatus({ status: 'idle', message: '' });
    }
  };

  const handleTestConnection = async () => {
    if (!supabaseConfig.url.trim() || !supabaseConfig.apiKey.trim()) {
      setConnectionStatus({
        status: 'error',
        message: 'Please enter both URL and API key'
      });
      return;
    }

    // Validate URL format
    if (!validateSupabaseUrl(supabaseConfig.url)) {
      setConnectionStatus({
        status: 'error',
        message: 'Invalid Supabase URL format'
      });
      return;
    }

    // Validate API key format
    if (!validateApiKey(supabaseConfig.apiKey)) {
      setConnectionStatus({
        status: 'error',
        message: 'Invalid API key format'
      });
      return;
    }

    setConnectionStatus({ status: 'testing', message: 'Testing connection...' });
    
    try {
      // Save config temporarily for testing
      saveSupabaseConfig({
        url: supabaseConfig.url,
        apiKey: supabaseConfig.apiKey
      });

      const result = await testSupabaseConnection();
      setConnectionStatus({
        status: result.success ? 'success' : 'error',
        message: result.message
      });

      if (result.success) {
        // Update local state to reflect successful configuration
        setSupabaseConfig(prev => ({ ...prev, isConfigured: true }));
      }
    } catch (error) {
      setConnectionStatus({
        status: 'error',
        message: 'Connection test failed'
      });
    }
  };

  const handleSaveSupabaseConfig = async () => {
    if (!supabaseConfig.url.trim() || !supabaseConfig.apiKey.trim()) {
      alert('Please enter both URL and API key');
      return;
    }

    setIsSaving(true);
    try {
      saveSupabaseConfig({
        url: supabaseConfig.url,
        apiKey: supabaseConfig.apiKey
      });
      
      alert('Supabase configuration saved successfully!');
      setSupabaseConfig(prev => ({ ...prev, isConfigured: true }));
    } catch (error) {
      alert('Failed to save Supabase configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearSupabaseConfig = () => {
    if (confirm('Are you sure you want to clear the Supabase configuration?')) {
      clearSupabaseConfig();
      setSupabaseConfig({
        url: '',
        apiKey: '',
        isConfigured: false
      });
      setConnectionStatus({ status: 'idle', message: '' });
      alert('Supabase configuration cleared');
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input
              type="text"
              value={settings.profile.organizationName}
              onChange={(e) => setSettings({
                ...settings,
                profile: { ...settings.profile, organizationName: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={settings.profile.contactEmail}
              onChange={(e) => setSettings({
                ...settings,
                profile: { ...settings.profile, contactEmail: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
            <input
              type="tel"
              value={settings.profile.contactPhone}
              onChange={(e) => setSettings({
                ...settings,
                profile: { ...settings.profile, contactPhone: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={settings.profile.address}
              onChange={(e) => setSettings({
                ...settings,
                profile: { ...settings.profile, address: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSupabaseSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supabase Configuration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure your Supabase database connection to enable cloud sync and backup functionality.
        </p>

        {/* Configuration Status */}
        <div className={`p-4 rounded-lg mb-6 ${
          supabaseConfig.isConfigured 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2">
            {supabaseConfig.isConfigured ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            <span className={`font-medium ${
              supabaseConfig.isConfigured ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {supabaseConfig.isConfigured 
                ? 'Supabase is configured and ready' 
                : 'Supabase configuration required'}
            </span>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supabase URL
            </label>
            <input
              type="url"
              value={supabaseConfig.url}
              onChange={(e) => handleSupabaseConfigChange('url', e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your Supabase project URL (found in your project settings)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supabase API Key (anon/public)
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={supabaseConfig.apiKey}
                onChange={(e) => handleSupabaseConfigChange('apiKey', e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your Supabase anon/public API key (found in your project API settings)
            </p>
          </div>

          {/* Connection Status */}
          {connectionStatus.status !== 'idle' && (
            <div className={`p-3 rounded-lg ${
              connectionStatus.status === 'success' ? 'bg-green-50 border border-green-200' :
              connectionStatus.status === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center space-x-2">
                {connectionStatus.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {connectionStatus.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                {connectionStatus.status === 'testing' && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                <span className={`text-sm ${
                  connectionStatus.status === 'success' ? 'text-green-800' :
                  connectionStatus.status === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {connectionStatus.message}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleTestConnection}
              disabled={connectionStatus.status === 'testing'}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Database className="w-4 h-4" />
              <span>Test Connection</span>
            </button>

            <button
              onClick={handleSaveSupabaseConfig}
              disabled={isSaving}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>

            {supabaseConfig.isConfigured && (
              <button
                onClick={handleClearSupabaseConfig}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Configuration</span>
              </button>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-gray-50 rounded-lg p-4 mt-6">
          <h4 className="font-medium text-gray-900 mb-2">How to get your Supabase credentials:</h4>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Supabase Dashboard</a></li>
            <li>Select your project</li>
            <li>Go to Settings → API</li>
            <li>Copy your "Project URL" and "anon/public" API key</li>
            <li>Paste them in the fields above and test the connection</li>
          </ol>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {Object.entries(settings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className="text-sm text-gray-600">
                  {key === 'harvestReminders' && 'Get notified when crops are ready for harvest'}
                  {key === 'paymentAlerts' && 'Receive alerts for pending payments'}
                  {key === 'lowStockWarnings' && 'Warnings when inventory is low'}
                  {key === 'weeklyReports' && 'Receive weekly summary reports'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, [key]: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        
        {/* Sync Settings */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Sync Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto Sync</p>
                <p className="text-sm text-gray-600">Automatically sync data when online</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.data.autoSync}
                  onChange={(e) => setSettings({
                    ...settings,
                    data: { ...settings.data, autoSync: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sync Interval (minutes)</label>
              <select
                value={settings.data.syncInterval}
                onChange={(e) => setSettings({
                  ...settings,
                  data: { ...settings.data, syncInterval: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Actions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Data Actions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={handleExportData}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
            
            <button
              onClick={handleImportData}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
            </button>
            
            <button
              onClick={handleClearData}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600 text-sm lg:text-base">Manage your application preferences and data</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'supabase', label: 'Supabase Config', icon: Server },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'data', label: 'Data Management', icon: Database }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            {activeSection === 'profile' && renderProfileSettings()}
            {activeSection === 'supabase' && renderSupabaseSettings()}
            {activeSection === 'notifications' && renderNotificationSettings()}
            {activeSection === 'data' && renderDataSettings()}

            {/* Save Button (only for profile, notifications, and data settings) */}
            {activeSection !== 'supabase' && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Settings</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}