-- GridPlay Database Schema
-- Initial migration for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  avatar_url TEXT,
  stripe_customer_id VARCHAR(255),
  paypal_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- BOARDS TABLE
-- =============================================================================
CREATE TYPE board_size AS ENUM ('5x5', '10x10');
CREATE TYPE board_type AS ENUM ('standard', 'shotgun');
CREATE TYPE board_status AS ENUM ('draft', 'open', 'locked', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  size board_size NOT NULL DEFAULT '10x10',
  type board_type NOT NULL DEFAULT 'standard',
  status board_status NOT NULL DEFAULT 'draft',
  price_per_square DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Team information
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  game_id UUID REFERENCES games(id),
  
  -- Number assignments (stored as arrays)
  row_numbers INTEGER[] NOT NULL DEFAULT '{}',
  col_numbers INTEGER[] NOT NULL DEFAULT '{}',
  
  -- Payout configuration
  payout_q1 DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payout_q2 DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payout_q3 DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payout_final DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locked_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_payout_total CHECK (
    payout_q1 + payout_q2 + payout_q3 + payout_final = 
    (price_per_square * (
      CASE 
        WHEN size = '5x5' THEN 25
        WHEN size = '10x10' THEN 100
      END
    ))
  )
);

-- Create indexes
CREATE INDEX idx_boards_status ON boards(status);
CREATE INDEX idx_boards_created_by ON boards(created_by);
CREATE INDEX idx_boards_game_id ON boards(game_id);

-- Enable RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards
CREATE POLICY "Boards are viewable by everyone"
  ON boards FOR SELECT
  USING (true);

CREATE POLICY "Users can create boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Board creators can update their boards"
  ON boards FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Board creators can delete their boards"
  ON boards FOR DELETE
  USING (auth.uid() = created_by);

CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- GAMES TABLE
-- =============================================================================
CREATE TYPE game_status AS ENUM ('scheduled', 'in_progress', 'completed', 'postponed', 'cancelled');
CREATE TYPE game_quarter AS ENUM ('pregame', 'q1', 'q2', 'halftime', 'q3', 'q4', 'overtime', 'final');

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255) UNIQUE, -- ESPN game ID
  
  -- Team information
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  
  -- Scores
  home_score INTEGER NOT NULL DEFAULT 0,
  away_score INTEGER NOT NULL DEFAULT 0,
  home_score_q1 INTEGER DEFAULT 0,
  home_score_q2 INTEGER DEFAULT 0,
  home_score_q3 INTEGER DEFAULT 0,
  home_score_q4 INTEGER DEFAULT 0,
  away_score_q1 INTEGER DEFAULT 0,
  away_score_q2 INTEGER DEFAULT 0,
  away_score_q3 INTEGER DEFAULT 0,
  away_score_q4 INTEGER DEFAULT 0,
  
  -- Game state
  status game_status NOT NULL DEFAULT 'scheduled',
  quarter game_quarter NOT NULL DEFAULT 'pregame',
  time_remaining VARCHAR(50),
  
  -- Timing
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  league VARCHAR(50) DEFAULT 'nfl',
  season INTEGER,
  week INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_score_update TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_scheduled_start ON games(scheduled_start);
CREATE INDEX idx_games_external_id ON games(external_id);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- RLS Policies for games
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage games"
  ON games FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- BOARD SQUARES TABLE
-- =============================================================================
CREATE TYPE square_status AS ENUM ('available', 'reserved', 'purchased');

CREATE TABLE IF NOT EXISTS board_squares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  
  -- Position
  row_index INTEGER NOT NULL,
  col_index INTEGER NOT NULL,
  
  -- Assigned numbers (set when board is locked)
  row_number INTEGER,
  col_number INTEGER,
  
  -- Ownership
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  owner_name VARCHAR(255), -- For guest purchases
  
  -- Status
  status square_status NOT NULL DEFAULT 'available',
  price DECIMAL(10, 2) NOT NULL,
  
  -- Reservation
  reserved_at TIMESTAMP WITH TIME ZONE,
  reserved_until TIMESTAMP WITH TIME ZONE,
  
  -- Purchase
  purchased_at TIMESTAMP WITH TIME ZONE,
  transaction_id UUID REFERENCES transactions(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_position CHECK (
    row_index >= 0 AND 
    col_index >= 0 AND
    (
      (row_index < 5 AND col_index < 5) OR
      (row_index < 10 AND col_index < 10)
    )
  ),
  UNIQUE(board_id, row_index, col_index)
);

