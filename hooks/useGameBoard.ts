/**
 * GridPlay useGameBoard Hook
 * 
 * Manages game board state, cell selection/claiming, and winner calculation.
 * Implements Fisher-Yates shuffle for random number assignment.
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  BoardCell, 
  BoardState, 
  GameMode, 
  CellOwner,
  BoardTeam,
  BoardConfig,
} from '../types';
import { 
  GAME_MODES, 
  GRID_SIZES, 
  BOARD_STATUS,
  SCORE_RANGE,
} from '../lib/constants';

export interface UseGameBoardOptions {
  /** Game mode (shotgun, 5x5, 10x10) */
  mode: GameMode;
  /** Initial board state (if loading from DB) */
  initialState?: BoardState;
  /** Current user ID */
  userId?: string;
  /** Current user display name */
  displayName?: string;
  /** Callback when a cell is claimed */
  onCellClaim?: (row: number, col: number) => void | Promise<void>;
  /** Callback when game starts */
  onGameStart?: () => void | Promise<void>;
}

export interface UseGameBoardReturn {
  /** Board state */
  boardState: BoardState;
  /** All cells in the grid */
  cells: BoardCell[];
  /** Row score headers (0-9 shuffled) */
  rowScores: number[];
  /** Column score headers (0-9 shuffled) */
  colScores: number[];
  /** Currently selected cells */
  selectedCells: Array<{ row: number; col: number }>;
  /** Whether the board is locked */
  isLocked: boolean;
  /** Whether the game has started */
  hasStarted: boolean;
  /** Whether the game is completed */
  isCompleted: boolean;
  /** Available cells count */
  availableCells: number;
  /** Claimed cells count */
  claimedCells: number;
  /** Select a cell */
  selectCell: (row: number, col: number) => void;
  /** Deselect a cell */
  deselectCell: (row: number, col: number) => void;
  /** Toggle cell selection */
  toggleCell: (row: number, col: number) => void;
  /** Claim selected cells for current user */
  claimSelectedCells: () => Promise<void>;
  /** Claim a specific cell */
  claimCell: (row: number, col: number) => Promise<void>;
  /** Generate random scores using Fisher-Yates shuffle */
  generateScores: () => void;
  /** Calculate winners based on final scores */
  calculateWinners: (homeScore: number, awayScore: number) => Array<{ row: number; col: number }>;
  /** Lock the board */
  lockBoard: () => void;
  /** Start the game */
  startGame: () => void;
  /** Complete the game */
  completeGame: () => void;
  /** Reset the board */
  resetBoard: () => void;
  /** Get cell at position */
  getCell: (row: number, col: number) => BoardCell | undefined;
  /** Check if cell is selected */
  isCellSelected: (row: number, col: number) => boolean;
  /** Check if cell is claimed */
  isCellClaimed: (row: number, col: number) => boolean;
  /** Get winning cells */
  winningCells: BoardCell[];
}

/**
 * Fisher-Yates shuffle algorithm
 * Returns a new shuffled array (does not mutate original)
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate initial cells for a game board
 */
function generateInitialCells(mode: GameMode): BoardCell[] {
  const { rows, cols } = GRID_SIZES[mode];
  const cells: BoardCell[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        row,
        col,
        owner: null,
        homeScore: null,
        awayScore: null,
        isWinner: false,
      });
    }
  }

  return cells;
}

/**
 * Generate default board config
 */
function generateDefaultConfig(mode: GameMode): BoardConfig {
  const defaultTeam: BoardTeam = {
    id: 'default',
    name: 'Team',
    abbreviation: 'TM',
  };

  return {
    mode,
    pricePerCell: 100, // $1.00 in cents
    homeTeam: { ...defaultTeam, id: 'home', name: 'Home Team', abbreviation: 'HOME' },
    awayTeam: { ...defaultTeam, id: 'away', name: 'Away Team', abbreviation: 'AWAY' },
    sport: 'nfl',
  };
}

/**
 * Custom hook for managing game board state
 * 
 * @example
 * ```tsx
 * const gameBoard = useGameBoard({
 *   mode: '10x10',
 *   userId: 'user-123',
 *   displayName: 'John Doe',
 * });
 * 
 * // Select cells
 * gameBoard.toggleCell(0, 0);
 * gameBoard.toggleCell(1, 1);
 * 
 * // Claim selected cells
 * await gameBoard.claimSelectedCells();
 * 
 * // Generate random scores
 * gameBoard.generateScores();
 * 
 * // Calculate winners
 * const winners = gameBoard.calculateWinners(21, 14);
 * ```
 */
