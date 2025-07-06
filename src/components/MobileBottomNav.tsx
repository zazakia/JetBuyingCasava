import React from 'react';
import { 
  Home, 
  Users, 
  MapPin, 
  Sprout, 
  BarChart3, 
  DollarSign,
  FileText,
  Settings
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  // Primary navigation items (most used)
  const primaryItems = [
    { id: 'dashboard', label: 'Home', icon: Home, emoji: '🏠' },
    { id: 'farmers', label: 'Farmers', icon: Users, emoji: '👨‍🌾' },
    { id: 'crops', label: 'Crops', icon: Sprout, emoji: '🌱' },
    { id: 'transactions', label: 'Sales', icon: DollarSign, emoji: '💰' }
  ];

  // Secondary navigation items
  const secondaryItems = [
    { id: 'lands', label: 'Lands', icon: MapPin, emoji: '🏞️' },
    { id: 'reports', label: 'Reports', icon: FileText, emoji: '📊' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, emoji: '📈' },
    { id: 'settings', label: 'Settings', icon: Settings, emoji: '⚙️' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden mobile-nav-safe-area">
      {/* Gradient overlay for depth */}
      <div className="mobile-nav-gradient h-4 -mb-4"></div>
      
      {/* Main bottom navigation */}
      <div className="glass-nav border-t border-amber-200/30 bg-amber-900/25 backdrop-blur-xl shadow-2xl">
        {/* Primary navigation row */}
        <div className="px-1 py-2">
          <div className="flex justify-around items-center">
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`mobile-nav-item flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 min-w-0 flex-1 mx-1 ${
                    isActive
                      ? 'bg-green-600/40 text-green-200 animate-glow scale-105 shadow-lg'
                      : 'text-glass-muted hover:bg-amber-900/30 hover:text-glass hover:scale-105'
                  }`}
                >
                  <div className="relative mb-1">
                    <Icon className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 text-xs animate-sprout">
                      {item.emoji}
                    </span>
                  </div>
                  <span className="text-xs font-medium truncate">{item.label}</span>
                  {isActive && (
                    <div className="w-1 h-1 bg-green-400 rounded-full mt-1 animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Secondary navigation row (smaller) */}
        <div className="px-1 pb-2 border-t border-amber-200/20">
          <div className="flex justify-around items-center">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`mobile-nav-item flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 mx-0.5 ${
                    isActive
                      ? 'bg-green-600/30 text-green-300 animate-glow scale-105'
                      : 'text-glass-light hover:bg-amber-900/20 hover:text-glass-muted hover:scale-105'
                  }`}
                >
                  <div className="relative mb-1">
                    <Icon className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 text-xs animate-sprout">
                      {item.emoji}
                    </span>
                  </div>
                  <span className="text-xs font-medium truncate">{item.label}</span>
                  {isActive && (
                    <div className="w-1 h-1 bg-green-400 rounded-full mt-0.5 animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Soil moisture indicator at the bottom */}
      <div className="soil-moisture h-1 animate-pulse"></div>
    </div>
  );
} 