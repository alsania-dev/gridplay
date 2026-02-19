/**
 * GridPlay Supabase Database Types
 * 
 * Auto-generated types for Supabase database schema.
 * These types provide type safety for database operations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      boards: {
        Row: {
          id: string
          name: string
          mode: string
          status: string
          config: Json
          row_scores: number[]
          col_scores: number[]
          created_by: string
          created_at: string
          updated_at: string
          locked_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          name: string
          mode: string
          status?: string
          config: Json
          row_scores?: number[]
          col_scores?: number[]
          created_by: string
          created_at?: string
          updated_at?: string
          locked_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          mode?: string
          status?: string
          config?: Json
          row_scores?: number[]
          col_scores?: number[]
          created_by?: string
          created_at?: string
          updated_at?: string
          locked_at?: string | null
          completed_at?: string | null
        }
      }
      cells: {
        Row: {
          id: string
          board_id: string
          row: number
          col: number
          owner_id: string | null
          owner_name: string | null
          claimed_at: string | null
          is_winner: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          row: number
          col: number
          owner_id?: string | null
          owner_name?: string | null
          claimed_at?: string | null
          is_winner?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          row?: number
          col?: number
          owner_id?: string | null
          owner_name?: string | null
          claimed_at?: string | null
          is_winner?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          board_id: string
          amount: number
          currency: string
          status: string
          provider: string
          provider_payment_id: string | null
          cells: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          board_id: string
          amount: number
          currency?: string
          status?: string
          provider: string
          provider_payment_id?: string | null
          cells: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          board_id?: string
          amount?: number
          currency?: string
          status?: string
          provider?: string
          provider_payment_id?: string | null
          cells?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      board_summary: {
        Row: {
          id: string
          name: string
          mode: string
          status: string
          total_cells: number
          claimed_cells: number
          available_cells: number
          price_per_cell: number
          home_team_name: string
          away_team_name: string
          created_by: string
          created_at: string
        }
      }
      user_stats: {
        Row: {
          user_id: string
          total_boards: number
          total_cells: number
          total_wins: number
          total_earnings: number
        }
      }
    }
    Functions: {
      claim_cell: {
        Args: {
          p_board_id: string
          p_row: number
          p_col: number
          p_user_id: string
          p_display_name: string
        }
        Returns: {
          success: boolean
          message: string
        }
      }
      generate_scores: {
        Args: {
          p_board_id: string
        }
        Returns: {
          row_scores: number[]
          col_scores: number[]
        }
      }
      calculate_winners: {
        Args: {
          p_board_id: string
          p_home_score: number
          p_away_score: number
        }
        Returns: {
          winning_cells: Json
        }
      }
    }
    Enums: {
      board_status: 'draft' | 'open' | 'locked' | 'in_progress' | 'completed' | 'cancelled'
      game_mode: 'shotgun' | '5x5' | '10x10'
      payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
      payment_provider: 'stripe' | 'paypal'
    }
  }
}