export function useGameBoard(options: UseGameBoardOptions): UseGameBoardReturn {
  const {
    mode,
    initialState,
    userId,
    displayName,
    onCellClaim,
    onGameStart,
  } = options;

  const gridSize = GRID_SIZES[mode];

  // Initialize state
  const [boardState, setBoardState] = useState<BoardState>(() => {
    if (initialState) {
      return initialState;
    }

    return {
      id: '',
      name: `New ${mode.toUpperCase()} Board`,
      config: generateDefaultConfig(mode),
      status: BOARD_STATUS.OPEN,
      cells: generateInitialCells(mode),
      rowScores: [],
      colScores: [],
      createdBy: userId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [selectedCells, setSelectedCells] = useState<Array<{ row: number; col: number }>>([]);

  // Derived state
  const cells = useMemo(() => boardState.cells, [boardState.cells]);
  const rowScores = useMemo(() => boardState.rowScores, [boardState.rowScores]);
  const colScores = useMemo(() => boardState.colScores, [boardState.colScores]);

  const isLocked = useMemo(() => 
    boardState.status === BOARD_STATUS.LOCKED || 
    boardState.status === BOARD_STATUS.IN_PROGRESS ||
    boardState.status === BOARD_STATUS.COMPLETED,
    [boardState.status]
  );

  const hasStarted = useMemo(() => 
    boardState.status === BOARD_STATUS.IN_PROGRESS ||
    boardState.status === BOARD_STATUS.COMPLETED,
    [boardState.status]
  );

  const isCompleted = useMemo(() => 
    boardState.status === BOARD_STATUS.COMPLETED,
    [boardState.status]
  );

  const availableCells = useMemo(() => 
    cells.filter(cell => cell.owner === null).length,
    [cells]
  );

  const claimedCells = useMemo(() => 
    cells.filter(cell => cell.owner !== null).length,
    [cells]
  );

  const winningCells = useMemo(() => 
    cells.filter(cell => cell.isWinner),
    [cells]
  );

  // Get cell at position
  const getCell = useCallback((row: number, col: number): BoardCell | undefined => {
    return cells.find(cell => cell.row === row && cell.col === col);
  }, [cells]);

  // Check if cell is selected
  const isCellSelected = useCallback((row: number, col: number): boolean => {
    return selectedCells.some(cell => cell.row === row && cell.col === col);
  }, [selectedCells]);

  // Check if cell is claimed
  const isCellClaimed = useCallback((row: number, col: number): boolean => {
    const cell = getCell(row, col);
    return cell?.owner !== null;
  }, [getCell]);

  // Select a cell
  const selectCell = useCallback((row: number, col: number) => {
    if (isLocked || isCellClaimed(row, col)) return;
    
    setSelectedCells(prev => {
      if (prev.some(cell => cell.row === row && cell.col === col)) {
        return prev;
      }
      return [...prev, { row, col }];
    });
  }, [isLocked, isCellClaimed]);

  // Deselect a cell
  const deselectCell = useCallback((row: number, col: number) => {
    setSelectedCells(prev => 
      prev.filter(cell => !(cell.row === row && cell.col === col))
    );
  }, []);

  // Toggle cell selection
  const toggleCell = useCallback((row: number, col: number) => {
    if (isLocked || isCellClaimed(row, col)) return;

    if (isCellSelected(row, col)) {
      deselectCell(row, col);
    } else {
      selectCell(row, col);
    }
  }, [isLocked, isCellClaimed, isCellSelected, selectCell, deselectCell]);

  // Claim a specific cell
  const claimCell = useCallback(async (row: number, col: number) => {
    if (isLocked || isCellClaimed(row, col) || !userId || !displayName) return;

    const cellOwner: CellOwner = {
      userId,
      displayName,
      claimedAt: new Date().toISOString(),
    };

    setBoardState(prev => ({
      ...prev,
      cells: prev.cells.map(cell => 
        cell.row === row && cell.col === col
          ? { ...cell, owner: cellOwner }
          : cell
      ),
      updatedAt: new Date().toISOString(),
    }));

    // Remove from selected if present
    setSelectedCells(prev => 
      prev.filter(cell => !(cell.row === row && cell.col === col))
    );

    // Call callback
    if (onCellClaim) {
      await onCellClaim(row, col);
    }
  }, [isLocked, isCellClaimed, userId, displayName, onCellClaim]);

  // Claim all selected cells
  const claimSelectedCells = useCallback(async () => {
    if (isLocked || selectedCells.length === 0 || !userId || !displayName) return;

    const cellOwner: CellOwner = {
      userId,
      displayName,
      claimedAt: new Date().toISOString(),
    };

    setBoardState(prev => ({
      ...prev,
      cells: prev.cells.map(cell => {
        const isSelected = selectedCells.some(
          selected => selected.row === cell.row && selected.col === cell.col
        );
        if (isSelected && cell.owner === null) {
          return { ...cell, owner: cellOwner };
        }
        return cell;
      }),
      updatedAt: new Date().toISOString(),
    }));

    // Clear selection
    setSelectedCells([]);

    // Call callbacks for each claimed cell
    if (onCellClaim) {
      for (const { row, col } of selectedCells) {
        await onCellClaim(row, col);
      }
    }
  }, [isLocked, selectedCells, userId, displayName, onCellClaim]);

  // Generate random scores using Fisher-Yates shuffle
  const generateScores = useCallback(() => {
    // Generate scores 0-9
    const baseScores = Array.from(
      { length: SCORE_RANGE.MAX - SCORE_RANGE.MIN + 1 },
      (_, i) => i
    );

    // Shuffle for rows and columns separately
    const newRowScores = fisherYatesShuffle(baseScores);
    const newColScores = fisherYatesShuffle(baseScores);

    // For 5x5 mode, we only need 5 scores
    const rowScoreCount = mode === GAME_MODES.FIVE_BY_FIVE ? 5 : gridSize.rows;
    const colScoreCount = mode === GAME_MODES.FIVE_BY_FIVE ? 5 : gridSize.cols;

    setBoardState(prev => ({
      ...prev,
      rowScores: newRowScores.slice(0, rowScoreCount),
      colScores: newColScores.slice(0, colScoreCount),
      updatedAt: new Date().toISOString(),
    }));
  }, [mode, gridSize]);

  // Calculate winners based on final scores
  const calculateWinners = useCallback((homeScore: number, awayScore: number): Array<{ row: number; col: number }> => {
    if (rowScores.length === 0 || colScores.length === 0) {
      return [];
    }

    // Get the last digit of each score
    const homeDigit = homeScore % 10;
    const awayDigit = awayScore % 10;

    // Find the row and column indices
    const rowIndex = rowScores.indexOf(homeDigit);
    const colIndex = colScores.indexOf(awayDigit);

    if (rowIndex === -1 || colIndex === -1) {
      return [];
    }

    // Mark winning cells
    const winningPositions: Array<{ row: number; col: number }> = [];

    setBoardState(prev => ({
      ...prev,
      cells: prev.cells.map(cell => {
        if (cell.row === rowIndex && cell.col === colIndex) {
          winningPositions.push({ row: cell.row, col: cell.col });
          return { ...cell, isWinner: true };
        }
        return cell;
      }),
      updatedAt: new Date().toISOString(),
    }));

    return winningPositions;
  }, [rowScores, colScores]);

  // Lock the board
  const lockBoard = useCallback(() => {
    setBoardState(prev => ({
      ...prev,
      status: BOARD_STATUS.LOCKED,
      lockedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Start the game
  const startGame = useCallback(() => {
    setBoardState(prev => ({
      ...prev,
      status: BOARD_STATUS.IN_PROGRESS,
      updatedAt: new Date().toISOString(),
    }));

    if (onGameStart) {
      onGameStart();
    }
  }, [onGameStart]);

  // Complete the game
  const completeGame = useCallback(() => {
    setBoardState(prev => ({
      ...prev,
      status: BOARD_STATUS.COMPLETED,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Reset the board
  const resetBoard = useCallback(() => {
    setBoardState(prev => ({
      ...prev,
      status: BOARD_STATUS.OPEN,
      cells: generateInitialCells(mode),
      rowScores: [],
      colScores: [],
      lockedAt: undefined,
      completedAt: undefined,
      updatedAt: new Date().toISOString(),
    }));
    setSelectedCells([]);
  }, [mode]);

  return {
    boardState,
    cells,
    rowScores,
    colScores,
    selectedCells,
    isLocked,
    hasStarted,
    isCompleted,
    availableCells,
    claimedCells,
    selectCell,
    deselectCell,
    toggleCell,
    claimSelectedCells,
    claimCell,
    generateScores,
    calculateWinners,
    lockBoard,
    startGame,
    completeGame,
    resetBoard,
    getCell,
    isCellSelected,
    isCellClaimed,
    winningCells,
  };
}

export default useGameBoard;