/**
 * GridPlay Application Entry Point
 * 
 * Sets up all necessary providers for the application:
 * - Chakra UI for component library
 * - Recoil for state management
 * - Custom providers for authentication and theming
 */

import { ChakraProvider, extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { RecoilRoot } from 'recoil';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { THEME_COLORS } from '../lib/constants';
import '../app/globals.css';

/**
 * Chakra UI theme configuration
 */
const themeConfig: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

/**
 * Custom Chakra UI theme with GridPlay branding
 */
const theme = extendTheme({
  config: themeConfig,
  colors: {
    brand: {
      50: '#E6FFF5',
      100: '#B3FFE0',
      200: '#80FFCB',
      300: '#4DFFB6',
      400: '#1AFFA1',
      500: THEME_COLORS.PRIMARY,
      600: '#0EA572',
      700: '#0B8A5F',
      800: '#086F4C',
      900: '#055439',
    },
    surface: {
      50: '#333333',
      100: '#2A2A2A',
      200: '#222222',
      300: '#1A1A1A',
      400: '#121212',
      500: THEME_COLORS.SURFACE,
      600: '#0A0A0A',
      700: '#080808',
      800: '#050505',
      900: '#030303',
    },
  },
  fonts: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  styles: {
    global: {
      body: {
        bg: THEME_COLORS.BACKGROUND,
        color: THEME_COLORS.TEXT,
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: THEME_COLORS.PRIMARY,
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: THEME_COLORS.PRIMARY,
      },
    },
  },
});

/**
 * Auth provider component for managing user sessions
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      // Handle auth state changes
      // Session updates are handled by Supabase internally
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}

/**
 * Main application component
 */
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <RecoilRoot>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </RecoilRoot>
    </ChakraProvider>
  );
}

export default MyApp;
