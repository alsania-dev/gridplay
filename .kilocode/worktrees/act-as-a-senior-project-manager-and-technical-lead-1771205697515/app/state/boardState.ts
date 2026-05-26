import { atom, selector, selectorFamily } from 'recoil';

// Board types
export type BoardSize = '5x5' | '10x10';
export type BoardType = 'standard' | 'shotgun';
export type BoardStatus = 'draft' | 'open' | 'locked' | 'completed';

export interface Square {
  id: string;
  boardId: string;
  row: number;
  col: number;
  rowNumber: number | null;
  colNumber: number | null;
  ownerId: string | null;
  ownerName?: string;
  status: 'available' | 'reserved' | 'purchased';
  price: number;
}

export interface Board {
  id: string;
  name: string;
  size: BoardSize;
  type: BoardType;
  status: BoardStatus;
  pricePerSquare: number;
  homeTeam: string;
  awayTeam: string;
  gameId?: string;
  rowNumbers: number[];
  colNumbers: number[];
  squares: Square[];
  payoutConfig: {
    firstQuarter: number;
    secondQuarter: number;
    thirdQuarter: number;
    final: number;
    total: number;
  };
  createdAt: string;
  createdBy: string;
}

// Current board state
export const currentBoardState = atom<Board | null>({
  key: 'currentBoardState',
  default: null,
});

// Board list state
export const boardListState = atom<Board[]>({
  key: 'boardListState',
  default: [],
});

// Selected squares for purchase
export const selectedSquaresState = atom<string[]>({
  key: 'selectedSquaresState',
  default: [],
});

// Board loading state
export const boardLoadingState = atom<boolean>({
  key: 'boardLoadingState',
  default: false,
});

// Board error state
export const boardErrorState = atom<string | null>({
  key: 'boardErrorState',
  default: null,
});

// Selectors
export const boardCompletionPercentageState = selector({
  key: 'boardCompletionPercentageState',
  get: ({ get }) => {
    const board = get(currentBoardState);
    if (!board) return 0;
    
    const purchased = board.squares.filter(s => s.status === 'purchased').length;
    return Math.round((purchased / board.squares.length) * 100);
  },
});

export const availableSquaresCountState = selector({
  key: 'availableSquaresCountState',
  get: ({ get }) => {
    const board = get(currentBoardState);
    if (!board) return 0;
    return board.squares.filter(s => s.status === 'available').length;
  },
});

export const purchasedSquaresCountState = selector({
  key: 'purchasedSquaresCountState',
  get: ({ get }) => {
    const board = get(currentBoardState);
    if (!board) return 0;
    return board.squares.filter(s => s.status === 'purchased').length;
  },
});

export const selectedSquaresTotalPriceState = selector({
  key: 'selectedSquaresTotalPriceState',
  get: ({ get }) => {
    const board = get(currentBoardState);
    const selectedIds = get(selectedSquaresState);
    if (!board) return 0;
    return selectedIds.length * board.pricePerSquare;
  },
});

// Selector family for getting square by position
export const squareByPositionState = selectorFamily({
  key: 'squareByPositionState',
  get: (params: { row: number; col: number }) => ({ get }) => {
    const board = get(currentBoardState);
    if (!board) return null;
    return board.squares.find(s => s.row === params.row && s.col === params.col) || null;
  },
});

// Selector family for getting squares by owner
export const squaresByOwnerState = selectorFamily({
  key: 'squaresByOwnerState',
  get: (ownerId: string) => ({ get }) => {
    const board = get(currentBoardState);
    if (!board) return [];
    return board.squares.filter(s => s.ownerId === ownerId);
  },
});

export default {
  currentBoardState,
  boardListState,
  selectedSquaresState,
  boardLoadingState,
  boardErrorState,
  boardCompletionPercentageState,
  availableSquaresCountState,
  purchasedSquaresCountState,
  selectedSquaresTotalPriceState,
  squareByPositionState,
  squaresByOwnerState,
};