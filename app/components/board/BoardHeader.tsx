import React from 'react';

export interface BoardHeaderProps {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  quarter?: string;
  timeRemaining?: string;
  className?: string;
}

export function BoardHeader({
  homeTeam,
  awayTeam,
  homeScore = 0,
  awayScore = 0,
  quarter = 'Q1',
  timeRemaining,
  className = '',
}: BoardHeaderProps) {
  return (
    <div className={`bg-navy-800 rounded-xl p-4 ${className}`}>
      {/* Game Status Bar */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="px-3 py-1 bg-primary-500/20 text-primary-500 text-sm font-semibold rounded-full">
          {quarter}
        </span>
        {timeRemaining && (
          <span className="text-sm text-gray-400">
            {timeRemaining}
          </span>
        )}
      </div>

      {/* Teams and Scores */}
      <div className="flex items-center justify-between gap-4">
        {/* Away Team */}
        <div className="flex-1 text-center">
          <h3 className="text-lg sm:text-xl font-bold text-white truncate">
            {awayTeam}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Away</p>
        </div>

        {/* Score Display */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-14 sm:w-16 sm:h-18 flex items-center justify-center bg-navy-900 rounded-lg border border-navy-700">
            <span className="text-2xl sm:text-3xl font-bold text-white">
              {awayScore}
            </span>
          </div>
          
          <span className="text-gray-500 text-xl font-light">vs</span>
          
          <div className="w-12 h-14 sm:w-16 sm:h-18 flex items-center justify-center bg-navy-900 rounded-lg border border-navy-700">
            <span className="text-2xl sm:text-3xl font-bold text-white">
              {homeScore}
            </span>
          </div>
        </div>

        {/* Home Team */}
        <div className="flex-1 text-center">
          <h3 className="text-lg sm:text-xl font-bold text-white truncate">
            {homeTeam}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Home</p>
        </div>
      </div>
    </div>
  );
}

export default BoardHeader;
