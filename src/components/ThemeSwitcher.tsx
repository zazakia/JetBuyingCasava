import React from 'react';
import { Palette, Circle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { theme, toggleTheme } = useTheme();

  // Adaptive colors based on current theme - using black text for readability
  const buttonClass = 'hover:bg-gray-200/50 text-black';
  const iconClass = 'text-black';
  const textClass = 'text-black';

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${buttonClass} ${className}`}
      title={`Switch to ${theme === 'default' ? 'white' : 'default'} theme`}
    >
      <Palette className={`w-5 h-5 ${iconClass}`} />
      <div className="flex items-center space-x-1">
        <Circle 
          className={`w-3 h-3 ${theme === 'default' ? 'fill-emerald-600 text-emerald-600' : 'text-black'}`} 
        />
        <Circle 
          className={`w-3 h-3 ${theme === 'white' ? 'fill-black text-black' : 'text-black'}`} 
        />
      </div>
      <span className={`hidden sm:inline text-sm ${textClass}`}>
        {theme === 'default' ? 'Default' : 'White'}
      </span>
    </button>
  );
}