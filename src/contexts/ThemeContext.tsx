import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'default' | 'white';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get theme from localStorage or default to 'default'
    const savedTheme = localStorage.getItem('jetagri-theme') as Theme;
    return savedTheme || 'default';
  });

  useEffect(() => {
    // Save theme to localStorage whenever it changes
    localStorage.setItem('jetagri-theme', theme);
    
    // Apply theme class to document body
    document.body.className = theme === 'white' ? 'theme-white' : 'theme-default';
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'default' ? 'white' : 'default');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}