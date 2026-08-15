import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
export type ConversationLayout = 'list' | 'grid' | 'compact';

interface UIContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  headerVisible: boolean;
  setHeaderVisible: (visible: boolean) => void;
  toggleHeader: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  layout: ConversationLayout;
  setLayout: (layout: ConversationLayout) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [layout, setLayoutState] = useState<ConversationLayout>(() => {
    const saved = localStorage.getItem('app-layout');
    if (saved === 'list' || saved === 'grid' || saved === 'compact') return saved;
    return 'list';
  });

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleHeader = () => setHeaderVisible(prev => !prev);
  const toggleTheme = () => setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setLayout = (newLayout: ConversationLayout) => {
    setLayoutState(newLayout);
    localStorage.setItem('app-layout', newLayout);
  };

  // Apply theme to document
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  return (
    <UIContext.Provider value={{
      sidebarOpen,
      setSidebarOpen,
      toggleSidebar,
      headerVisible,
      setHeaderVisible,
      toggleHeader,
      theme,
      setTheme,
      toggleTheme,
      layout,
      setLayout,
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
