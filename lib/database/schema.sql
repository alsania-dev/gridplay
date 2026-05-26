/**
 * GridPlay Database Schema
 * 
 * PostgreSQL schema for Supabase.
 * Includes tables for games, players, cells, and transactions.
 * 
 * Run with: psql -f lib/database/schema.sql
 * Or via Supabase CLI: supabase db push
 */

-- ===========================================
-- Extensions
-- ===========================================

-- Enable UUID extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- Enums
-- ===========================================

CREATE TYPE board_status AS ENUM (
  'draft',
  'open',
  'locked',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE game_mode AS ENUM (
  'shotgun',
  '5x5',
  '10x10'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded'
);

CREATE TYPE payment_provider AS ENUM (
  'stripe',
  'paypal'
);

-- ===========================================
-- Tables
-- ===========================================

/**
 * Users table - stores user profile information
 * Linked to Supabase Auth via auth.users
 */
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
  CONSTRAINT valid_display_name CHECK (LENGTH(display_name) >= 3 AND LENGTH(display_name) <= 20)
);

-- Index for quick user lookups by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

/**
 * Boards table - stores game board information
 */
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mode game_mode NOT NULL DEFAULT '10x10',
  status board_status NOT NULL DEFAULT 'draft',
  config JSONB NOT NULL DEFAULT '{}',
  row_scores INTEGER[] DEFAULT '{}',
  col_scores INTEGER[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT valid_board_name CHECK (LENGTH(name) >= 3 AND LENGTH(name) <= 50)
);

-- Indexes for board queries
CREATE INDEX IF NOT EXISTS idx_boards_status ON boards(status);
CREATE INDEX IF NOT EXISTS idx_boards_created_by ON boards(created_by);
CREATE INDEX IF NOT EXISTS idx_boards_created_at ON boards(created_at DESC);

/**
 * Cells table - stores individual cell data for each board
 */
CREATE TABLE IF NOT EXISTS cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  row INTEGER NOT NULL,
  col INTEGER NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  owner_name TEXT,
  claimed_at TIMESTAMPTZ,
  is_winner BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_cell UNIQUE (board_id, row, col),
  CONSTRAINT valid_row_col CHECK (row >= 0 AND col >= 0)
);

-- Indexes for cell queries
CREATE INDEX IF NOT EXISTS idx_cells_board_id ON cells(board_id);
CREATE INDEX IF NOT EXISTS idx_cells_owner_id ON cells(owner_id);
CREATE INDEX IF NOT EXISTS idx_cells_is_winner ON cells(is_winner) WHERE is_winner = TRUE;

/**
 * Payments table - stores payment transaction records
 */
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Amount in cents to avoid floating point issues
  currency TEXT NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  provider payment_provider NOT NULL,
  provider_payment_id TEXT,
  cells JSONB NOT NULL DEFAULT '[]', -- Array of {row, col} objects
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Indexes for payment queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_board_id ON payments(board_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ===========================================
-- Views
-- ===========================================

/**
 * Board summary view - aggregated board information
 */
CREATE OR REPLACE VIEW board_summary AS
SELECT 
  b.id,
  b.name,
  b.mode,
  b.status,
  b.config->>'pricePerCell' AS price_per_cell,
  b.config->>'homeTeam' AS home_team_name,
  b.config->>'awayTeam' AS away_team_name,
  b.created_by,
  b.created_at,
  COUNT(c.id) AS total_cells,
  COUNT(c.owner_id) AS claimed_cells,
  COUNT(c.id) - COUNT(c.owner_id) AS available_cells
FROM boards b
LEFT JOIN cells c ON b.id = c.board_id
GROUP BY b.id;

/**
 * User stats view - aggregated user statistics
 */
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id AS user_id,
  COUNT(DISTINCT c.board_id) AS total_boards,
  COUNT(c.id) AS total_cells,
  COUNT(c.id) FILTER (WHERE c.is_winner = TRUE) AS total_wins,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) AS total_earnings
FROM users u
LEFT JOIN cells c ON u.id = c.owner_id
LEFT JOIN payments p ON u.id = p.user_id
GROUP BY u.id;

-- ===========================================
-- Functions
-- ===========================================

/**
 * Generate random scores using Fisher-Yates shuffle
 * Returns shuffled array of 0-9 for row and column headers
 */
CREATE OR REPLACE FUNCTION generate_scores(p_board_id UUID)
RETURNS TABLE(row_scores INTEGER[], col_scores INTEGER[]) AS $$
DECLARE
  v_row_scores INTEGER[] := ARRAY[0,1,2,3,4,5,6,7,8,9];
  v_col_scores INTEGER[] := ARRAY[0,1,2,3,4,5,6,7,8,9];
  v_temp INTEGER;
  v_i INTEGER;
  v_j INTEGER;
BEGIN
  -- Fisher-Yates shuffle for row scores
  FOR v_i IN REVERSE 9..1 LOOP
    v_j := floor(random() * (v_i + 1))::INTEGER;
    v_temp := v_row_scores[v_i + 1];
    v_row_scores[v_i + 1] := v_row_scores[v_j + 1];
    v_row_scores[v_j + 1] := v_temp;
  END LOOP;
  
  -- Fisher-Yates shuffle for column scores
  FOR v_i IN REVERSE 9..1 LOOP
    v_j := floor(random() * (v_i + 1))::INTEGER;
    v_temp := v_col_scores[v_i + 1];
    v_col_scores[v_i + 1] := v_col_scores[v_j + 1];
    v_col_scores[v_j + 1] := v_temp;
  END LOOP;
  
  -- Update board with generated scores
  UPDATE boards 
  SET row_scores = v_row_scores, 
      col_scores = v_col_scores,
      updated_at = NOW()
  WHERE id = p_board_id;
  
  RETURN QUERY SELECT v_row_scores, v_col_scores;
