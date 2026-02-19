/**
 * GridPlay ShotgunBoard Component
 * 
 * Shotgun-style game board with linear progression.
 * Features timer functionality and winner calculation.
 */

import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { useTimer } from '../hooks/useTimer';
import type { BoardCell, CellOwner } from '../types';
import { THEME_COLORS } from '../lib/constants';

export interface ShotgunBoardProps {
  /** Board ID */
  boardId?: string;
  /** Home team name */
  homeTeam?: string;
  /** Away team name */
  awayTeam?: string;
  /** Game start time (timestamp in milliseconds) */
  startTime?: number;
  /** Initial cells with owners */
  initialCells?: Map<number, CellOwner>;
  /** Callback when a cell is claimed */
  onCellClaim?: (index: number) => void | Promise<void>;
  /** Callback when game starts */
  onGameStart?: () => void | Promise<void>;
  /** Callback when lock in is clicked */
  onLockIn?: () => void | Promise<void>;
  /** Current user ID */
  userId?: string;
  /** Current user display name */
  displayName?: string;
  /** Whether the board is in demo mode */
  demoMode?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// Payout structure for shotgun game
const SHOTGUN_PAYOUTS = {
  halftime: 0.4,
  final: 0.6,
};

/**
 * ShotgunBoard component for linear progression game
 * 
 * @example
 * ```tsx
 * <ShotgunBoard
 *   homeTeam="Chiefs"
 *   awayTeam="49ers"
 *   startTime={Date.now() + 600000}
 *   onCellClaim={(index) => console.log('Claimed:', index)}
 * />
 * ```
 */
export const ShotgunBoard: React.FC<ShotgunBoardProps> = ({
  boardId,
  homeTeam = 'Home',
  awayTeam = 'Away',
  startTime,
  initialCells,
  onCellClaim,
  onGameStart,
  onLockIn,
  userId,
  displayName,
  demoMode = false,
  className = '',
}) => {
  // Cell state - 20 cells (2 rows of 10)
  const [cells, setCells] = useState<Map<number, CellOwner>>(initialCells || new Map());
  const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set());
  const [gameStarted, setGameStarted] = useState(false);
  const [winners, setWinners] = useState<{ halftime: number | null; final: number | null }>({
    halftime: null,
    final: null,
  });
  const [isLocked, setIsLocked] = useState(false);

  // Timer for game start
  const timer = useTimer({
    initialTime: startTime ? Math.max(0, Math.floor((startTime - Date.now()) / 1000)) : 600,
    onEnd: () => {
      setGameStarted(true);
      if (onGameStart) {
        onGameStart();
      }
    },
    autoStart: !!startTime,
  });

  // Check if user can claim cells
  const canClaim = useMemo(() => {
    return !isLocked && !gameStarted && userId && displayName;
  }, [isLocked, gameStarted, userId, displayName]);

