// GridPlay TypeScript Type Definitions

export interface Board {
  id: string;
  name: string;
  value: number;
  created_at: string;
  updated_at: string;
}

export interface BoardUser {
  id: string;
  board_id: string;
  user_id: string;
  joined_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface ScoreGrid {
  firstHalf: string[];
  final: string[];
}

export interface GameState {
  awayTeam: string;
  homeTeam: string;
  scores: string[][];
}
