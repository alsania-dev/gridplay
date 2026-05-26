import { atom, selector, selectorFamily } from 'recoil';

// Game types
export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled';
export type Quarter = 'pregame' | 'q1' | 'q2' | 'halftime' | 'q3' | 'q4' | 'overtime' | 'final';

export interface TeamScore {
  team: string;
  score: number;
  lastScore: number;
}

export interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: GameStatus;
  quarter: Quarter;
  timeRemaining?: string;
  startTime: string;
  lastUpdated: string;
}

export interface QuarterWinner {
  quarter: Quarter;
  winnerId: string | null;
  winnerName: string | null;
  homeDigit: number;
  awayDigit: number;
  homeScore: number;
  awayScore: number;
  payout: number;
  paid: boolean;
}

// Current game state
export const currentGameState = atom<Game | null>({
  key: 'currentGameState',
  default: null,
});

// Game loading state
export const gameLoadingState = atom<boolean>({
  key: 'gameLoadingState',
  default: false,
});

// Game error state
export const gameErrorState = atom<string | null>({
  key: 'gameErrorState',
  default: null,
});

// Quarter winners state
export const quarterWinnersState = atom<QuarterWinner[]>({
  key: 'quarterWinnersState',
  default: [],
});

// Live update enabled state
export const liveUpdateEnabledState = atom<boolean>({
  key: 'liveUpdateEnabledState',
  default: true,
});

// Last update timestamp
export const lastUpdateTimestampState = atom<Date | null>({
  key: 'lastUpdateTimestampState',
  default: null,
});

// Selectors
export const isGameLiveState = selector({
  key: 'isGameLiveState',
  get: ({ get }) => {
    const game = get(currentGameState);
    return game?.status === 'in_progress';
  },
});

export const isGameCompleteState = selector({
  key: 'isGameCompleteState',
  get: ({ get }) => {
    const game = get(currentGameState);
    return game?.status === 'completed' || game?.quarter === 'final';
  },
});

export const currentQuarterLabelState = selector({
  key: 'currentQuarterLabelState',
  get: ({ get }) => {
    const game = get(currentGameState);
    if (!game) return 'Not Started';
    
    const quarterLabels: Record<Quarter, string> = {
      pregame: 'Pregame',
      q1: '1st Quarter',
      q2: '2nd Quarter',
      halftime: 'Halftime',
      q3: '3rd Quarter',
      q4: '4th Quarter',
      overtime: 'Overtime',
      final: 'Final',
    };
    
    return quarterLabels[game.quarter] || 'Unknown';
  },
});

export const gameDisplayScoreState = selector({
  key: 'gameDisplayScoreState',
  get: ({ get }) => {
    const game = get(currentGameState);
    if (!game) return null;
    
    return {
      home: {
        team: game.homeTeam,
        score: game.homeScore,
      },
      away: {
        team: game.awayTeam,
        score: game.awayScore,
      },
      quarter: game.quarter,
      timeRemaining: game.timeRemaining,
    };
  },
});

// Selector for last digit of scores (used for squares)
export const scoreLastDigitsState = selector({
  key: 'scoreLastDigitsState',
  get: ({ get }) => {
    const game = get(currentGameState);
    if (!game) return { home: 0, away: 0 };
    
    return {
      home: game.homeScore % 10,
      away: game.awayScore % 10,
    };
  },
});

// Selector family for quarter winner by quarter
export const winnerByQuarterState = selectorFamily({
  key: 'winnerByQuarterState',
  get: (quarter: Quarter) => ({ get }) => {
    const winners = get(quarterWinnersState);
    return winners.find(w => w.quarter === quarter) || null;
  },
});

// Selector for total payout amount
export const totalPayoutState = selector({
  key: 'totalPayoutState',
  get: ({ get }) => {
    const winners = get(quarterWinnersState);
    return winners.reduce((sum, w) => sum + w.payout, 0);
  },
});

// Selector for paid out amount
export const paidOutAmountState = selector({
  key: 'paidOutAmountState',
  get: ({ get }) => {
    const winners = get(quarterWinnersState);
    return winners.filter(w => w.paid).reduce((sum, w) => sum + w.payout, 0);
  },
});

export default {
  currentGameState,
  gameLoadingState,
  gameErrorState,
  quarterWinnersState,
  liveUpdateEnabledState,
  lastUpdateTimestampState,
  isGameLiveState,
  isGameCompleteState,
  currentQuarterLabelState,
  gameDisplayScoreState,
  scoreLastDigitsState,
  winnerByQuarterState,
  totalPayoutState,
  paidOutAmountState,
};