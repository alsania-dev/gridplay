/**
 * GridPlay Game API Route
 * 
 * GET: Get game by ID
 * PUT: Update game
 * DELETE: End/delete game
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../utils/supabaseClient';
import type { Game, GameMode, BoardConfig, ScoreData } from '../../../types';
import { GAME_MODES, BOARD_STATES } from '../../../lib/constants';

type GameResponse = {
  game: Game;
};

type GameWithCellsResponse = {
  game: Game;
  cells: {
    index: number;
    ownerId: string | null;
    ownerName: string | null;
    claimedAt: string | null;
  }[];
};

type GameUpdateRequest = {
  name?: string;
  status?: string;
  config?: Partial<BoardConfig>;
  scores?: ScoreData;
};

type ErrorResponse = {
  error: string;
  details?: string;
};

/**
 * GET /api/games/[id]
 * Get game by ID with optional cells data
 * 
 * Query params:
 * - includeCells: Include cell data (default: false)
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<GameResponse | GameWithCellsResponse | ErrorResponse>
) {
  try {
    const { id } = req.query;
    const { includeCells } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    // Fetch game
    const { data: gameData, error: gameError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single();

    if (gameError) {
      if (gameError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Game not found' });
      }
      console.error('Error fetching game:', gameError);
      return res.status(500).json({ error: 'Failed to fetch game', details: gameError.message });
    }

    // Transform to Game type
    const game: Game = {
      id: gameData.id,
      name: gameData.name,
      mode: gameData.mode as GameMode,
      status: gameData.status,
      config: gameData.config as BoardConfig,
      createdAt: gameData.created_at,
      updatedAt: gameData.updated_at,
      creatorId: gameData.creator_id,
      scores: gameData.scores as ScoreData | undefined,
    };

    // Include cells if requested
    if (includeCells === 'true') {
      const { data: cellsData, error: cellsError } = await supabase
        .from('cells')
        .select('*')
        .eq('board_id', id)
        .order('cell_index', { ascending: true });

      if (cellsError) {
        console.error('Error fetching cells:', cellsError);
        // Continue without cells
      }

      const cells = (cellsData || []).map(cell => ({
        index: cell.cell_index,
        ownerId: cell.owner_id,
        ownerName: cell.owner_name,
        claimedAt: cell.claimed_at,
      }));

      return res.status(200).json({ game, cells });
    }

    return res.status(200).json({ game });
  } catch (err) {
    console.error('Unexpected error in GET /api/games/[id]:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/games/[id]
 * Update game
 * 
 * Body:
 * - name: New game name
 * - status: New status (open, locked, in_progress, completed, cancelled)
 * - config: Partial config updates
 * - scores: Score data
 */
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<GameResponse | ErrorResponse>
) {
  try {
    const { id } = req.query;
    const body = req.body as GameUpdateRequest;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    // Check if game exists
    const { data: existingGame, error: fetchError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Game not found' });
      }
      console.error('Error fetching game:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch game' });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid game name' });
      }
      updateData.name = body.name.trim();
    }

    if (body.status !== undefined) {
      const validStatuses = Object.values(BOARD_STATES);
      if (!validStatuses.includes(body.status)) {
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }
      updateData.status = body.status;
    }

    if (body.config !== undefined) {
      updateData.config = {
        ...existingGame.config,
        ...body.config,
      };
    }

    if (body.scores !== undefined) {
      updateData.scores = body.scores;
    }

    // Update game
    const { data, error } = await supabase
      .from('boards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating game:', error);
      return res.status(500).json({ error: 'Failed to update game', details: error.message });
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
      scores: data.scores as ScoreData | undefined,
    };

    return res.status(200).json({ game });
  } catch (err) {
    console.error('Unexpected error in PUT /api/games/[id]:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/games/[id]
 * End/delete game
 * 
 * Query params:
 * - hard: Permanently delete (default: false, just marks as cancelled)
 */
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean } | ErrorResponse>
) {
  try {
    const { id, hard } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    // Check if game exists
    const { data: existingGame, error: fetchError } = await supabase
      .from('boards')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Game not found' });
      }
      console.error('Error fetching game:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch game' });
    }

    // Hard delete
    if (hard === 'true') {
      // Delete cells first
      await supabase.from('cells').delete().eq('board_id', id);
      
      // Delete game
      const { error } = await supabase.from('boards').delete().eq('id', id);

      if (error) {
        console.error('Error deleting game:', error);
        return res.status(500).json({ error: 'Failed to delete game', details: error.message });
      }

      return res.status(200).json({ success: true });
    }

    // Soft delete (mark as cancelled)
    const { error } = await supabase
      .from('boards')
      .update({
        status: BOARD_STATES.CANCELLED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error cancelling game:', error);
      return res.status(500).json({ error: 'Failed to cancel game', details: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Unexpected error in DELETE /api/games/[id]:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Main handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GameResponse | GameWithCellsResponse | ErrorResponse | { success: boolean }>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Route by method
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'PUT':
      return handlePut(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}