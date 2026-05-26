'use client';

import { RecoilRoot } from 'recoil';
import { createBrowserClient } from '@supabase/ssr';
import { createContext, useContext, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider } from './lib/auth/authContext';

// Session context for auth state
const SessionContext = createContext<{
  session: Session | null;
  supabase: ReturnType<typeof createBrowserClient> | null;
}>({
  session: null,
  supabase: null,
});

export const useSession = () => useContext(SessionContext);

interface ProvidersProps {
  children: React.ReactNode;
  initialSession?: Session | null;
}

export function Providers({ children, initialSession }: ProvidersProps) {
  // Create a Supabase client for browser-side usage with SSR package
  // Handle missing env vars gracefully
  const [supabaseClient] = useState(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      // Return null if env vars are missing (build time or misconfigured)
      return null;
    }
    
    return createBrowserClient(url, key);
  });

  const [session] = useState(initialSession ?? null);

  return (
    <SessionContext.Provider value={{ session, supabase: supabaseClient }}>
      <AuthProvider initialSession={initialSession}>
        <RecoilRoot>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          {children}
        </RecoilRoot>
      </AuthProvider>
    </SessionContext.Provider>
  );
}
