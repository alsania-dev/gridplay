/**
 * GridPlay Games API Route
 * 
 * GET: List all games (with optional filters)
 * POST: Create a new game
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../utils/supabaseClient';
import type { Game, GameMode, BoardConfig } from '../../types';
import { GAME_MODES, BOARD_STATES } from '../../lib/constants';

type GameListResponse = {
  games: Game[];
  total: number;
  page: number;
  pageSize: number;
};

type GameCreateRequest = {
  name: string;
  mode: GameMode;
  config: BoardConfig;
  creatorId?: string;
};

type GameCreateResponse = {
  game: Game;
};

type ErrorResponse = {
  error: string;
  details?: string;
};

/**
 * GET /api/games
 * List all games with optional filters
 * 
 * Query params:
 * - status: Filter by board status (open, locked, in_progress, completed)
 * - mode: Filter by game mode (shotgun, 5x5, 10x10)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<GameListResponse | ErrorResponse>
) {
  try {
    const {
      status,
      mode,
      page = '1',
      pageSize = '20',
    } = req.query;

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 20));
    const offset = (pageNum - 1) * pageSizeNum;

    // Build query
    let query = supabase
      .from('boards')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    if (mode && typeof mode === 'string') {
      query = query.eq('mode', mode);
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSizeNum - 1);

    if (error) {
      console.error('Error fetching games:', error);
      return res.status(500).json({ error: 'Failed to fetch games', details: error.message });
    }

    // Transform data to match Game type
    const games: Game[] = (data || []).map(row => ({
      id: row.id,
      name: row.name,
      mode: row.mode as GameMode,
      status: row.status,
      config: row.config as BoardConfig,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      creatorId: row.creator_id,
    }));

    return res.status(200).json({
      games,
      total: count || 0,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  } catch (err) {
    console.error('Unexpected error in GET /api/games:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/games
 * Create a new game
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<GameCreateResponse | ErrorResponse>
) {
  try {
    const body = req.body as GameCreateRequest;

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return res.status(400).json({ error: 'Game name is required' });
    }

    if (!body.mode || !['shotgun', '5x5', '10x10'].includes(body.mode)) {
      return res.status(400).json({ error: 'Valid game mode is required (shotgun, 5x5, 10x10)' });
    }

    if (!body.config) {
      return res.status(400).json({ error: 'Game configuration is required' });
    }

    if (!body.config.homeTeam || !body.config.awayTeam) {
      return res.status(400).json({ error: 'Home and away team names are required' });
    }

    if (!body.config.entryFee || body.config.entryFee <= 0) {
      return res.status(400).json({ error: 'Valid entry fee is required' });
    }

    // Get game mode configuration
    const modeConfig = GAME_MODES[body.mode];
    if (!modeConfig) {
      return res.status(400).json({ error: 'Invalid game mode' });
    }

    // Calculate prize pool if not provided
    const prizePool = body.config.prizePool || (body.config.entryFee * modeConfig.totalCells);

    // Generate unique ID
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert game into database
    const { data, error } = await supabase
      .from('boards')
      .insert({
        id: gameId,
        name: body.name.trim(),
        mode: body.mode,
        status: BOARD_STATES.DRAFT,
        config: {
          ...body.config,
          prizePool,
        },
        creator_id: body.creatorId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating game:', error);
      return res.status(500).json({ error: 'Failed to create game', details: error.message });
    }

    // Create cells for the board
    const cells = [];
    for (let i = 0; i < modeConfig.totalCells; i++) {
      cells.push({
        board_id: gameId,
        cell_index: i,
        owner_id: null,
        owner_name: null,
        claimed_at: null,
      });
    }

    const { error: cellsError } = await supabase
      .from('cells')
      .insert(cells);

    if (cellsError) {
      console.error('Error creating cells:', cellsError);
      // Continue anyway - cells can be created on demand
    }

    // Transform response
    const game: Game = {
      id: data.id,
      name: data.name,
      mode: data.mode as GameMode,
      status: data.status,
      config: data.config as BoardConfig,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      creatorId: data.creator_id,
    };

    return res.status(201).json({ game });
  } catch (err) {
    console.error('Unexpected error in POST /api/games:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Main handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GameListResponse | GameCreateResponse | ErrorResponse>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Route by method
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}