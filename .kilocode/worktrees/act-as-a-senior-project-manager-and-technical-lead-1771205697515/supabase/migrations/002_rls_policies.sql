-- GridPlay RLS Policies and Additional Functions
-- Migration 002

-- =============================================================================
-- ADDITIONAL RLS POLICIES
-- =============================================================================

-- Allow public to view open boards
CREATE POLICY "Open boards are viewable by everyone"
  ON boards FOR SELECT
  USING (status IN ('open', 'locked', 'completed'));

-- Allow users to view their own transactions even if not the owner
CREATE POLICY "Users can view transactions on their boards"
  ON transactions FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT created_by FROM boards WHERE id = board_id)
  );

-- =============================================================================
-- REALTIME SUBSCRIPTIONS
-- =============================================================================

-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE board_squares;
ALTER PUBLICATION supabase_realtime ADD TABLE winner_payouts;

-- =============================================================================
-- ADDITIONAL FUNCTIONS
-- =============================================================================

-- Function to check if a user can purchase squares
CREATE OR REPLACE FUNCTION can_purchase_squares(
  board_uuid UUID,
  user_uuid UUID,
  square_count INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  board_record RECORD;
  user_square_count INTEGER;
  max_squares INTEGER;
BEGIN
  -- Get board info
  SELECT * INTO board_record FROM boards WHERE id = board_uuid;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if board is open
  IF board_record.status != 'open' THEN
    RETURN FALSE;
  END IF;
  
  -- Get current square count for user on this board
  SELECT COUNT(*) INTO user_square_count
  FROM board_squares
  WHERE board_id = board_uuid AND owner_id = user_uuid;
  
  -- Set max squares based on board size
  IF board_record.size = '10x10' THEN
    max_squares := 10; -- Max 10 squares per user on 10x10 board
  ELSE
    max_squares := 5; -- Max 5 squares per user on 5x5 board
  END IF;
  
  -- Check if purchase would exceed limit
  IF user_square_count + square_count > max_squares THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get board summary
CREATE OR REPLACE FUNCTION get_board_summary(board_uuid UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  status board_status,
  total_squares BIGINT,
  purchased_squares BIGINT,
  available_squares BIGINT,
  total_pot DECIMAL,
  paid_out DECIMAL,
  completion_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.status,
    COUNT(sq.id)::BIGINT as total_squares,
    COUNT(CASE WHEN sq.status = 'purchased' THEN 1 END)::BIGINT as purchased_squares,
    COUNT(CASE WHEN sq.status = 'available' THEN 1 END)::BIGINT as available_squares,
    (COUNT(CASE WHEN sq.status = 'purchased' THEN 1 END) * b.price_per_square)::DECIMAL as total_pot,
    COALESCE(SUM(CASE WHEN wp.paid THEN wp.amount ELSE 0 END), 0)::DECIMAL as paid_out,
    CASE 
      WHEN COUNT(sq.id) > 0 THEN
        ROUND((COUNT(CASE WHEN sq.status = 'purchased' THEN 1 END)::DECIMAL / COUNT(sq.id)::DECIMAL) * 100, 2)
      ELSE 0
    END as completion_percentage
  FROM boards b
  LEFT JOIN board_squares sq ON sq.board_id = b.id
  LEFT JOIN winner_payouts wp ON wp.board_id = b.id
  WHERE b.id = board_uuid
  GROUP BY b.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to lock board and generate numbers
CREATE OR REPLACE FUNCTION lock_board(board_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  board_record RECORD;
BEGIN
  -- Get board info
  SELECT * INTO board_record FROM boards WHERE id = board_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Board not found';
  END IF;
  
  -- Check if all squares are purchased
  IF EXISTS (
    SELECT 1 FROM board_squares 
    WHERE board_id = board_uuid AND status != 'purchased'
  ) THEN
    RAISE EXCEPTION 'Not all squares are purchased';
  END IF;
  
  -- Generate random numbers
  PERFORM generate_board_numbers(board_uuid);
  
  -- Update board status
  UPDATE boards 
  SET 
    status = 'locked',
    locked_at = NOW()
  WHERE id = board_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process quarter winner
CREATE OR REPLACE FUNCTION process_quarter_winner(
  board_uuid UUID,
  game_uuid UUID,
  quarter_name payout_quarter
)
RETURNS UUID AS $$
DECLARE
  winning_square_id UUID;
  square_record RECORD;
  payout_amount DECIMAL;
  board_record RECORD;
BEGIN
  -- Get board info
  SELECT * INTO board_record FROM boards WHERE id = board_uuid;
  
  -- Calculate winner
  winning_square_id := calculate_quarter_winner(board_uuid, game_uuid, quarter_name);
  
  IF winning_square_id IS NULL THEN
    RAISE EXCEPTION 'No winning square found';
  END IF;
  
  -- Get square info
  SELECT * INTO square_record FROM board_squares WHERE id = winning_square_id;
  
  -- Get payout amount
  CASE quarter_name
    WHEN 'q1' THEN payout_amount := board_record.payout_q1;
    WHEN 'q2' THEN payout_amount := board_record.payout_q2;
    WHEN 'q3' THEN payout_amount := board_record.payout_q3;
    WHEN 'final' THEN payout_amount := board_record.payout_final;
  END CASE;
  
  -- Get game scores
  SELECT * INTO board_record FROM games WHERE id = game_uuid;
  
  -- Insert winner payout record
  INSERT INTO winner_payouts (
    board_id,
    game_id,
    quarter,
    square_id,
    winner_id,
    winner_name,
    home_score,
    away_score,
    home_digit,
    away_digit,
    amount
  ) VALUES (
    board_uuid,
    game_uuid,
    quarter_name,
    winning_square_id,
    square_record.owner_id,
    square_record.owner_name,
    board_record.home_score,
    board_record.away_score,
    square_record.row_number,
    square_record.col_number,
    payout_amount
  )
  ON CONFLICT (board_id, quarter) DO UPDATE SET
    square_id = EXCLUDED.square_id,
    winner_id = EXCLUDED.winner_id,
    winner_name = EXCLUDED.winner_name,
    home_score = EXCLUDED.home_score,
    away_score = EXCLUDED.away_score,
    home_digit = EXCLUDED.home_digit,
    away_digit = EXCLUDED.away_digit,
    amount = EXCLUDED.amount;
  
  RETURN winning_square_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger to create user profile on auth user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger to create squares when board is created
CREATE OR REPLACE FUNCTION create_board_squares()
RETURNS TRIGGER AS $$
DECLARE
  row_idx INTEGER;
  col_idx INTEGER;
  size_limit INTEGER;
BEGIN
  -- Set size limit based on board size
  IF NEW.size = '10x10' THEN
    size_limit := 10;
  ELSE
    size_limit := 5;
  END IF;
  
  -- Create squares
  FOR row_idx IN 0..(size_limit - 1) LOOP
    FOR col_idx IN 0..(size_limit - 1) LOOP
      INSERT INTO board_squares (
        board_id,
        row_index,
        col_index,
        price,
        status
      ) VALUES (
        NEW.id,
        row_idx,
        col_idx,
        NEW.price_per_square,
        'available'
      );
    END LOOP;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_board_created ON boards;

-- Create trigger
CREATE TRIGGER on_board_created
  AFTER INSERT ON boards
  FOR EACH ROW
  EXECUTE FUNCTION create_board_squares();

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_squares_board_status ON board_squares(board_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_boards_status_created ON boards(status, created_at DESC);

-- Partial indexes for active items
CREATE INDEX IF NOT EXISTS idx_active_boards ON boards(created_at DESC) 
  WHERE status IN ('open', 'locked');

CREATE INDEX IF NOT EXISTS idx_available_squares ON board_squares(board_id) 
  WHERE status = 'available';

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View for board listings
CREATE OR REPLACE VIEW board_listings AS
SELECT
  b.id,
  b.name,
  b.size,
  b.type,
  b.status,
  b.price_per_square,
  b.home_team,
  b.away_team,
  b.created_at,
  b.created_by,
  u.name as creator_name,
  COUNT(sq.id) as total_squares,
  COUNT(CASE WHEN sq.status = 'purchased' THEN 1 END) as purchased_squares,
  CASE 
    WHEN COUNT(sq.id) > 0 THEN
      ROUND((COUNT(CASE WHEN sq.status = 'purchased' THEN 1 END)::DECIMAL / COUNT(sq.id)::DECIMAL) * 100)
    ELSE 0
  END as completion_percentage
FROM boards b
LEFT JOIN users u ON u.id = b.created_by
LEFT JOIN board_squares sq ON sq.board_id = b.id
GROUP BY b.id, u.name;

-- View for user's boards
CREATE OR REPLACE VIEW user_boards AS
SELECT
  b.id,
  b.name,
  b.status,
  b.home_team,
  b.away_team,
  COUNT(sq.id) as my_squares,
  SUM(CASE WHEN wp.winner_id = sq.owner_id THEN wp.amount ELSE 0 END) as my_winnings
FROM boards b
JOIN board_squares sq ON sq.board_id = b.id AND sq.owner_id = current_user_id()
LEFT JOIN winner_payouts wp ON wp.board_id = b.id
GROUP BY b.id;

-- Helper function for current_user_id (for view)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- GRANT ADDITIONAL PERMISSIONS
-- =============================================================================

GRANT SELECT ON board_listings TO authenticated;
GRANT SELECT ON board_listings TO anon;
GRANT SELECT ON user_boards TO authenticated;