import React from 'react';
import { Square } from './Square';

export interface GridSquare {
  row: number;
  col: number;
  owner?: string;
  ownerColor?: string;
  isWinner?: boolean;
}

export interface BoardGridProps {
  size?: 5 | 10;
  squares?: GridSquare[];
  rowNumbers?: number[];
  colNumbers?: number[];
  homeTeam?: string;
  awayTeam?: string;
  onSquareClick?: (row: number, col: number) => void;
  disabled?: boolean;
  className?: string;
}

export function BoardGrid({
  size = 10,
  squares = [],
  rowNumbers = [],
  colNumbers = [],
  homeTeam = 'Home',
  awayTeam = 'Away',
  onSquareClick,
  disabled = false,
  className = '',
}: BoardGridProps) {
  // Generate default numbers if not provided
  const defaultNumbers = Array.from({ length: size }, (_, i) => i);
  const rowNums = rowNumbers.length === size ? rowNumbers : defaultNumbers;
  const colNums = colNumbers.length === size ? colNumbers : defaultNumbers;

  // Find a square by position
  const getSquare = (row: number, col: number): GridSquare | undefined => {
    return squares.find((s) => s.row === row && s.col === col);
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="inline-block min-w-full">
        {/* Column Team Label */}
        <div className="flex mb-2">
          <div className="w-8 sm:w-10" /> {/* Empty corner */}
          <div className="flex-1 text-center">
            <span className="text-sm sm:text-base font-semibold text-primary-500">
              {awayTeam}
            </span>
          </div>
        </div>

        {/* Column Numbers Row */}
        <div className="flex mb-1">
          <div className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center" /> {/* Empty corner */}
          {colNums.map((num, idx) => (
            <div
              key={`col-${idx}`}
              className="flex-1 h-8 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold text-white bg-navy-800 border border-navy-700"
            >
              {num}
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="flex">
          {/* Row Numbers Column */}
          <div className="flex flex-col">
            {/* Row Team Label */}
            <div className="flex items-center justify-center w-8 sm:w-10 mb-1">
              <span
                className="text-sm sm:text-base font-semibold text-primary-500"
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                }}
              >
                {homeTeam}
              </span>
            </div>
            {rowNums.map((num, idx) => (
              <div
                key={`row-${idx}`}
                className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold text-white bg-navy-800 border border-navy-700"
              >
                {num}
              </div>
            ))}
          </div>

          {/* Grid Squares */}
          <div
            className="grid gap-0.5 bg-border/20 p-0.5 rounded-br-lg"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: size * size }).map((_, idx) => {
              const row = Math.floor(idx / size);
              const col = idx % size;
              const square = getSquare(row, col);

              return (
                <Square
                  key={`square-${row}-${col}`}
                  row={row}
                  col={col}
                  owner={square?.owner}
                  ownerColor={square?.ownerColor}
                  isWinner={square?.isWinner}
                  onClick={
                    onSquareClick ? () => onSquareClick(row, col) : undefined
                  }
                  disabled={disabled}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoardGrid;