  // Handle cell click
  const handleCellClick = (index: number) => {
    if (isLocked || gameStarted) return;
    if (cells.has(index)) return; // Already claimed

    if (selectedCells.has(index)) {
      // Deselect
      setSelectedCells(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    } else {
      // Select
      setSelectedCells(prev => new Set(prev).add(index));
    }
  };

  // Claim selected cells
  const claimSelectedCells = async () => {
    if (!canClaim || selectedCells.size === 0) return;

    const newCells = new Map(cells);
    const now = new Date().toISOString();

    selectedCells.forEach(index => {
      newCells.set(index, {
        userId: userId!,
        displayName: displayName!,
        claimedAt: now,
      });
    });

    setCells(newCells);

    // Call callbacks
    if (onCellClaim) {
      for (const index of selectedCells) {
        await onCellClaim(index);
      }
    }

    setSelectedCells(new Set());
  };

  // Lock in selections
  const handleLockIn = async () => {
    if (selectedCells.size === 0) {
      alert('Please select at least one cell to play!');
      return;
    }

    if (!timer.hasEnded && !demoMode) {
      alert('The game has not started yet!');
      return;
    }

    // Claim cells first
    await claimSelectedCells();

    // Lock the board
    setIsLocked(true);

    // Generate random winners
    const halftimeWinner = Math.floor(Math.random() * 10);
    const finalWinner = Math.floor(Math.random() * 10) + 10;

    setWinners({
      halftime: halftimeWinner,
      final: finalWinner,
    });

    if (onLockIn) {
      await onLockIn();
    }
  };

  // Check if user won
  const userWon = useMemo(() => {
    if (winners.halftime === null || winners.final === null) return false;
    
    const userCells = Array.from(cells.entries())
      .filter(([_, owner]) => owner.userId === userId)
      .map(([index]) => index);

    return userCells.includes(winners.halftime) || userCells.includes(winners.final);
  }, [cells, winners, userId]);

  // Generate random numbers for display
  const randomNumbers = useMemo(() => {
    const nums: number[] = [];
    for (let i = 0; i < 20; i++) {
      nums.push(Math.floor(Math.random() * 10));
    }
    return nums;
  }, []);

  return (
    <div className={`shotgun-board ${className}`}>
      {/* Header with scores */}
      <div className="flex justify-center items-center gap-4 mb-6">
        <div 
          className="w-24 h-12 flex items-center justify-center rounded border"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: `${THEME_COLORS.PRIMARY}40`,
            color: THEME_COLORS.TEXT,
          }}
        >
          <span className="text-xl font-bold">0</span>
        </div>
        <h1 
          className="text-2xl md:text-3xl font-bold"
          style={{ color: THEME_COLORS.PRIMARY }}
        >
          Shotgun Board
        </h1>
        <div 
          className="w-24 h-12 flex items-center justify-center rounded border"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: `${THEME_COLORS.PRIMARY}40`,
            color: THEME_COLORS.TEXT,
          }}
        >
          <span className="text-xl font-bold">0</span>
        </div>
      </div>

      {/* Timer */}
      <div className="text-center mb-6">
        {!timer.hasEnded ? (
          <div className="text-lg">
            <span className="text-[#9CA3AF]">Game starts in: </span>
            <span 
              className="font-bold text-xl"
              style={{ color: THEME_COLORS.PRIMARY }}
            >
              {timer.formatted}
            </span>
          </div>
        ) : (
          <div 
            className="text-lg font-bold"
            style={{ color: THEME_COLORS.PRIMARY }}
          >
            🎮 Game Started!
          </div>
        )}
      </div>

      {/* Team names */}
      <div className="text-center mb-8">
        <span className="text-xl font-bold text-white">
          {awayTeam} @ {homeTeam}
        </span>
      </div>

      {/* Board - 2 rows of 10 */}
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Halftime Row */}
        <div>
          <div 
            className="text-sm font-bold mb-2 text-center"
            style={{ color: THEME_COLORS.TEXT_MUTED }}
          >
            Halftime
          </div>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }).map((_, i) => {
              const index = i;
              const owner = cells.get(index);
              const isSelected = selectedCells.has(index);
              const isWinner = winners.halftime === index;

              return (
                <div key={`halftime-${i}`} className="flex flex-col items-center">
                  {/* Random number display */}
                  <div 
                    className="w-full aspect-square flex items-center justify-center text-xs font-bold mb-1 rounded"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: THEME_COLORS.TEXT_MUTED,
                    }}
                  >
                    {randomNumbers[i]}
                  </div>
                  
                  {/* Cell */}
                  <div
                    className={`
                      w-full aspect-square flex flex-col items-center justify-center 
                      border rounded transition-all duration-150 cursor-pointer
                      ${isWinner ? 'animate-pulse' : ''}
                    `}
                    style={{
                      backgroundColor: isWinner 
                        ? THEME_COLORS.ACCENT 
                        : isSelected 
                          ? 'rgba(16, 185, 129, 0.3)'
                          : owner 
                            ? THEME_COLORS.SECONDARY 
                            : 'rgba(255, 255, 255, 0.05)',
                      borderColor: isWinner 
                        ? THEME_COLORS.ACCENT 
                        : isSelected || owner
                          ? THEME_COLORS.PRIMARY 
                          : 'rgba(55, 65, 81, 0.5)',
                    }}
                    onClick={() => handleCellClick(index)}
                  >
                    {isWinner && <span className="text-lg">🏆</span>}
                    {owner && !isWinner && (
                      <span 
                        className="text-xs text-white text-center truncate w-full px-1"
                        title={owner.displayName}
                      >
                        {owner.displayName.slice(0, 4)}
                      </span>
                    )}
                    {!owner && isSelected && (
                      <span className="text-[#10B981] font-bold">✓</span>
                    )}
                    {!owner && !isSelected && (
                      <span className="text-[#9CA3AF]">+</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Final Row */}
        <div>
          <div 
            className="text-sm font-bold mb-2 text-center"
            style={{ color: THEME_COLORS.TEXT_MUTED }}
          >
            Final
          </div>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }).map((_, i) => {
              const index = i + 10; // Offset for final row
              const owner = cells.get(index);
              const isSelected = selectedCells.has(index);
              const isWinner = winners.final === index;

              return (
                <div key={`final-${i}`} className="flex flex-col items-center">
                  {/* Random number display */}
                  <div 
                    className="w-full aspect-square flex items-center justify-center text-xs font-bold mb-1 rounded"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: THEME_COLORS.TEXT_MUTED,
                    }}
                  >
                    {randomNumbers[i + 10]}
                  </div>
                  
                  {/* Cell */}
                  <div
                    className={`
                      w-full aspect-square flex flex-col items-center justify-center 
                      border rounded transition-all duration-150 cursor-pointer
                      ${isWinner ? 'animate-pulse' : ''}
                    `}
                    style={{
                      backgroundColor: isWinner 
                        ? THEME_COLORS.ACCENT 
                        : isSelected 
                          ? 'rgba(16, 185, 129, 0.3)'
                          : owner 
                            ? THEME_COLORS.SECONDARY 
                            : 'rgba(255, 255, 255, 0.05)',
                      borderColor: isWinner 
                        ? THEME_COLORS.ACCENT 
                        : isSelected || owner
                          ? THEME_COLORS.PRIMARY 
                          : 'rgba(55, 65, 81, 0.5)',
                    }}
                    onClick={() => handleCellClick(index)}
                  >
                    {isWinner && <span className="text-lg">🏆</span>}
                    {owner && !isWinner && (
                      <span 
                        className="text-xs text-white text-center truncate w-full px-1"
                        title={owner.displayName}
                      >
                        {owner.displayName.slice(0, 4)}
                      </span>
                    )}
                    {!owner && isSelected && (
                      <span className="text-[#10B981] font-bold">✓</span>
                    )}
                    {!owner && !isSelected && (
                      <span className="text-[#9CA3AF]">+</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lock In Button */}
      {!isLocked && (
        <div className="mt-8 text-center">
          <Button
            size="lg"
            variant="primary"
            onClick={handleLockIn}
            disabled={selectedCells.size === 0 || (!timer.hasEnded && !demoMode)}
          >
            Lock In ({selectedCells.size} selected)
          </Button>
        </div>
      )}

      {/* Results */}
      {isLocked && (
        <div className="mt-8 text-center">
          <div className="p-4 rounded-lg bg-[#1A1A1A] border border-[#374151]">
            <h3 className="text-lg font-bold text-white mb-4">Results</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-center gap-4">
                <span className="text-[#9CA3AF]">Halftime Winner:</span>
                <span className="text-white font-bold">
                  Cell #{(winners.halftime || 0) + 1} (Top Row)
                </span>
              </div>
              <div className="flex justify-center gap-4">
                <span className="text-[#9CA3AF]">Final Winner:</span>
                <span className="text-white font-bold">
                  Cell #{(winners.final || 0) - 9} (Bottom Row)
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#374151]">
              {userWon ? (
                <div 
                  className="text-lg font-bold"
                  style={{ color: THEME_COLORS.PRIMARY }}
                >
                  🎉 Congratulations! You won!
                </div>
              ) : (
                <div className="text-[#9CA3AF]">
                  Better luck next time!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6 text-xs text-[#9CA3AF]">
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

export default ShotgunBoard;