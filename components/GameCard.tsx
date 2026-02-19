/**
 * GridPlay GameCard Component
 * 
 * Card component for displaying game boards in listings.
 * Shows game type, entry fee, prize pool, and team information.
 */

import React from 'react';
import { BoardListItem, BoardStatus } from '../types';
import { GAME_MODES } from '../lib/constants';
import Button from './Button';

export interface GameCardProps {
  /** Board data to display */
  board: BoardListItem;
  /** Callback when card is clicked */
  onClick?: (boardId: string) => void;
  /** Callback when join button is clicked */
  onJoin?: (boardId: string) => void;
  /** Show quick join button */
  showJoinButton?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const statusConfig: Record<BoardStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-[#9CA3AF]', bgColor: 'bg-[#374151]' },
  open: { label: 'Open', color: 'text-[#22C55E]', bgColor: 'bg-[#166534]' },
  locked: { label: 'Locked', color: 'text-[#F59E0B]', bgColor: 'bg-[#92400E]' },
  in_progress: { label: 'Live', color: 'text-[#EF4444]', bgColor: 'bg-[#991B1B]' },
  completed: { label: 'Completed', color: 'text-[#3B82F6]', bgColor: 'bg-[#1E40AF]' },
  cancelled: { label: 'Cancelled', color: 'text-[#9CA3AF]', bgColor: 'bg-[#374151]' },
};

const modeLabels: Record<string, string> = {
  [GAME_MODES.SHOTGUN]: 'Shotgun (1×25)',
  [GAME_MODES.FIVE_BY_FIVE]: 'Classic (5×5)',
  [GAME_MODES.TEN_BY_TEN]: 'Standard (10×10)',
};

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

export const GameCard: React.FC<GameCardProps> = ({
  board,
  onClick,
  onJoin,
  showJoinButton = true,
  className = '',
}) => {
  const status = statusConfig[board.status];
  const isJoinable = board.status === 'open' && board.availableCells > 0;
  const totalPrize = board.pricePerCell * (board.totalCells - board.availableCells);

  const handleClick = () => {
    if (onClick) {
      onClick(board.id);
    }
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoin) {
      onJoin(board.id);
    }
  };

  const baseStyles = [
    'bg-[#1A1A1A]',
    'border',
    'border-[#374151]',
    'rounded-lg',
    'overflow-hidden',
    'transition-all',
    'duration-200',
    'hover:border-[#10B981]',
    'hover:shadow-lg',
    'hover:shadow-[#10B981]/10',
  ].join(' ');

  return (
    <article
      className={`${baseStyles} ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${board.name} - ${board.homeTeam.name} vs ${board.awayTeam.name}`}
    >
      {/* Header with status */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#374151]">
        <h3 className="text-white font-semibold text-sm truncate flex-1 mr-2">
          {board.name}
        </h3>
        <span
          className={`${status.color} ${status.bgColor} px-2 py-0.5 rounded text-xs font-medium`}
        >
          {status.label}
        </span>
      </div>

      {/* Teams */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {board.homeTeam.logo ? (
              <img
                src={board.homeTeam.logo}
                alt={board.homeTeam.name}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 bg-[#2A2A2A] rounded flex items-center justify-center text-[#9CA3AF] text-xs font-bold">
                {board.homeTeam.abbreviation}
              </div>
            )}
            <span className="text-white text-sm font-medium">
              {board.homeTeam.abbreviation}
            </span>
          </div>
          
          <span className="text-[#9CA3AF] text-xs">VS</span>
          
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">
              {board.awayTeam.abbreviation}
            </span>
            {board.awayTeam.logo ? (
              <img
                src={board.awayTeam.logo}
                alt={board.awayTeam.name}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 bg-[#2A2A2A] rounded flex items-center justify-center text-[#9CA3AF] text-xs font-bold">
                {board.awayTeam.abbreviation}
              </div>
            )}
          </div>
        </div>

        {/* Game info grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#0A0A0A] rounded p-2">
            <p className="text-[#9CA3AF] text-[10px] uppercase tracking-wide mb-1">Mode</p>
            <p className="text-white text-xs font-medium">
              {modeLabels[board.mode] || board.mode}
            </p>
          </div>
          
          <div className="bg-[#0A0A0A] rounded p-2">
            <p className="text-[#9CA3AF] text-[10px] uppercase tracking-wide mb-1">Entry</p>
            <p className="text-[#10B981] text-xs font-bold">
              {formatCurrency(board.pricePerCell)}
            </p>
          </div>
          
          <div className="bg-[#0A0A0A] rounded p-2">
            <p className="text-[#9CA3AF] text-[10px] uppercase tracking-wide mb-1">Prize Pool</p>
            <p className="text-[#F59E0B] text-xs font-bold">
              {formatCurrency(totalPrize)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer with availability */}
      <div className="px-4 py-3 border-t border-[#374151] bg-[#0A0A0A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-[#374151] rounded-full overflow-hidden w-24">
              <div
                className="h-full bg-[#10B981] transition-all duration-300"
                style={{
                  width: `${((board.totalCells - board.availableCells) / board.totalCells) * 100}%`,
                }}
              />
            </div>
            <span className="text-[#9CA3AF] text-xs">
              {board.totalCells - board.availableCells}/{board.totalCells}
            </span>
          </div>
          
          {showJoinButton && (
            <Button
              variant={isJoinable ? 'primary' : 'ghost'}
              size="sm"
              onClick={handleJoin}
              disabled={!isJoinable}
            >
              {isJoinable ? 'Join' : 'Full'}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

export default GameCard;
