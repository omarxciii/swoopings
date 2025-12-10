/**
 * useAuth Hook
 * 
 * File Purpose:
 * - Manages authentication state and user session
 * - Provides login, signup, logout, and password reset functions
 * - Handles Supabase auth state changes
 * 
 * Dependencies:
 * - @supabase/supabase-js
 * - @supabase/auth-helpers-nextjs
 * - src/lib/supabase.ts
 * 
 * High-Level Logic:
 * - Subscribes to Supabase auth state changes
 * - Stores user session and profile data
 * - Provides auth methods (sign up, sign in, sign out)
 * - Handles error states and loading
 * 
 * Usage:
 * const { user, session, loading, signUp, signIn, signOut } = useAuth();
 * 
 * Assumptions:
 * - Must be called from client component
 * - Supabase auth is properly configured
 * - User profile exists in profiles table
 * 
 * Areas Needing Work:
 * - Add persist session to localStorage
 * - Add refresh token handling
 * - Add OAuth provider support
 * - Add MFA support (future)
 * 
 * History:
 * - 2025-12-06: Initial creation
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, AuthError, AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
}

interface UseAuthReturn extends AuthState {
  signUp: (email: string, password: string) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Check current auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setState(prev => ({
          ...prev,
          user,
          loading: false,
        }));
      } catch (error) {
        console.error('Auth check failed:', error);
        setState(prev => ({
          ...prev,
          loading: false,
        }));
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
        }));
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string): Promise<User | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const { data: { user }, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        setState(prev => ({ ...prev, user, loading: false }));
        return user;
      } catch (error) {
        const authError = error as AuthError;
        setState(prev => ({
          ...prev,
          error: authError,
          loading: false,
        }));
        console.error('Sign up error:', error);
        return null;
      }
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<User | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        setState(prev => ({ ...prev, user, loading: false }));
        return user;
      } catch (error) {
        const authError = error as AuthError;
        setState(prev => ({
          ...prev,
          error: authError,
          loading: false,
        }));
        console.error('Sign in error:', error);
        return null;
      }
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setState(prev => ({
        ...prev,
        user: null,
        loading: false,
      }));
    } catch (error) {
      console.error('Sign out error:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<void> => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        });
        if (error) throw error;
        setState(prev => ({ ...prev, loading: false }));
      } catch (error) {
        const authError = error as AuthError;
        setState(prev => ({
          ...prev,
          error: authError,
          loading: false,
        }));
        console.error('Password reset error:', error);
      }
    },
    []
  );

  const updatePassword = useCallback(
    async (newPassword: string): Promise<void> => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;
        setState(prev => ({ ...prev, loading: false }));
      } catch (error) {
        const authError = error as AuthError;
        setState(prev => ({
          ...prev,
          error: authError,
          loading: false,
        }));
        console.error('Password update error:', error);
      }
    },
    []
  );

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };
};
