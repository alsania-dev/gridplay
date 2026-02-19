/**
 * GridPlay GameBoard Component
 * 
 * Generic game board component for 5x5 and 10x10 grids.
 * Renders grid using GridCell components with row/column headers.
 */

import React, { useMemo } from 'react';
import { GridCell } from './GridCell';
import type { BoardCell, BoardState, GameMode } from '../types';
import { GRID_SIZES, THEME_COLORS } from '../lib/constants';

export interface GameBoardProps {
  /** Board state */
  board: BoardState;
  /** Game mode */
  mode: GameMode;
  /** Callback when a cell is clicked */
  onCellClick?: (row: number, col: number) => void;
  /** Whether cells are interactive */
  interactive?: boolean;
  /** Show score numbers in cells */
  showScores?: boolean;
  /** Currently selected cells */
  selectedCells?: Array<{ row: number; col: number }>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * GameBoard component for rendering 5x5 and 10x10 grids
 * 
 * @example
 * ```tsx
 * const board = useGameBoard({ mode: '10x10' });
 * 
 * <GameBoard
 *   board={board.boardState}
 *   mode="10x10"
 *   onCellClick={board.toggleCell}
 *   selectedCells={board.selectedCells}
 * />
 * ```
 */
export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  mode,
  onCellClick,
  interactive = true,
  showScores = true,
  selectedCells = [],
  className = '',
}) => {
  const gridSize = GRID_SIZES[mode];
  const { rows, cols } = gridSize;

  // Create a map of cells for quick lookup
  const cellMap = useMemo(() => {
    const map = new Map<string, BoardCell>();
    board.cells.forEach(cell => {
      map.set(`${cell.row}-${cell.col}`, cell);
    });
    return map;
  }, [board.cells]);

  // Create a set of selected cell keys for quick lookup
  const selectedSet = useMemo(() => {
    return new Set(selectedCells.map(c => `${c.row}-${c.col}`));
  }, [selectedCells]);

  // Get cell at position
  const getCell = (row: number, col: number): BoardCell => {
    return cellMap.get(`${row}-${col}`) || {
      row,
      col,
      owner: null,
      homeScore: null,
      awayScore: null,
      isWinner: false,
    };
  };

  // Check if cell is selected
  const isCellSelected = (row: number, col: number): boolean => {
    return selectedSet.has(`${row}-${col}`);
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (onCellClick && interactive) {
      onCellClick(row, col);
    }
  };

  // Generate grid template columns based on mode
  const gridTemplateColumns = useMemo(() => {
    // +1 for row headers
    return `auto repeat(${cols}, 1fr)`;
  }, [cols]);

  return (
    <div className={`game-board ${className}`}>
      {/* Team Names Header */}
      <div className="flex justify-center items-center mb-4">
        <div 
          className="text-lg font-bold px-4"
          style={{ color: THEME_COLORS.PRIMARY }}
        >
          {board.config.awayTeam?.name || 'Away'}
        </div>
        <div className="mx-4 text-[#9CA3AF]">@</div>
        <div 
          className="text-lg font-bold px-4"
          style={{ color: THEME_COLORS.PRIMARY }}
        >
          {board.config.homeTeam?.name || 'Home'}
        </div>
      </div>

      {/* Grid Container */}
      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns,
          maxWidth: mode === '10x10' ? '600px' : '400px',
          margin: '0 auto',
        }}
      >
        {/* Top Left Corner (V/H label) */}
        <div 
          className="aspect-square flex items-center justify-center text-xs font-bold"
          style={{ 
            color: THEME_COLORS.TEXT_MUTED,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          V/H
        </div>

        {/* Column Headers (Home Team Scores) */}
        {board.colScores.length > 0 ? (
          board.colScores.slice(0, cols).map((score, col) => (
            <div
              key={`col-${col}`}
              className="aspect-square flex items-center justify-center text-sm font-bold"
              style={{ 
                color: THEME_COLORS.TEXT_MUTED,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              {score}
            </div>
          ))
        ) : (
          // Placeholder headers when scores not generated
          Array.from({ length: cols }).map((_, col) => (
            <div
              key={`col-${col}`}
              className="aspect-square flex items-center justify-center text-sm font-bold"
              style={{ 
                color: THEME_COLORS.TEXT_MUTED,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              ?
            </div>
          ))
        )}

        {/* Grid Rows */}
        {Array.from({ length: rows }).map((_, row) => (
          <React.Fragment key={`row-${row}`}>
            {/* Row Header (Away Team Score) */}
            <div
              className="aspect-square flex items-center justify-center text-sm font-bold"
              style={{ 
                color: THEME_COLORS.TEXT_MUTED,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              {board.rowScores.length > 0 ? board.rowScores[row] : '?'}
            </div>

            {/* Cells */}
            {Array.from({ length: cols }).map((_, col) => {
              const cell = getCell(row, col);
              const isSelected = isCellSelected(row, col);
              const isOwned = cell.owner !== null;

              return (
                <div
                  key={`cell-${row}-${col}`}
                  className={`
                    relative aspect-square border rounded transition-all duration-150
                    ${isSelected && !isOwned ? 'ring-2 ring-[#10B981] ring-offset-1 ring-offset-[#0A0A0A]' : ''}
                  `}
                  style={{
                    backgroundColor: cell.isWinner 
                      ? THEME_COLORS.ACCENT 
                      : isSelected && !isOwned
                        ? 'rgba(16, 185, 129, 0.3)'
                        : isOwned 
                          ? THEME_COLORS.SECONDARY 
                          : 'rgba(255, 255, 255, 0.05)',
                    borderColor: cell.isWinner 
                      ? THEME_COLORS.ACCENT 
                      : isSelected || isOwned
                        ? THEME_COLORS.PRIMARY 
                        : 'rgba(55, 65, 81, 0.5)',
                    cursor: interactive && !isOwned ? 'pointer' : 'default',
                  }}
                  onClick={() => handleCellClick(row, col)}
                  role={interactive && !isOwned ? 'button' : undefined}
                  tabIndex={interactive && !isOwned ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCellClick(row, col);
                    }
                  }}
                  aria-label={
                    isOwned 
                      ? `Cell row ${row + 1}, column ${col + 1} - Owned by ${cell.owner?.displayName}`
                      : isSelected
                        ? `Cell row ${row + 1}, column ${col + 1} - Selected`
                        : `Cell row ${row + 1}, column ${col + 1} - Available`
                  }
                >
                  {/* Cell Content */}
                  {cell.isWinner && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg">🏆</span>
                    </div>
                  )}

                  {isOwned && !cell.isWinner && (
                    <div className="absolute inset-0 flex items-center justify-center p-1">
                      <span 
                        className="text-xs text-white text-center truncate w-full"
                        title={cell.owner?.displayName}
                      >
                        {cell.owner?.displayName?.slice(0, 6)}
                      </span>
                    </div>
                  )}

                  {!isOwned && !isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[#9CA3AF] text-lg">+</span>
                    </div>
                  )}

                  {isSelected && !isOwned && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[#10B981] text-lg font-bold">✓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-xs text-[#9CA3AF]">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(55, 65, 81, 0.5)' }}
          />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: THEME_COLORS.SECONDARY, borderColor: THEME_COLORS.PRIMARY }}
          />
          <span>Claimed</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: THEME_COLORS.ACCENT, borderColor: THEME_COLORS.ACCENT }}
          />
          <span>Winner</span>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;