-- Create indexes
CREATE INDEX idx_squares_board ON board_squares(board_id);
CREATE INDEX idx_squares_owner ON board_squares(owner_id);
CREATE INDEX idx_squares_status ON board_squares(status);

-- Enable RLS
ALTER TABLE board_squares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for board_squares
CREATE POLICY "Squares are viewable by everyone"
  ON board_squares FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert squares"
  ON board_squares FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Square owners can update their squares"
  ON board_squares FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() IN (
    SELECT created_by FROM boards WHERE id = board_id
  ));

CREATE TRIGGER update_squares_updated_at
  BEFORE UPDATE ON board_squares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TRANSACTIONS TABLE
-- =============================================================================
CREATE TYPE transaction_type AS ENUM ('purchase', 'refund', 'payout');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('stripe', 'paypal');

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Board/Square
  board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
  square_ids UUID[] DEFAULT '{}',
  
  -- Transaction details
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment method
  payment_method payment_method,
  payment_provider_id VARCHAR(255), -- Stripe PaymentIntent ID or PayPal Order ID
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_board ON transactions(board_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_payment_provider ON transactions(payment_provider_id);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage transactions"
  ON transactions FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- WINNER PAYOUTS TABLE
-- =============================================================================
CREATE TYPE payout_quarter AS ENUM ('q1', 'q2', 'q3', 'final');

CREATE TABLE IF NOT EXISTS winner_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Board and game
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  
  -- Quarter
  quarter payout_quarter NOT NULL,
  
  -- Winning square
  square_id UUID NOT NULL REFERENCES board_squares(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  winner_name VARCHAR(255),
  
  -- Score at time of win
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  home_digit INTEGER NOT NULL,
  away_digit INTEGER NOT NULL,
  
  -- Payout
  amount DECIMAL(10, 2) NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  
  -- Status
  paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(board_id, quarter)
);

-- Create indexes
CREATE INDEX idx_payouts_board ON winner_payouts(board_id);
CREATE INDEX idx_payouts_winner ON winner_payouts(winner_id);
CREATE INDEX idx_payouts_game ON winner_payouts(game_id);

-- Enable RLS
ALTER TABLE winner_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for winner_payouts
CREATE POLICY "Payouts are viewable by everyone"
  ON winner_payouts FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage payouts"
  ON winner_payouts FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- BOARD INVITATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS board_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  
  -- Invitation details
  email VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL UNIQUE,
  
  -- Inviter
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status
  accepted BOOLEAN DEFAULT FALSE,
  accepted_by UUID REFERENCES users(id),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Create indexes
CREATE INDEX idx_invitations_board ON board_invitations(board_id);
CREATE INDEX idx_invitations_email ON board_invitations(email);
CREATE INDEX idx_invitations_code ON board_invitations(code);

-- Enable RLS
ALTER TABLE board_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for board_invitations
CREATE POLICY "Invitations are viewable by board creator and invitee"
  ON board_invitations FOR SELECT
  USING (
    auth.uid() = invited_by OR
    auth.uid() IN (SELECT id FROM users WHERE email = board_invitations.email)
  );

CREATE POLICY "Users can create invitations"
  ON board_invitations FOR INSERT
  WITH CHECK (auth.uid() = invited_by);

-- =============================================================================
-- FUNCTIONS AND PROCEDURES
-- =============================================================================

-- Function to generate random numbers for board
CREATE OR REPLACE FUNCTION generate_board_numbers(board_uuid UUID)
RETURNS VOID AS $$
DECLARE
  board_record RECORD;
  numbers INTEGER[];
  i INTEGER;
  temp INTEGER;
  rand_idx INTEGER;
BEGIN
  -- Get board info
  SELECT * INTO board_record FROM boards WHERE id = board_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Board not found';
  END IF;
  
  -- Generate numbers 0-9 (or 0-4 for 5x5)
  IF board_record.size = '10x10' THEN
    numbers := ARRAY[0,1,2,3,4,5,6,7,8,9];
  ELSE
    numbers := ARRAY[0,1,2,3,4];
  END IF;
  
  -- Fisher-Yates shuffle for row numbers
  FOR i IN REVERSE array_length(numbers, 1)..2 LOOP
    rand_idx := floor(random() * i + 1);
    temp := numbers[i];
    numbers[i] := numbers[rand_idx];
    numbers[rand_idx] := temp;
  END LOOP;
  
  UPDATE boards SET row_numbers = numbers WHERE id = board_uuid;
  
  -- Shuffle again for column numbers
  FOR i IN REVERSE array_length(numbers, 1)..2 LOOP
    rand_idx := floor(random() * i + 1);
    temp := numbers[i];
    numbers[i] := numbers[rand_idx];
    numbers[rand_idx] := temp;
  END LOOP;
  
  UPDATE boards SET col_numbers = numbers WHERE id = board_uuid;
  
  -- Update squares with assigned numbers
  UPDATE board_squares sq
  SET 
    row_number = b.row_numbers[sq.row_index + 1],
    col_number = b.col_numbers[sq.col_index + 1]
  FROM boards b
  WHERE b.id = board_uuid AND sq.board_id = board_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate winner for a quarter
CREATE OR REPLACE FUNCTION calculate_quarter_winner(
  board_uuid UUID,
  game_uuid UUID,
  quarter_name payout_quarter
)
RETURNS UUID AS $$
DECLARE
  board_record RECORD;
  game_record RECORD;
  home_digit INTEGER;
  away_digit INTEGER;
  winning_square UUID;
BEGIN
  -- Get board and game info
  SELECT * INTO board_record FROM boards WHERE id = board_uuid;
  SELECT * INTO game_record FROM games WHERE id = game_uuid;
  
  IF NOT FOUND OR board_record IS NULL THEN
    RAISE EXCEPTION 'Board or game not found';
  END IF;
  
  -- Get scores for the quarter
  CASE quarter_name
    WHEN 'q1' THEN
      home_digit := game_record.home_score_q1 % 10;
      away_digit := game_record.away_score_q1 % 10;
    WHEN 'q2' THEN
      home_digit := (game_record.home_score_q1 + game_record.home_score_q2) % 10;
      away_digit := (game_record.away_score_q1 + game_record.away_score_q2) % 10;
    WHEN 'q3' THEN
      home_digit := (game_record.home_score_q1 + game_record.home_score_q2 + game_record.home_score_q3) % 10;
      away_digit := (game_record.away_score_q1 + game_record.away_score_q2 + game_record.away_score_q3) % 10;
    WHEN 'final' THEN
      home_digit := game_record.home_score % 10;
      away_digit := game_record.away_score % 10;
  END CASE;
  
  -- Find winning square
  SELECT id INTO winning_square
  FROM board_squares
  WHERE board_id = board_uuid
    AND row_number = home_digit
    AND col_number = away_digit
    AND status = 'purchased';
  
  RETURN winning_square;
END;
$$ LANGUAGE plpgsql;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_boards BIGINT,
  total_squares BIGINT,
  total_winnings DECIMAL,
  active_boards BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total boards created
    COUNT(DISTINCT b.id)::BIGINT as total_boards,
    -- Total squares owned
    COUNT(DISTINCT sq.id)::BIGINT as total_squares,
    -- Total winnings
    COALESCE(SUM(wp.amount), 0)::DECIMAL as total_winnings,
    -- Active boards
    COUNT(DISTINCT CASE WHEN b.status IN ('open', 'locked') THEN b.id END)::BIGINT as active_boards
  FROM users u
  LEFT JOIN boards b ON b.created_by = u.id
  LEFT JOIN board_squares sq ON sq.owner_id = u.id
  LEFT JOIN winner_payouts wp ON wp.winner_id = u.id
  WHERE u.id = user_uuid
  GROUP BY u.id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INITIAL DATA / SEEDS
-- =============================================================================

-- Insert a placeholder game for testing
INSERT INTO games (
  id,
  home_team,
  away_team,
  scheduled_start,
  status,
  quarter
) VALUES (
  uuid_generate_v4(),
  'Kansas City Chiefs',
  'San Francisco 49ers',
  NOW() + INTERVAL '7 days',
  'scheduled',
  'pregame'
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions to anon users (limited)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON boards TO anon;
GRANT SELECT ON games TO anon;
GRANT SELECT ON board_squares TO anon;
GRANT SELECT ON winner_payouts TO anon;