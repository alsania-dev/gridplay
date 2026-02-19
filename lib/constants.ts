/**
 * GridPlay Application Constants
 * 
 * Centralized constants for game modes, grid sizes, and application settings.
 * Avoids magic numbers and provides type-safe constant values.
 */

// ===========================================
// Game Mode Configuration
// ===========================================

/**
 * Supported game modes for GridPlay
 */
export const GAME_MODES = {
  SHOTGUN: 'shotgun',
  FIVE_BY_FIVE: '5x5',
  TEN_BY_TEN: '10x10',
} as const;

/**
 * Grid size configurations for each game mode
 */
export const GRID_SIZES = {
  [GAME_MODES.SHOTGUN]: { rows: 1, cols: 25, totalCells: 25 },
  [GAME_MODES.FIVE_BY_FIVE]: { rows: 5, cols: 5, totalCells: 25 },
  [GAME_MODES.TEN_BY_TEN]: { rows: 10, cols: 10, totalCells: 100 },
} as const;

/**
 * Default game mode for new boards
 */
export const DEFAULT_GAME_MODE = GAME_MODES.TEN_BY_TEN;

// ===========================================
// Score Configuration
// ===========================================

/**
 * Score range for football squares (0-9)
 */
export const SCORE_RANGE = {
  MIN: 0,
  MAX: 9,
} as const;

/**
 * Possible score values for display
 */
export const SCORE_VALUES = Array.from(
  { length: SCORE_RANGE.MAX - SCORE_RANGE.MIN + 1 },
  (_, i) => i
);

// ===========================================
// Payment Configuration
// ===========================================

/**
 * Supported payment providers
 */
export const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
} as const;

/**
 * Currency configuration
 */
export const CURRENCY = {
  CODE: 'USD',
  SYMBOL: '$',
} as const;

/**
 * Default cell price in cents (to avoid floating point issues)
 */
export const DEFAULT_CELL_PRICE_CENTS = 100; // $1.00

/**
 * Minimum and maximum cell prices
 */
export const CELL_PRICE_LIMITS = {
  MIN_CENTS: 10, // $0.10
  MAX_CENTS: 100000, // $1,000.00
} as const;

// ===========================================
// Board Status
// ===========================================

/**
 * Board status lifecycle
 */
export const BOARD_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  LOCKED: 'locked',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// ===========================================
// Team Configuration
// ===========================================

/**
 * Team types for board assignment
 */
export const TEAM_TYPES = {
  HOME: 'home',
  AWAY: 'away',
} as const;

// ===========================================
// UI Configuration
// ===========================================

/**
 * Application theme colors
 */
export const THEME_COLORS = {
  PRIMARY: '#10B981', // Emerald green
  SECONDARY: '#1E3A5F', // Navy blue
  ACCENT: '#34D399', // Light emerald
  BACKGROUND: '#0A0A0A', // Dark background
  SURFACE: '#1A1A1A', // Card background
  TEXT: '#E5E5E5', // Light text
  TEXT_MUTED: '#9CA3AF', // Muted text
  ERROR: '#EF4444', // Red
  SUCCESS: '#22C55E', // Green
  WARNING: '#F59E0B', // Amber
} as const;

/**
 * Breakpoints for responsive design (in pixels)
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

/**
 * Animation durations in milliseconds
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// ===========================================
// API Configuration
// ===========================================

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  BOARDS: '/api/boards',
  PAYMENTS: '/api/payments',
  USERS: '/api/users',
  HEALTH: '/api/health',
} as const;

/**
 * API rate limiting configuration
 */
export const RATE_LIMITS = {
  WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS: 100,
} as const;

// ===========================================
// Sports API Configuration
// ===========================================

/**
 * Supported sports leagues
 */
export const SPORTS_LEAGUES = {
  NFL: 'nfl',
  NBA: 'nba',
  MLB: 'mlb',
  NHL: 'nhl',
  COLLEGE_FOOTBALL: 'ncaaf',
  COLLEGE_BASKETBALL: 'ncaab',
} as const;

/**
 * Default sports API refresh interval in milliseconds
 */
export const SCORES_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

// ===========================================
// Session Configuration
// ===========================================

/**
 * Session timeout in milliseconds
 */
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Token refresh interval in milliseconds
 */
export const TOKEN_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour

// ===========================================
// Validation Constants
// ===========================================

/**
 * Username validation rules
 */
export const USERNAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  PATTERN: /^[a-zA-Z0-9_]+$/,
} as const;

/**
 * Password validation rules
 */
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
} as const;

/**
 * Board name validation rules
 */
export const BOARD_NAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 50,
} as const;
