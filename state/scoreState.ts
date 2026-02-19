/**
 * GridPlay Score State
 * 
 * Recoil atoms for managing game scores and board state.
 * Uses proper TypeScript typing for all state values.
 */

import { atom } from 'recoil';
import type { GameMode, ScoreGrid, BoardState } from '../types';

/**
 * Default score grid generator
 * Creates a grid with "?" placeholders for unrevealed scores
 */
const createDefaultScoreGrid = (rows: number, cols: number): ScoreGrid => {
  return Array(rows).fill(null).map(() => 
    Array(cols).fill('?')
  );
};

/**
 * Score state for the game board
 * Stores the current score assignments for rows and columns
 */
export const scoreState = atom<ScoreGrid>({
  key: 'scoreState',
  default: createDefaultScoreGrid(2, 10),
});

/**
 * Current game mode state
 * Determines the board size and game rules
 */
export const gameModeState = atom<GameMode>({
  key: 'gameModeState',
  default: '10x10',
});

/**
 * Board state containing all game data
 */
export const boardState = atom<BoardState | null>({
  key: 'boardState',
  default: null,
});

/**
 * Selected cell state for user interaction
 */
export const selectedCellState = atom<{ row: number; col: number } | null>({
  key: 'selectedCellState',
  default: null,
});

/**
 * Loading state for async operations
 */
export const isLoadingState = atom<boolean>({
  key: 'isLoadingState',
  default: false,
});

/**
 * Error state for displaying errors to users
 */
export const errorState = atom<string | null>({
  key: 'errorState',
  default: null,
});
