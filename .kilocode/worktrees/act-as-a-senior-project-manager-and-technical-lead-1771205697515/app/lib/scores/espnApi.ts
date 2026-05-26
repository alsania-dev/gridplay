/**
 * ESPN API Integration for GridPlay
 * Fetches live NFL/NCAA football scores
 */

export interface ESPNEvent {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season?: {
    year: number;
    type: number;
    slug: string;
  };
  competitions: ESPNCompetition[];
  status: ESPNStatus;
  links?: Array<{
    rel: string[];
    href: string;
    text?: string;
  }>;
}

export interface ESPNCompetition {
  id: string;
  uid: string;
  date: string;
  attendance?: number;
  timeValid?: boolean;
  neutralSite?: boolean;
  conferenceCompetition?: boolean;
  playByPlayAvailable?: boolean;
  recent?: boolean;
  venue?: ESPNVenue;
  competitors: ESPNCompetitor[];
  status: ESPNStatus;
  notes?: Array<{
    type: string;
    headline?: string;
  }>;
}

export interface ESPNCompetitor {
  id: string;
  uid: string;
  type: string;
  order: number;
  homeAway: string;
  winner?: boolean;
  team: ESPNTeam;
  score: string;
  linescores?: ESPNLineScore[];
  records?: Array<{
    name: string;
    abbreviation: string;
    type: string;
    summary: string;
  }>;
}

export interface ESPNLineScore {
  value: string;
  displayValue: string;
  period: number;
}

export interface ESPNTeam {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor: string;
  isActive?: boolean;
  venue?: ESPNVenue;
  links?: Array<{
    rel: string[];
    href: string;
    text?: string;
  }>;
  logo?: string;
}

export interface ESPNVenue {
  id: string;
  fullName: string;
  address?: {
    city: string;
    state: string;
    zip?: string;
  };
  capacity?: number;
  grass?: boolean;
  indoor?: boolean;
}

export interface ESPNStatus {
  clock: number;
  displayClock: string;
  period: number;
  periodType: string;
  type: {
    id: string;
    name: string;
    state: string;
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
  isTBDFinal?: boolean;
}

export interface ESPNScoreboard {
  leagues?: Array<{
    id: string;
    uid: string;
    name: string;
    abbreviation: string;
    slug: string;
    season: {
      year: number;
      startDate: string;
      endDate: string;
      type: {
        id: string;
        type: number;
        name: string;
        abbreviation: string;
      };
    };
  }>;
  week?: {
    number: number;
    startDate: string;
    endDate: string;
    text: string;
  };
  events: ESPNEvent[];
}

export interface GameScore {
  gameId: string;
  homeTeam: string;
  homeTeamAbbrev: string;
  awayTeam: string;
  awayTeamAbbrev: string;
  homeScore: number;
  awayScore: number;
  quarter: string;
  clock: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'postponed' | 'cancelled';
  period: number;
  homeLineScores: number[];
  awayLineScores: number[];
  startTime: string;
}

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football';

/**
 * Get the ESPN API URL for a given sport
 */
function getApiUrl(sport: 'nfl' | 'college-football' = 'nfl'): string {
  return `${ESPN_BASE_URL}/${sport}`;
}

/**
 * Fetch scoreboard for a specific week/season
 */
export async function getScoreboard(
  sport: 'nfl' | 'college-football' = 'nfl',
  week?: number,
  year?: number
): Promise<{ success: boolean; data?: ESPNScoreboard; error?: string }> {
  try {
    let url = `${getApiUrl(sport)}/scoreboard`;
    const params = new URLSearchParams();
    
    if (week) params.append('week', week.toString());
    if (year) params.append('season', year.toString());
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching ESPN scoreboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch scoreboard',
    };
  }
}

/**
 * Get a specific game/event
 */
export async function getGame(
  gameId: string,
  sport: 'nfl' | 'college-football' = 'nfl'
): Promise<{ success: boolean; data?: ESPNEvent; error?: string }> {
  try {
    const url = `${getApiUrl(sport)}/summary?event=${gameId}`;
    
    const response = await fetch(url, {
      next: { revalidate: 10 }, // Cache for 10 seconds
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    
    return { success: true, data: data.header?.event || data.events?.[0] };
  } catch (error) {
    console.error('Error fetching ESPN game:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch game',
    };
  }
}

/**
 * Parse ESPN event to GameScore format
 */
export function parseEventToGameScore(event: ESPNEvent): GameScore {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home')!;
  const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away')!;

  const statusMap: Record<string, GameScore['status']> = {
    'status_scheduled': 'scheduled',
    'status_in_progress': 'in_progress',
    'status_complete': 'completed',
    'status_postponed': 'postponed',
    'status_cancelled': 'cancelled',
  };

  const statusState = competition.status.type.state;
  const status = statusMap[`status_${statusState}`] || 'scheduled';

  // Parse line scores
  const homeLineScores = homeCompetitor.linescores?.map(ls => parseInt(ls.value) || 0) || [];
  const awayLineScores = awayCompetitor.linescores?.map(ls => parseInt(ls.value) || 0) || [];

  return {
    gameId: event.id,
    homeTeam: homeCompetitor.team.displayName,
    homeTeamAbbrev: homeCompetitor.team.abbreviation,
    awayTeam: awayCompetitor.team.displayName,
    awayTeamAbbrev: awayCompetitor.team.abbreviation,
    homeScore: parseInt(homeCompetitor.score) || 0,
    awayScore: parseInt(awayCompetitor.score) || 0,
    quarter: competition.status.period.toString(),
    clock: competition.status.displayClock,
    status,
    period: competition.status.period,
    homeLineScores,
    awayLineScores,
    startTime: event.date,
  };
}

/**
 * Get live scores for multiple games
 */
export async function getLiveScores(
  sport: 'nfl' | 'college-football' = 'nfl',
  gameIds?: string[]
): Promise<{ success: boolean; data?: GameScore[]; error?: string }> {
  try {
    const result = await getScoreboard(sport);
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    let events = result.data.events;
    
    // Filter by game IDs if provided
    if (gameIds && gameIds.length > 0) {
      events = events.filter(e => gameIds.includes(e.id));
    }

    const scores = events.map(parseEventToGameScore);
    
    return { success: true, data: scores };
  } catch (error) {
    console.error('Error getting live scores:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get live scores',
    };
  }
}

/**
 * Get current week number for NFL
 */
export async function getCurrentWeek(
  sport: 'nfl' | 'college-football' = 'nfl'
): Promise<{ success: boolean; week?: number; error?: string }> {
  try {
    const result = await getScoreboard(sport);
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    return { success: true, week: result.data.week?.number };
  } catch (error) {
    console.error('Error getting current week:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get current week',
    };
  }
}

export default {
  getScoreboard,
  getGame,
  getLiveScores,
  getCurrentWeek,
  parseEventToGameScore,
};