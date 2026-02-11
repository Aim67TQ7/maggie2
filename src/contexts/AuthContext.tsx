'use client';

import {
  createContext,
  useContext,
  useState,
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

function storedUser(): MaggieUser | null {
  if (typeof window === 'undefined') return null;
  if (localStorage.getItem(STORAGE_KEY) !== 'true') return null;
  const name = localStorage.getItem(NAME_KEY) || 'Bunting User';
  const email = localStorage.getItem(EMAIL_KEY) || 'user@buntingmagnetics.com';
  return { id: '1', email, name, role: 'admin' };
}

// --- Provider ---

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MaggieUser | null>(storedUser);
  const [error, setError] = useState<string | null>(null);

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
    const newUser: MaggieUser = { id: '1', email: finalEmail, name: finalName, role: 'admin' };
    setUser(newUser);
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
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading: false, error, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