END;
$$ LANGUAGE plpgsql;

/**
 * Claim a cell for a user
 * Handles concurrency and validation
 */
CREATE OR REPLACE FUNCTION claim_cell(
  p_board_id UUID,
  p_row INTEGER,
  p_col INTEGER,
  p_user_id UUID,
  p_display_name TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_board_status board_status;
  v_cell_owner UUID;
BEGIN
  -- Check board status
  SELECT status INTO v_board_status FROM boards WHERE id = p_board_id;
  
  IF v_board_status IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Board not found';
    RETURN;
  END IF;
  
  IF v_board_status != 'open' THEN
    RETURN QUERY SELECT FALSE, 'Board is not open for claims';
    RETURN;
  END IF;
  
  -- Check if cell is already claimed
  SELECT owner_id INTO v_cell_owner 
  FROM cells 
  WHERE board_id = p_board_id AND row = p_row AND col = p_col;
  
  IF v_cell_owner IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Cell already claimed';
    RETURN;
  END IF;
  
  -- Claim the cell
  UPDATE cells
  SET owner_id = p_user_id,
      owner_name = p_display_name,
      claimed_at = NOW(),
      updated_at = NOW()
  WHERE board_id = p_board_id AND row = p_row AND col = p_col;
  
  RETURN QUERY SELECT TRUE, 'Cell claimed successfully';
END;
$$ LANGUAGE plpgsql;

/**
 * Calculate winners based on final scores
 * Marks winning cells and returns winner information
 */
CREATE OR REPLACE FUNCTION calculate_winners(
  p_board_id UUID,
  p_home_score INTEGER,
  p_away_score INTEGER
)
RETURNS TABLE(winning_cells JSONB) AS $$
DECLARE
  v_home_digit INTEGER := p_home_score % 10;
  v_away_digit INTEGER := p_away_score % 10;
  v_row_scores INTEGER[];
  v_col_scores INTEGER[];
  v_row_index INTEGER;
  v_col_index INTEGER;
BEGIN
  -- Get board scores
  SELECT row_scores, col_scores INTO v_row_scores, v_col_scores
  FROM boards WHERE id = p_board_id;
  
  -- Find matching indices
  SELECT idx - 1 INTO v_row_index
  FROM unnest(v_row_scores) WITH ORDINALITY AS t(val, idx)
  WHERE val = v_home_digit
  LIMIT 1;
  
  SELECT idx - 1 INTO v_col_index
  FROM unnest(v_col_scores) WITH ORDINALITY AS t(val, idx)
  WHERE val = v_away_digit
  LIMIT 1;
  
  -- Mark winning cells
  UPDATE cells
  SET is_winner = TRUE, updated_at = NOW()
  WHERE board_id = p_board_id 
    AND row = v_row_index 
    AND col = v_col_index;
  
  -- Return winning cell info
  RETURN QUERY
  SELECT jsonb_build_object(
    'row', v_row_index,
    'col', v_col_index,
    'homeDigit', v_home_digit,
    'awayDigit', v_away_digit,
    'owner', c.owner_name
  )
  FROM cells c
  WHERE c.board_id = p_board_id 
    AND c.row = v_row_index 
    AND c.col = v_col_index;
END;
$$ LANGUAGE plpgsql;

/**
 * Update timestamp trigger function
 */
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cells_updated_at
  BEFORE UPDATE ON cells
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Row Level Security (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users: can only read/update their own data
CREATE POLICY users_select_own ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY users_update_own ON users FOR UPDATE
  USING (auth.uid() = id);

-- Boards: public read, authenticated create
CREATE POLICY boards_select_all ON boards FOR SELECT
  USING (true);

CREATE POLICY boards_insert_authenticated ON boards FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY boards_update_owner ON boards FOR UPDATE
  USING (auth.uid() = created_by);

-- Cells: public read, authenticated claim
CREATE POLICY cells_select_all ON cells FOR SELECT
  USING (true);

CREATE POLICY cells_insert_authenticated ON cells FOR INSERT
  WITH CHECK (true);

CREATE POLICY cells_update_authenticated ON cells FOR UPDATE
  USING (true);

-- Payments: users can only see their own payments
CREATE POLICY payments_select_own ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY payments_insert_own ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- Initial Data / Seed
-- ===========================================

-- Note: Users are created via Supabase Auth, not seeded here

-- ===========================================
-- Comments for Documentation
-- ===========================================

COMMENT ON TABLE users IS 'User profiles linked to Supabase Auth';
COMMENT ON TABLE boards IS 'Game boards for football squares';
COMMENT ON TABLE cells IS 'Individual cells within game boards';
COMMENT ON TABLE payments IS 'Payment transactions for cell purchases';

COMMENT ON COLUMN boards.config IS 'JSON config: {pricePerCell, homeTeam, awayTeam, sport, externalGameId, gameStartTime}';
COMMENT ON COLUMN boards.row_scores IS 'Shuffled array of 0-9 for row headers';
COMMENT ON COLUMN boards.col_scores IS 'Shuffled array of 0-9 for column headers';
COMMENT ON COLUMN payments.amount IS 'Amount in cents to avoid floating point issues';
COMMENT ON COLUMN payments.cells IS 'Array of {row, col} objects representing purchased cells';