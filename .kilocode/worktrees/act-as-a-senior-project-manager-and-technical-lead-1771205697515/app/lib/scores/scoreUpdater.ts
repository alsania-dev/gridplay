/**
 * Score Updater Service for GridPlay
 * Handles real-time score updates and winner calculations
 */

import { getLiveScores, getGame, parseEventToGameScore, GameScore } from './espnApi';
import { 
  calculateQuarterWinner, 
  calculateAllWinners,
  getLastDigit 
} from '../board/payoutCalculator';

export interface ScoreUpdateResult {
  boardId: string;
  gameId: string;
  scores: GameScore[];
  winners: Array<{
    quarter: string;
    squareId: string;
    ownerId: string;
    payout: number;
  }>;
  updatedAt: string;
}

export interface BoardScoreUpdate {
  homeScore: number;
  awayScore: number;
  quarter: string;
  clock: string;
  gameStatus: string;
}

/**
 * Fetch current scores for a game
 */
export async function fetchGameScores(
  gameId: string,
  sport: 'nfl' | 'college-football' = 'nfl'
): Promise<{ success: boolean; data?: GameScore; error?: string }> {
  try {
    const result = await getGame(gameId, sport);
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const gameScore = parseEventToGameScore(result.data);
    return { success: true, data: gameScore };
  } catch (error) {
    console.error('Error fetching game scores:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch game scores',
    };
  }
}

/**
 * Calculate quarter scores from line scores
 */
export function calculateQuarterScores(
  lineScores: number[]
): Array<{ quarter: number; score: number }> {
  return lineScores.map((score, index) => ({
    quarter: index + 1,
    score,
  }));
}

/**
 * Get cumulative score at each quarter
 */
export function getCumulativeScores(
  lineScores: number[]
): Array<{ quarter: number; cumulativeScore: number }> {
  let cumulative = 0;
  return lineScores.map((score, index) => {
    cumulative += score;
    return {
      quarter: index + 1,
      cumulativeScore: cumulative,
    };
  });
}

/**
 * Generate score updates for all quarters
 */
export function generateQuarterScoreUpdates(
  homeLineScores: number[],
  awayLineScores: number[]
): Array<{
  quarter: string;
  homeScore: number;
  awayScore: number;
}> {
  const updates: Array<{
    quarter: string;
    homeScore: number;
    awayScore: number;
  }> = [];

  let homeCumulative = 0;
  let awayCumulative = 0;

  const maxQuarters = Math.max(homeLineScores.length, awayLineScores.length, 4);

  for (let i = 0; i < maxQuarters; i++) {
    const homeQuarterScore = homeLineScores[i] || 0;
    const awayQuarterScore = awayLineScores[i] || 0;
    
    homeCumulative += homeQuarterScore;
    awayCumulative += awayQuarterScore;

    let quarterName: string;
    if (i < 4) {
      quarterName = `Q${i + 1}`;
    } else if (i === 4) {
      quarterName = 'OT';
    } else {
      quarterName = `OT${i - 3}`;
    }

    updates.push({
      quarter: quarterName,
      homeScore: homeCumulative,
      awayScore: awayCumulative,
    });
  }

  // Add final score
  if (updates.length > 0) {
    updates.push({
      quarter: 'FINAL',
      homeScore: homeCumulative,
      awayScore: awayCumulative,
    });
  }

  return updates;
}

/**
 * Determine if scores have changed
 */
export function haveScoresChanged(
  oldScore: BoardScoreUpdate | null,
  newScore: GameScore
): boolean {
  if (!oldScore) return true;

  return (
    oldScore.homeScore !== newScore.homeScore ||
    oldScore.awayScore !== newScore.awayScore ||
    oldScore.quarter !== newScore.quarter
  );
}

/**
 * Get winning digits for a score
 */
export function getWinningDigits(
  homeScore: number,
  awayScore: number,
  boardSize: '5x5' | '10x10'
): { homeDigit: number; awayDigit: number } {
  return {
    homeDigit: boardSize === '5x5' ? homeScore % 5 : getLastDigit(homeScore),
    awayDigit: boardSize === '5x5' ? awayScore % 5 : getLastDigit(awayScore),
  };
}

/**
 * Format game clock for display
 */
export function formatGameClock(clock: string, quarter: string): string {
  if (quarter === 'FINAL' || quarter === 'FINAL/OT') {
    return 'Final';
  }
  
  if (quarter.startsWith('OT')) {
    return `OT - ${clock}`;
  }
  
  return `Q${quarter} - ${clock}`;
}

/**
 * Check if game is in progress
 */
export function isGameInProgress(status: string): boolean {
  return status === 'in_progress';
}

/**
 * Check if game is complete
 */
export function isGameComplete(status: string): boolean {
  return status === 'completed';
}

/**
 * Get game status text
 */
export function getGameStatusText(gameScore: GameScore): string {
  switch (gameScore.status) {
    case 'scheduled':
      return `Starts ${new Date(gameScore.startTime).toLocaleString()}`;
    case 'in_progress':
      return formatGameClock(gameScore.clock, gameScore.quarter);
    case 'completed':
      return 'Final';
    case 'postponed':
      return 'Postponed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Poll for score updates
 */
export class ScorePoller {
  private intervalId: NodeJS.Timeout | null = null;
  private gameId: string;
  private sport: 'nfl' | 'college-football';
  private onUpdate: (score: GameScore) => void;
  private onError: (error: string) => void;
  private pollIntervalMs: number;

  constructor(
    gameId: string,
    onUpdate: (score: GameScore) => void,
    onError: (error: string) => void,
    sport: 'nfl' | 'college-football' = 'nfl',
    pollIntervalMs: number = 30000 // 30 seconds
  ) {
    this.gameId = gameId;
    this.sport = sport;
    this.onUpdate = onUpdate;
    this.onError = onError;
    this.pollIntervalMs = pollIntervalMs;
  }

  async start(): Promise<void> {
    // Initial fetch
    await this.poll();
    
    // Start polling
    this.intervalId = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async poll(): Promise<void> {
    const result = await fetchGameScores(this.gameId, this.sport);
    
    if (result.success && result.data) {
      this.onUpdate(result.data);
      
      // Stop polling if game is complete
      if (isGameComplete(result.data.status)) {
        this.stop();
      }
    } else {
      this.onError(result.error || 'Failed to fetch scores');
    }
  }
}

export default {
  fetchGameScores,
  calculateQuarterScores,
  getCumulativeScores,
  generateQuarterScoreUpdates,
  haveScoresChanged,
  getWinningDigits,
  formatGameClock,
  isGameInProgress,
  isGameComplete,
  getGameStatusText,
  ScorePoller,
};