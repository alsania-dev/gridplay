import React from 'react';

export interface SquareProps {
  row: number;
  col: number;
  owner?: string;
  ownerColor?: string;
  isWinner?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function Square({
  row,
  col,
  owner,
  ownerColor,
  isWinner = false,
  isHighlighted = false,
  onClick,
  disabled = false,
}: SquareProps) {
  const baseStyles = `
    aspect-square
    flex items-center justify-center
    text-xs sm:text-sm font-medium
    border border-border/50
    transition-all duration-200
    cursor-pointer
  `;

  const stateStyles = isWinner
    ? 'bg-primary-500/30 border-primary-500 shadow-glow animate-pulse-glow'
    : isHighlighted
    ? 'bg-primary-500/10 border-primary-500/50'
    : owner
    ? 'hover:bg-white/5'
    : 'bg-surface/50 hover:bg-primary-500/5 hover:border-primary-500/30';

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <div
      className={`${baseStyles} ${stateStyles} ${disabledStyles}`}
      onClick={disabled ? undefined : onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={
        onClick && !disabled
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={`Square ${row}-${col}${owner ? `, owned by ${owner}` : ', available'}`}
      style={ownerColor ? { backgroundColor: `${ownerColor}20` } : undefined}
    >
      <div className="text-center px-1">
        {owner ? (
          <span
            className="block truncate max-w-full"
            style={ownerColor ? { color: ownerColor } : undefined}
          >
            {owner}
          </span>
        ) : (
          <span className="text-muted/50">-</span>
        )}
      </div>
    </div>
  );
}

export default Square;
