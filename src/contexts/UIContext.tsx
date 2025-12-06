import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UIContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  headerVisible: boolean;
  setHeaderVisible: (visible: boolean) => void;
  toggleHeader: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleHeader = () => setHeaderVisible(prev => !prev);

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
