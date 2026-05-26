'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialSession?: Session | null;
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: initialSession?.user ?? null,
    session: initialSession ?? null,
    isLoading: !initialSession,
    isAuthenticated: !!initialSession,
  });

  // Create Supabase client only when env vars are available
  const [supabase] = useState(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      return null;
    }
    
    return createBrowserClient(url, key);
  });

  useEffect(() => {
    // Skip if supabase client is not available (build time or missing env vars)
    if (!supabase) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          isAuthenticated: !!session,
        });
      } catch (error) {
        console.error('Error getting session:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    if (!initialSession) {
      getInitialSession();
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          isAuthenticated: !!session,
        });

        if (event === 'SIGNED_IN') {
          toast.success('Successfully signed in!');
          router.refresh();
        } else if (event === 'SIGNED_OUT') {
          toast.success('Successfully signed out');
          router.push('/');
          router.refresh();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, initialSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase is not configured' } as AuthError };
    }
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error(error.message);
      return { error };
    }

    return { error: null };
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase is not configured' } as AuthError };
    }
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name ?? '',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error(error.message);
      return { error };
    }

    toast.success('Account created! Please check your email to verify your account.');
    setState(prev => ({ ...prev, isLoading: false }));
    return { error: null };
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error(error.message);
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, [supabase]);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase is not configured' } as AuthError };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      return { error };
    }

    toast.success('Password reset email sent!');
    return { error: null };
  }, [supabase]);

  const refreshSession = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error refreshing session:', error);
      return;
    }

    setState({
      user: session?.user ?? null,
      session,
      isLoading: false,
      isAuthenticated: !!session,
    });
  }, [supabase]);

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;