/**
 * AuthProvider Component
 * 
 * File Purpose:
 * - Provides global authentication context to entire app
 * - Manages user session state across all components
 * - Handles auth state initialization on app load
 * - Makes user session available via useAuthContext hook
 * 
 * Dependencies:
 * - React context API
 * - src/hooks/useAuth.ts (auth logic)
 * - src/types/index.ts (User type from Supabase)
 * 
 * High-Level Logic:
 * - Wraps app with AuthContext.Provider
 * - useAuth hook runs and gets auth state
 * - Provides user, loading, error to all children
 * - Children can call useAuthContext to access state
 * 
 * Assumptions:
 * - Mounted at root level of app
 * - useAuth hook handles all auth operations
 * 
 * Areas Needing Work:
 * - Add error boundary
 * - Add loading screen during auth check
 * 
 * History:
 * - 2025-12-06: Initial creation
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signUp: (email: string, password: string) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 * Must be called from component inside AuthProvider
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  
  return context;
}
