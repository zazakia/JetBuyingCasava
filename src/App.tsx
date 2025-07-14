import { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SyncProvider, useSync } from './contexts/SyncContext';
import ConflictResolutionDialog from './components/ConflictResolutionDialog';
import { Navigation } from './components/Navigation';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthPage } from './components/auth/AuthPage';
import { EmailVerificationPage } from './components/auth/EmailVerificationPage';
import { EmailVerificationBanner } from './components/auth/EmailVerificationBanner';
import SyncStatusIndicator from './components/SyncStatusIndicator';

// Lazy load heavy components
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const FarmersManager = lazy(() => import('./components/FarmersManager').then(module => ({ default: module.FarmersManager })));
const CropsManager = lazy(() => import('./components/CropsManager').then(module => ({ default: module.CropsManager })));
const LandsManager = lazy(() => import('./components/LandsManager').then(module => ({ default: module.LandsManager })));
const TransactionsManager = lazy(() => import('./components/TransactionsManager').then(module => ({ default: module.TransactionsManager })));
const ReportsManager = lazy(() => import('./components/ReportsManager').then(module => ({ default: module.ReportsManager })));
const AnalyticsManager = lazy(() => import('./components/AnalyticsManager').then(module => ({ default: module.AnalyticsManager })));
const SettingsManager = lazy(() => import('./components/SettingsManager').then(module => ({ default: module.SettingsManager })));
const UserManager = lazy(() => import('./components/UserManager').then(module => ({ default: module.UserManager })));

// Main App component that uses all providers
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SyncProvider>
          <AppContent />
        </SyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

// App content component that handles routing and rendering
const AppContent = () => {
  const location = useLocation();
  const { isAuthenticated, user, loading: authLoading, isAdmin } = useAuth();
  const { currentConflict, resolveConflict, setCurrentConflict, syncStatus } = useSync();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Handle conflict resolution
  const handleResolveConflict = async (resolution: 'server' | 'client' | 'merge', mergedData?: any) => {
    if (!currentConflict) return;
    
    try {
      await resolveConflict(
        currentConflict.id,
        resolution,
        resolution === 'merge' ? mergedData : undefined
      );
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      // TODO: Show error toast
    } finally {
      setCurrentConflict(null);
    }
  };

  // Handle manual sync
  const handleManualSync = async () => {
    // TODO: Implement manual sync logic
    console.log('Manual sync triggered');
  };

  // Initialize app
  useEffect(() => {
    const init = async () => {
      try {
        // TODO: Add any initialization logic here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  // Handle special routes
  if (location.pathname === '/auth/verify') {
    return <EmailVerificationPage />;
  }

  // Show auth page if not authenticated
  if (!isAuthenticated && !authLoading) {
    return <AuthPage />;
  }

  // Show loading screen during auth check or app initialization
  if (authLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AgriTracker...</p>
        </div>
      </div>
    );
  }

  // Render the main app content
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Navigation Sidebar - Hidden on mobile, shown on desktop */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          syncStatus={syncStatus}
          onMobileMenuClose={() => setIsMobileMenuOpen(false)}
          onManualSync={handleManualSync}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden glass border-b border-amber-200/30 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-md text-glass hover:text-white hover:bg-amber-900/20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-lg animate-sprout">🌾</span>
            <h1 className="text-lg font-semibold text-glass">AgriTracker Pro</h1>
            <span className="text-lg animate-float">🌱</span>
          </div>
          <div className="w-10" />
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto mobile-content-padding lg:pb-0">
          {/* Email Verification Banner */}
          <EmailVerificationBanner className="m-6 mb-4" />
          
          <Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
              <span className="ml-3 text-glass">Loading...</span>
            </div>
          }>
            {renderContent(activeTab, isAdmin)}
          </Suspense>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {/* Sync Status Indicator */}
      <SyncStatusIndicator />
      
      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        isOpen={!!currentConflict}
        onClose={() => setCurrentConflict(null)}
        onResolve={handleResolveConflict}
        conflict={currentConflict}
      />
    </div>
  );
};

// Helper function to render the appropriate content based on the active tab
const renderContent = (activeTab: string, isAdmin: boolean) => {
  switch (activeTab) {
    case 'dashboard':
      return <Dashboard />;
    case 'farmers':
      return <FarmersManager />;
    case 'lands':
      return <LandsManager />;
    case 'crops':
      return <CropsManager />;
    case 'transactions':
      return <TransactionsManager />;
    case 'reports':
      return <ReportsManager />;
    case 'analytics':
      return <AnalyticsManager />;
    case 'settings':
      return <SettingsManager />;
    case 'users':
      return isAdmin ? <UserManager /> : <Dashboard />;
    default:
      return <Dashboard />;
  }
};

export default App;
