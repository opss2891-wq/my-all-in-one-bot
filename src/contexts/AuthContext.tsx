import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
  loginWithPin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for PIN access
const MOCK_USER: any = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'guest@databot.io',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: { full_name: 'Guest User' },
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

const MOCK_SESSION: any = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: MOCK_USER
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for PIN access first
    const pinAccess = localStorage.getItem('databot_pin_access') === 'true';
    
    if (pinAccess) {
      setSession(MOCK_SESSION);
      setUser(MOCK_USER);
      setLoading(false);
      return;
    }

    // Get initial Supabase session (as fallback or if still used)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only update if not in PIN mode
      if (localStorage.getItem('databot_pin_access') !== 'true') {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithPin = () => {
    localStorage.setItem('databot_pin_access', 'true');
    setSession(MOCK_SESSION);
    setUser(MOCK_USER);
  };

  const logout = async () => {
    localStorage.removeItem('databot_pin_access');
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, logout, loginWithPin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};