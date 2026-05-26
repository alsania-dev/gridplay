import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase v2 client using SSR package for browser-side usage
// Note: For production, generate types with `supabase gen types typescript` 
// and import them for full type safety

// Create a lazy client that only initializes when URL/key are available
// This prevents build-time errors when env vars aren't set
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    // Return a mock client for build time or when env vars are missing
    // This allows the app to build without Supabase credentials
    if (typeof window !== 'undefined') {
      console.warn('Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    return null;
  }
  
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey);
  }
  
  return supabaseInstance;
}

// Export a proxy that forwards calls to the actual client
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      // Return a no-op function for missing client
      return () => Promise.resolve({ data: null, error: new Error('Supabase not configured') });
    }
    return client[prop as keyof typeof client];
  }
});
