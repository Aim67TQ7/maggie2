'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { MaggieUser, UserRole } from '@/types';

const PASSCODE = '5411';
const STORAGE_KEY = 'maggie2_authenticated';
const NAME_KEY = 'maggie2_user_name';
const EMAIL_KEY = 'maggie2_user_email';

// --- Context ---

interface AuthContextValue {
  user: MaggieUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (passcode: string, name?: string) => { error?: string };
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// --- Provider ---

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MaggieUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage on client only
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      const name = localStorage.getItem(NAME_KEY) || 'Bunting User';
      const email = localStorage.getItem(EMAIL_KEY) || 'user@buntingmagnetics.com';
      setUser({ id: '1', email, name, role: 'admin' });
    }
    setIsLoading(false);
  }, []);

  const isAuthenticated = user !== null;

  const login = useCallback((passcode: string, name?: string) => {
    if (passcode !== PASSCODE) {
      setError('Invalid passcode');
      return { error: 'Invalid passcode' };
    }
    const finalName = name?.trim() || 'Bunting User';
    const finalEmail = `${finalName.toLowerCase().replace(/\s+/g, '.')}@buntingmagnetics.com`;
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.setItem(NAME_KEY, finalName);
    localStorage.setItem(EMAIL_KEY, finalEmail);
    setUser({ id: '1', email: finalEmail, name: finalName, role: 'admin' });
    setError(null);
    return {};
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!user) return false;
      const roles = Array.isArray(role) ? role : [role];
      if (user.role === 'admin') return true;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, error, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
