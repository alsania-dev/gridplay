// Supabase Database Types
// Generated types for type-safe database operations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Generic database type that allows flexibility during development
// Replace with generated types from `supabase gen types typescript` for production
export interface Database {
  public: {
    Tables: {
      boards: {
        Row: {
          id: string
          name: string
          value: number | string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          value: number | string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          value?: number | string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      board_users: {
        Row: {
          id: string
          board_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          board_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          user_id?: string
          joined_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Generic table names for flexible queries
export type TableName = keyof Database['public']['Tables']
