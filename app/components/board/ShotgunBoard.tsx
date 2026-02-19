import React from 'react';

export interface ShotgunSquare {
  id: string;
  number: number;
  owner?: string;
  ownerColor?: string;
  isWinner?: boolean;
}

export interface ShotgunBoardProps {
  row1Squares?: ShotgunSquare[];
  row2Squares?: ShotgunSquare[];
  row1Label?: string;
  row2Label?: string;
  onSquareClick?: (squareId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ShotgunBoard({
  row1Squares = [],
  row2Squares = [],
  row1Label = 'Row 1',
  row2Label = 'Row 2',
  onSquareClick,
  disabled = false,
  className = '',
}: ShotgunBoardProps) {
  // Generate default squares if none provided
  const defaultRow1: ShotgunSquare[] = Array.from({ length: 10 }, (_, i) => ({
    id: `row1-${i}`,
    number: i,
  }));
  const defaultRow2: ShotgunSquare[] = Array.from({ length: 10 }, (_, i) => ({
    id: `row2-${i}`,
    number: i,
  }));

  const squares1 = row1Squares.length > 0 ? row1Squares : defaultRow1;
  const squares2 = row2Squares.length > 0 ? row2Squares : defaultRow2;

  const renderSquare = (square: ShotgunSquare) => {
    const baseStyles = `
      flex-1 aspect-square
      flex flex-col items-center justify-center
      rounded-lg border
      transition-all duration-200
      min-w-[40px] max-w-[80px]
    `;

    const stateStyles = square.isWinner
      ? 'bg-primary-500/30 border-primary-500 shadow-glow animate-pulse-glow'
      : square.owner
      ? 'bg-navy-700/50 border-navy-600 hover:bg-navy-700'
      : 'bg-surface/50 border-border hover:bg-primary-500/5 hover:border-primary-500/30';

    const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    return (
      <div
        key={square.id}
        className={`${baseStyles} ${stateStyles} ${disabledStyles}`}
        onClick={disabled || !onSquareClick ? undefined : () => onSquareClick(square.id)}
        role={onSquareClick ? 'button' : undefined}
        tabIndex={onSquareClick && !disabled ? 0 : undefined}
        onKeyDown={
          onSquareClick && !disabled
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSquareClick(square.id);
                }
              }
            : undefined
        }
        aria-label={`Square ${square.number}${square.owner ? `, owned by ${square.owner}` : ', available'}`}
        style={square.ownerColor ? { backgroundColor: `${square.ownerColor}20` } : undefined}
      >
        <span className="text-lg sm:text-xl font-bold text-white">
          {square.number}
        </span>
        {square.owner && (
          <span
            className="text-xs truncate max-w-full mt-1"
            style={square.ownerColor ? { color: square.ownerColor } : undefined}
          >
            {square.owner}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col gap-8 ${className}`}>
      {/* Row 1 */}
      <div>
        <div className="text-center mb-3">
          <span className="text-sm font-semibold text-primary-500">{row1Label}</span>
        </div>
        <div className="flex gap-2 justify-center">
          {squares1.map(renderSquare)}
        </div>
      </div>

      {/* Row 2 */}
      <div>
        <div className="text-center mb-3">
          <span className="text-sm font-semibold text-primary-500">{row2Label}</span>
        </div>
        <div className="flex gap-2 justify-center">
          {squares2.map(renderSquare)}
        </div>
      </div>
    </div>
  );
}

export default ShotgunBoard;
