/**
 * Payout Calculator for GridPlay
 * Calculates winners based on game scores
 */

import { Square, PayoutConfig } from './boardUtils';

export interface GameScore {
  homeScore: number;
  awayScore: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'OT' | 'FINAL';
}

export interface Winner {
  square: Square;
  quarter: string;
  payout: number;
  winningNumbers: {
    row: number;
    col: number;
  };
  score: GameScore;
}

export interface PayoutResult {
  winners: Winner[];
  totalPayout: number;
  remainingPot: number;
}

/**
 * Get the last digit of a score (0-9)
 */
export function getLastDigit(score: number): number {
  return Math.abs(score) % 10;
}

/**
 * Get the last digit for 5x5 board (0-4)
 * Maps 0-9 to 0-4 by taking modulo 5
 */
export function getLastDigitFor5x5(score: number): number {
  return Math.abs(score) % 5;
}

/**
 * Find winning square based on scores
 */
export function findWinningSquare(
  squares: Square[],
  rowNumbers: number[],
  colNumbers: number[],
  homeScore: number,
  awayScore: number,
  boardSize: '5x5' | '10x10'
): Square | null {
  const rowDigit = boardSize === '5x5' 
    ? getLastDigitFor5x5(homeScore)
    : getLastDigit(homeScore);
  const colDigit = boardSize === '5x5'
    ? getLastDigitFor5x5(awayScore)
    : getLastDigit(awayScore);

  // Find the row and column indices that match the digits
  const rowIndex = rowNumbers.findIndex(n => n === rowDigit);
  const colIndex = colNumbers.findIndex(n => n === colDigit);

  if (rowIndex === -1 || colIndex === -1) {
    return null;
  }

  // Find the square at this position
  return squares.find(sq => sq.row === rowIndex && sq.col === colIndex) || null;
}

/**
 * Calculate winner for a specific quarter
 */
export function calculateQuarterWinner(
  squares: Square[],
  rowNumbers: number[],
  colNumbers: number[],
  score: GameScore,
  payoutAmount: number,
  boardSize: '5x5' | '10x10'
): Winner | null {
  const winningSquare = findWinningSquare(
    squares,
    rowNumbers,
    colNumbers,
    score.homeScore,
    score.awayScore,
    boardSize
  );

  if (!winningSquare || !winningSquare.ownerId) {
    return null;
  }

  const rowDigit = boardSize === '5x5'
    ? getLastDigitFor5x5(score.homeScore)
    : getLastDigit(score.homeScore);
  const colDigit = boardSize === '5x5'
    ? getLastDigitFor5x5(score.awayScore)
    : getLastDigit(score.awayScore);

  return {
    square: winningSquare,
    quarter: score.quarter,
    payout: payoutAmount,
    winningNumbers: {
      row: rowDigit,
      col: colDigit,
    },
    score,
  };
}

/**
 * Calculate all winners for a game
 */
export function calculateAllWinners(
  squares: Square[],
  rowNumbers: number[],
  colNumbers: number[],
  scores: GameScore[],
  payoutConfig: PayoutConfig,
  boardSize: '5x5' | '10x10'
): PayoutResult {
  const winners: Winner[] = [];
  let totalPayout = 0;

  // Map quarters to payout amounts
  const payoutMap: Record<string, number> = {
    'Q1': payoutConfig.firstQuarter,
    'Q2': payoutConfig.secondQuarter,
    'Q3': payoutConfig.thirdQuarter,
    'FINAL': payoutConfig.final,
    'OT': payoutConfig.final, // Overtime typically uses final payout
  };

  for (const score of scores) {
    const payoutAmount = payoutMap[score.quarter] || 0;
    
    if (payoutAmount > 0) {
      const winner = calculateQuarterWinner(
        squares,
        rowNumbers,
        colNumbers,
        score,
        payoutAmount,
        boardSize
      );

      if (winner) {
        winners.push(winner);
        totalPayout += winner.payout;
      }
    }
  }

  return {
    winners,
    totalPayout,
    remainingPot: payoutConfig.total - totalPayout,
  };
}

/**
 * Calculate winner summary by owner
 */
export function calculateWinnerSummary(winners: Winner[]): Map<string, {
  ownerId: string;
  ownerName?: string;
  totalPayout: number;
  wins: number;
  quarters: string[];
}> {
  const summary = new Map<string, {
    ownerId: string;
    ownerName?: string;
    totalPayout: number;
    wins: number;
    quarters: string[];
  }>();

  for (const winner of winners) {
    const ownerId = winner.square.ownerId!;
    const existing = summary.get(ownerId);

    if (existing) {
      existing.totalPayout += winner.payout;
      existing.wins += 1;
      existing.quarters.push(winner.quarter);
    } else {
      summary.set(ownerId, {
        ownerId,
        ownerName: winner.square.ownerName,
        totalPayout: winner.payout,
        wins: 1,
        quarters: [winner.quarter],
      });
    }
  }

  return summary;
}

/**
 * Validate payout configuration
 */
export function validatePayoutConfig(config: PayoutConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.firstQuarter < 0) {
    errors.push('First quarter payout cannot be negative');
  }
  if (config.secondQuarter < 0) {
    errors.push('Second quarter payout cannot be negative');
  }
  if (config.thirdQuarter < 0) {
    errors.push('Third quarter payout cannot be negative');
  }
  if (config.final < 0) {
    errors.push('Final payout cannot be negative');
  }

  const sum = config.firstQuarter + config.secondQuarter + config.thirdQuarter + config.final;
  if (sum !== config.total) {
    errors.push(`Payout sum (${sum}) does not match total pot (${config.total})`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate custom payout distribution
 */
export function calculateCustomPayouts(
  totalPot: number,
  distribution: {
    q1: number; // percentage (e.g., 20 for 20%)
    q2: number;
    q3: number;
    final: number;
  }
): PayoutConfig {
  const { q1, q2, q3, final } = distribution;
  
  return {
    firstQuarter: Math.round(totalPot * (q1 / 100)),
    secondQuarter: Math.round(totalPot * (q2 / 100)),
    thirdQuarter: Math.round(totalPot * (q3 / 100)),
    final: Math.round(totalPot * (final / 100)),
    total: totalPot,
  };
}

/**
 * Get payout breakdown for display
 */
export function getPayoutBreakdown(config: PayoutConfig): {
  quarter: string;
  amount: number;
  percentage: number;
}[] {
  return [
    {
      quarter: '1st Quarter',
      amount: config.firstQuarter,
      percentage: Math.round((config.firstQuarter / config.total) * 100),
    },
    {
      quarter: '2nd Quarter',
      amount: config.secondQuarter,
      percentage: Math.round((config.secondQuarter / config.total) * 100),
    },
    {
      quarter: '3rd Quarter',
      amount: config.thirdQuarter,
      percentage: Math.round((config.thirdQuarter / config.total) * 100),
    },
    {
      quarter: 'Final Score',
      amount: config.final,
      percentage: Math.round((config.final / config.total) * 100),
    },
  ];
}

export default {
  getLastDigit,
  getLastDigitFor5x5,
  findWinningSquare,
  calculateQuarterWinner,
  calculateAllWinners,
  calculateWinnerSummary,
  validatePayoutConfig,
  calculateCustomPayouts,
  getPayoutBreakdown,
};