/**
 * GridPlay useMediaQuery Hook
 * 
 * Custom hook for responsive design with breakpoints matching Tailwind.
 */

import { useState, useEffect, useCallback } from 'react';
import { BREAKPOINTS } from '../lib/constants';

export type Breakpoint = keyof typeof BREAKPOINTS;

export interface UseMediaQueryReturn {
  /** Whether the media query matches */
  matches: boolean;
  /** Whether the screen is at least the given breakpoint */
  isAtLeast: (breakpoint: Breakpoint) => boolean;
  /** Whether the screen is at most the given breakpoint */
  isAtMost: (breakpoint: Breakpoint) => boolean;
  /** Current breakpoint name */
  currentBreakpoint: Breakpoint | 'xs';
}

/**
 * Hook to check if a media query matches
 * @param query - CSS media query string
 * @returns Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event handler
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener (using addEventListener for modern browsers)
    mediaQuery.addEventListener('change', handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

/**
 * Hook for responsive design with breakpoint utilities
 * @returns Object with breakpoint utilities
 */
export function useBreakpoint(): UseMediaQueryReturn {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint | 'xs'>('xs');

  // Media query matches for each breakpoint
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.SM}px)`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.MD}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.LG}px)`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.XL}px)`);
  const is2Xl = useMediaQuery(`(min-width: ${BREAKPOINTS['2XL']}px)`);

  // Determine current breakpoint
  useEffect(() => {
    if (is2Xl) {
      setCurrentBreakpoint('2XL');
    } else if (isXl) {
      setCurrentBreakpoint('XL');
    } else if (isLg) {
      setCurrentBreakpoint('LG');
    } else if (isMd) {
      setCurrentBreakpoint('MD');
    } else if (isSm) {
      setCurrentBreakpoint('SM');
    } else {
      setCurrentBreakpoint('xs');
    }
  }, [isSm, isMd, isLg, isXl, is2Xl]);

  // Check if screen is at least a given breakpoint
  const isAtLeast = useCallback((breakpoint: Breakpoint): boolean => {
    switch (breakpoint) {
      case 'SM':
        return isSm;
      case 'MD':
        return isMd;
      case 'LG':
        return isLg;
      case 'XL':
        return isXl;
      case '2XL':
        return is2Xl;
      default:
        return false;
    }
  }, [isSm, isMd, isLg, isXl, is2Xl]);

  // Check if screen is at most a given breakpoint
  const isAtMost = useCallback((breakpoint: Breakpoint): boolean => {
    return !isAtLeast(breakpoint);
  }, [isAtLeast]);

  return {
    matches: isSm, // Default to most common mobile-first check
    isAtLeast,
    isAtMost,
    currentBreakpoint,
  };
}

/**
 * Predefined media query hooks for common breakpoints
 */
export function useIsMobile(): boolean {
  return !useMediaQuery(`(min-width: ${BREAKPOINTS.MD}px)`);
}

export function useIsTablet(): boolean {
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.MD}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.LG}px)`);
  return isMd && !isLg;
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.LG}px)`);
}

export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export default useMediaQuery;
