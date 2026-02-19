/**
 * Board Utilities for GridPlay
 * Handles board creation, square assignment, and board management
 */

export type BoardSize = '5x5' | '10x10';
export type BoardType = 'standard' | 'shotgun';

export interface BoardConfig {
  size: BoardSize;
  type: BoardType;
  pricePerSquare: number;
  totalSquares: number;
  homeTeam: string;
  awayTeam: string;
  gameId?: string;
}

export interface Square {
  id: string;
  boardId: string;
  row: number;
  col: number;
  rowNumber: number | null; // 0-9 for 10x10, 0-4 for 5x5
  colNumber: number | null;
  ownerId: string | null;
  ownerName?: string;
  ownerEmail?: string;
  purchasedAt: string | null;
  price: number;
  status: 'available' | 'reserved' | 'purchased';
}

export interface Board {
  id: string;
  name: string;
  config: BoardConfig;
  rowNumbers: number[];
  colNumbers: number[];
  squares: Square[];
  status: 'draft' | 'open' | 'locked' | 'completed';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  payoutConfig: PayoutConfig;
}

export interface PayoutConfig {
  firstQuarter: number;
  secondQuarter: number;
  thirdQuarter: number;
  final: number;
  total: number;
}

/**
 * Get the grid dimensions from board size
 */
export function getGridDimensions(size: BoardSize): { rows: number; cols: number } {
  const dimensions = {
    '5x5': { rows: 5, cols: 5 },
    '10x10': { rows: 10, cols: 10 },
  };
  return dimensions[size];
}

/**
 * Calculate total squares based on board size
 */
export function getTotalSquares(size: BoardSize): number {
  const { rows, cols } = getGridDimensions(size);
  return rows * cols;
}

/**
 * Calculate default payout distribution
 */
export function calculatePayouts(totalPot: number): PayoutConfig {
  // Standard distribution: 20% each quarter, 40% final
  return {
    firstQuarter: Math.round(totalPot * 0.2),
    secondQuarter: Math.round(totalPot * 0.2),
    thirdQuarter: Math.round(totalPot * 0.2),
    final: Math.round(totalPot * 0.4),
    total: totalPot,
  };
}

/**
 * Create empty squares for a board
 */
export function createEmptySquares(
  boardId: string,
  size: BoardSize,
  pricePerSquare: number
): Omit<Square, 'id'>[] {
  const { rows, cols } = getGridDimensions(size);
  const squares: Omit<Square, 'id'>[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      squares.push({
        boardId,
        row,
        col,
        rowNumber: null,
        colNumber: null,
        ownerId: null,
        purchasedAt: null,
        price: pricePerSquare,
        status: 'available',
      });
    }
  }

  return squares;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new board
 */
export function createBoard(
  config: BoardConfig,
  createdBy: string
): Omit<Board, 'id'> {
  const { rows, cols } = getGridDimensions(config.size);
  const totalPot = config.pricePerSquare * getTotalSquares(config.size);
  
  // Create squares with temporary IDs
  const squares = createEmptySquares('temp', config.size, config.pricePerSquare);
  
  return {
    name: `${config.homeTeam} vs ${config.awayTeam}`,
    config,
    rowNumbers: Array(rows).fill(null),
    colNumbers: Array(cols).fill(null),
    squares: squares.map(sq => ({ ...sq, id: generateId() })),
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy,
    payoutConfig: calculatePayouts(totalPot),
  };
}

/**
 * Get square by position
 */
export function getSquareByPosition(
  squares: Square[],
  row: number,
  col: number
): Square | undefined {
  return squares.find(sq => sq.row === row && sq.col === col);
}

/**
 * Get squares by owner
 */
export function getSquaresByOwner(squares: Square[], ownerId: string): Square[] {
  return squares.filter(sq => sq.ownerId === ownerId);
}

/**
 * Get available squares count
 */
export function getAvailableSquaresCount(squares: Square[]): number {
  return squares.filter(sq => sq.status === 'available').length;
}

/**
 * Get purchased squares count
 */
export function getPurchasedSquaresCount(squares: Square[]): number {
  return squares.filter(sq => sq.status === 'purchased').length;
}

/**
 * Calculate board completion percentage
 */
export function getBoardCompletionPercentage(squares: Square[]): number {
  const total = squares.length;
  const purchased = getPurchasedSquaresCount(squares);
  return Math.round((purchased / total) * 100);
}

/**
 * Check if board is ready to lock
 */
export function isBoardReadyToLock(squares: Square[]): boolean {
  return squares.every(sq => sq.status === 'purchased');
}

/**
 * Validate square purchase
 */
export function validateSquarePurchase(
  square: Square,
  maxSquaresPerUser: number = 10
): { valid: boolean; error?: string } {
  if (square.status === 'purchased') {
    return { valid: false, error: 'Square already purchased' };
  }
  if (square.status === 'reserved') {
    return { valid: false, error: 'Square is reserved' };
  }
  return { valid: true };
}

/**
 * Format board for display
 */
export function formatBoardForDisplay(board: Board): {
  grid: (Square | null)[][];
  rowLabels: (number | null)[];
  colLabels: (number | null)[];
} {
  const { rows, cols } = getGridDimensions(board.config.size);
  const grid: (Square | null)[][] = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(null));

  board.squares.forEach(square => {
    if (square.row >= 0 && square.row < rows && square.col >= 0 && square.col < cols) {
      grid[square.row][square.col] = square;
    }
  });

  return {
    grid,
    rowLabels: board.rowNumbers,
    colLabels: board.colNumbers,
  };
}

export default {
  getGridDimensions,
  getTotalSquares,
  calculatePayouts,
  createEmptySquares,
  createBoard,
  getSquareByPosition,
  getSquaresByOwner,
  getAvailableSquaresCount,
  getPurchasedSquaresCount,
  getBoardCompletionPercentage,
  isBoardReadyToLock,
  validateSquarePurchase,
  formatBoardForDisplay,
};