export type BoardType = "shotgun" | "5x5" | "10x10"

export type SportType = "nfl" | "nba" | "ncaaf" | "ncaab" | "nhl" | "other"

export interface Team {
  name: string
  abbreviation: string
  color?: string
}

export interface GameConfig {
  sport: SportType
  homeTeam: Team
  awayTeam: Team
  boardType: BoardType
  squarePrice: number
  gameDate?: string
}

export interface QuarterScore {
  quarter: number
  label: string
  home: number
  away: number
}

export interface BoardSquare {
  index: number
  owner?: string
  isSelected: boolean
  isWinner: boolean
  winQuarter?: number
}

export interface GameState {
  config: GameConfig
  squares: BoardSquare[]
  columnNumbers: number[]
  rowNumbers: number[]
  scores: QuarterScore[]
  isLocked: boolean
  isStarted: boolean
  currentQuarter: number
}

export const QUARTER_LABELS: Record<string, string[]> = {
  nfl: ["Q1", "Halftime", "Q3", "Final"],
  nba: ["Q1", "Halftime", "Q3", "Final"],
  ncaaf: ["Q1", "Halftime", "Q3", "Final"],
  ncaab: ["H1", "Final", "", ""],
  nhl: ["P1", "P2", "P3", "Final"],
  other: ["Q1", "Q2", "Q3", "Final"],
}

export const SPORT_LABELS: Record<SportType, string> = {
  nfl: "NFL",
  nba: "NBA",
  ncaaf: "College Football",
  ncaab: "College Basketball",
  nhl: "NHL",
  other: "Other Sport",
}

export const PAYOUT_STRUCTURE = {
  q1: 0.16,
  halftime: 0.24,
  q3: 0.16,
  final: 0.32,
  house: 0.12,
}
