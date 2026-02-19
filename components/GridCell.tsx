/**
 * GridPlay GridCell Component
 * 
 * Individual cell for the game grid displaying number, owner, and status.
 * Supports visual states: available, claimed, winner.
 */

import React from 'react';
import { BoardCell } from '../types';

export type CellStatus = 'available' | 'claimed' | 'winner';

export interface GridCellProps {
  /** Cell data from board state */
  cell: BoardCell;
  /** Callback when cell is clicked */
  onClick?: (row: number, col: number) => void;
  /** Whether the cell is interactive */
  interactive?: boolean;
  /** Show score numbers */
  showScores?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const statusStyles: Record<CellStatus, string> = {
  available: [
    'bg-[#1A1A1A]',
    'border-[#374151]',
    'cursor-pointer',
    'hover:bg-[#2A2A2A]',
    'hover:border-[#10B981]',
    'hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
  ].join(' '),
  claimed: [
    'bg-[#1E3A5A]',
    'border-[#2D4A6A]',
    'cursor-default',
  ].join(' '),
  winner: [
    'bg-gradient-to-br from-[#10B981] to-[#F59E0B]',
    'border-[#10B981]',
    'cursor-default',
    'animate-[winner-pulse_1s_ease-in-out_infinite]',
  ].join(' '),
};

export const GridCell: React.FC<GridCellProps> = ({
  cell,
  onClick,
  interactive = true,
  showScores = true,
  className = '',
}) => {
  const getCellStatus = (): CellStatus => {
    if (cell.isWinner) return 'winner';
    if (cell.owner) return 'claimed';
    return 'available';
  };

  const status = getCellStatus();
  const isClickable = interactive && status === 'available' && onClick;

  const handleClick = () => {
    if (isClickable && onClick) {
      onClick(cell.row, cell.col);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const baseStyles = [
    'relative',
    'flex',
    'flex-col',
    'items-center',
    'justify-center',
    'aspect-square',
    'border',
    'rounded-md',
    'transition-all',
    'duration-150',
    'overflow-hidden',
    'font-bold',
  ].join(' ');

  const combinedClassName = [
    baseStyles,
    statusStyles[status],
    className,
  ].join(' ').trim();

  return (
    <div
      role={isClickable ? 'button' : 'gridcell'}
      tabIndex={isClickable ? 0 : undefined}
      className={combinedClassName}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={
        status === 'available'
          ? `Cell row ${cell.row + 1}, column ${cell.col + 1} - Available`
          : status === 'winner'
          ? `Cell row ${cell.row + 1}, column ${cell.col + 1} - Winner: ${cell.owner?.displayName}`
          : `Cell row ${cell.row + 1}, column ${cell.col + 1} - Owned by ${cell.owner?.displayName}`
      }
      aria-disabled={status !== 'available'}
    >
      {/* Score numbers (home/away) */}
      {showScores && (
        <div className="absolute top-0.5 left-0.5 text-[10px] text-[#9CA3AF] font-mono">
          {cell.homeScore !== null ? cell.homeScore : '?'}
        </div>
      )}

      {/* Cell content based on status */}
      {status === 'available' && (
        <span className="text-[#9CA3AF] text-lg">+</span>
      )}

      {status === 'claimed' && cell.owner && (
        <div className="flex flex-col items-center justify-center p-1">
          <span className="text-white text-xs truncate max-w-full">
            {cell.owner.displayName.slice(0, 8)}
          </span>
          {showScores && (
            <span className="text-[#9CA3AF] text-[10px] font-mono mt-0.5">
              {cell.homeScore}-{cell.awayScore}
            </span>
          )}
        </div>
      )}

      {status === 'winner' && cell.owner && (
        <div className="flex flex-col items-center justify-center p-1">
          <span className="text-gray-900 text-xs font-bold truncate max-w-full">
            {cell.owner.displayName.slice(0, 8)}
          </span>
          <span className="text-gray-900 text-[10px] font-mono mt-0.5">
            🏆 WINNER
          </span>
        </div>
      )}
    </div>
  );
};

export default GridCell;
