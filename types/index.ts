/**
 * GridPlay TypeScript Type Definitions
 * 
 * Centralized type definitions for the entire application.
 * Provides type safety for game modes, boards, players, and payments.
 */

import type { GAME_MODES, BOARD_STATUS, PAYMENT_PROVIDERS, TEAM_TYPES, SPORTS_LEAGUES } from '../lib/constants';

// ===========================================
// Game Mode Types
// ===========================================

/**
 * Supported game modes
 */
export type GameMode = typeof GAME_MODES[keyof typeof GAME_MODES];

/**
 * Grid size configuration for a game mode
 */
export interface GridSize {
  rows: number;
  cols: number;
  totalCells: number;
}

/**
 * Score grid type - 2D array of score values
 */
export type ScoreGrid = (number | '?')[][];

// ===========================================
// Board Types
// ===========================================

/**
 * Board status lifecycle
 */
export type BoardStatus = typeof BOARD_STATUS[keyof typeof BOARD_STATUS];

/**
 * Cell ownership information
 */
export interface CellOwner {
  userId: string;
  displayName: string;
  claimedAt: string; // ISO timestamp
}

/**
 * Individual cell on the board
 */
export interface BoardCell {
  row: number;
  col: number;
  owner: CellOwner | null;
  homeScore: number | null;
  awayScore: number | null;
  isWinner: boolean;
}

/**
 * Team information for a board
 */
export interface BoardTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo?: string;
  score?: number;
}

/**
 * Board configuration
 */
export interface BoardConfig {
  mode: GameMode;
  pricePerCell: number; // in cents
  homeTeam: BoardTeam;
  awayTeam: BoardTeam;
  sport: typeof SPORTS_LEAGUES[keyof typeof SPORTS_LEAGUES];
  externalGameId?: string;
  gameStartTime?: string; // ISO timestamp
}

/**
 * Complete board state
 */
export interface BoardState {
  id: string;
  name: string;
  config: BoardConfig;
  status: BoardStatus;
  cells: BoardCell[];
  rowScores: number[];
  colScores: number[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lockedAt?: string;
  completedAt?: string;
}

/**
 * Board creation payload
 */
export interface CreateBoardPayload {
  name: string;
  mode: GameMode;
  pricePerCell: number;
  homeTeamId: string;
  awayTeamId: string;
  sport: typeof SPORTS_LEAGUES[keyof typeof SPORTS_LEAGUES];
  externalGameId?: string;
  gameStartTime?: string;
}

/**
 * Board list item (for board listings)
 */
export interface BoardListItem {
  id: string;
  name: string;
  mode: GameMode;
  status: BoardStatus;
  pricePerCell: number;
  homeTeam: BoardTeam;
  awayTeam: BoardTeam;
  availableCells: number;
  totalCells: number;
  createdBy: string;
  createdAt: string;
}

// ===========================================
// Player/User Types
// ===========================================

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User statistics
 */
export interface UserStats {
  totalBoards: number;
  totalCells: number;
  totalWins: number;
  totalEarnings: number; // in cents
}

/**
 * User with statistics
 */
export interface UserWithStats extends UserProfile {
  stats: UserStats;
}

/**
 * Cell claim payload
 */
export interface ClaimCellPayload {
  boardId: string;
  row: number;
  col: number;
}

// ===========================================
// Payment Types
// ===========================================

/**
 * Payment provider type
 */
export type PaymentProvider = typeof PAYMENT_PROVIDERS[keyof typeof PAYMENT_PROVIDERS];

/**
 * Payment status
 */
export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

/**
 * Payment method details
 */
export interface PaymentMethod {
  provider: PaymentProvider;
  last4?: string;
  brand?: string;
}

/**
 * Payment record
 */
export interface Payment {
  id: string;
  userId: string;
  boardId: string;
  amount: number; // in cents
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerPaymentId?: string;
  cells: Array<{ row: number; col: number }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment creation payload
 */
export interface CreatePaymentPayload {
  boardId: string;
  cells: Array<{ row: number; col: number }>;
  provider: PaymentProvider;
  paymentMethodId?: string; // For Stripe
}

/**
 * Payment confirmation response
 */
export interface PaymentConfirmation {
  success: boolean;
  paymentId?: string;
  clientSecret?: string; // For Stripe
  approvalUrl?: string; // For PayPal
  error?: string;
}

// ===========================================
// Sports API Types
// ===========================================

/**
 * Team type (home/away)
 */
export type TeamType = typeof TEAM_TYPES[keyof typeof TEAM_TYPES];

/**
 * Sports league type
 */
export type SportsLeague = typeof SPORTS_LEAGUES[keyof typeof SPORTS_LEAGUES];

/**
 * Game score information
 */
export interface GameScore {
  gameId: string;
  homeTeam: BoardTeam;
  awayTeam: BoardTeam;
  homeScore: number;
  awayScore: number;
  period?: string;
  timeRemaining?: string;
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'cancelled';
  startTime: string;
}

/**
 * Sports API response for games
 */
export interface SportsGamesResponse {
  games: GameScore[];
  lastUpdated: string;
}

// ===========================================
// API Response Types
// ===========================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ===========================================
// Authentication Types
// ===========================================

/**
 * Auth session
 */
export interface AuthSession {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration payload
 */
export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

// ===========================================
// WebSocket Event Types
// ===========================================

/**
 * WebSocket event types for real-time updates
 */
export type WebSocketEventType = 
  | 'cell_claimed'
  | 'board_locked'
  | 'score_update'
  | 'winner_announced'
  | 'board_completed';

/**
 * WebSocket event payload
 */
export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  boardId: string;
  data: T;
  timestamp: string;
}

/**
 * Cell claimed event data
 */
export interface CellClaimedData {
  row: number;
  col: number;
  owner: CellOwner;
}

/**
 * Score update event data
 */
export interface ScoreUpdateData {
  homeScore: number;
  awayScore: number;
  quarter?: string;
  timeRemaining?: string;
}

/**
 * Winner announcement data
 */
export interface WinnerData {
  winningCells: Array<{ row: number; col: number }>;
  winner: CellOwner;
  prize: number;
}
