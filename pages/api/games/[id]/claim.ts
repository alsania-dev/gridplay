/**
 * GridPlay Cell Claim API Route
 * 
 * POST: Claim a cell in a game
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../utils/supabaseClient';
import { BOARD_STATES } from '../../../../lib/constants';

type ClaimRequest = {
  cellIndex: number;
  userId: string;
  displayName: string;
};

type ClaimResponse = {
  success: boolean;
  cell: {
    index: number;
    ownerId: string;
    ownerName: string;
    claimedAt: string;
  };
};

type ErrorResponse = {
  error: string;
  details?: string;
};

/**
 * POST /api/games/[id]/claim
 * Claim a cell in a game
 * 
 * Body:
 * - cellIndex: Index of the cell to claim (0 to totalCells-1)
 * - userId: User ID claiming the cell
 * - displayName: Display name of the user
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<ClaimResponse | ErrorResponse>
) {
  try {
    const { id } = req.query;
    const body = req.body as ClaimRequest;

    // Validate game ID
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    // Validate required fields
    if (typeof body.cellIndex !== 'number' || body.cellIndex < 0) {
      return res.status(400).json({ error: 'Valid cell index is required' });
    }

    if (!body.userId || typeof body.userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!body.displayName || typeof body.displayName !== 'string') {
      return res.status(400).json({ error: 'Display name is required' });
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
      return res.status(500).json({ error: 'Failed to fetch game' });
    }

    // Check game status
    if (gameData.status === BOARD_STATES.COMPLETED) {
      return res.status(400).json({ error: 'Game has already completed' });
    }

    if (gameData.status === BOARD_STATES.CANCELLED) {
      return res.status(400).json({ error: 'Game has been cancelled' });
    }

    if (gameData.status === BOARD_STATES.LOCKED) {
      return res.status(400).json({ error: 'Game is locked for claiming' });
    }

    // Check if cell exists
    const { data: existingCell, error: cellError } = await supabase
      .from('cells')
      .select('*')
      .eq('board_id', id)
      .eq('cell_index', body.cellIndex)
      .single();

    if (cellError && cellError.code !== 'PGRST116') {
      console.error('Error fetching cell:', cellError);
      return res.status(500).json({ error: 'Failed to fetch cell' });
    }

    // If cell doesn't exist, create it
    if (!existingCell) {
      const { error: insertError } = await supabase
        .from('cells')
        .insert({
          board_id: id,
          cell_index: body.cellIndex,
          owner_id: body.userId,
          owner_name: body.displayName.trim(),
          claimed_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error creating cell:', insertError);
        return res.status(500).json({ error: 'Failed to claim cell', details: insertError.message });
      }

      return res.status(201).json({
        success: true,
        cell: {
          index: body.cellIndex,
          ownerId: body.userId,
          ownerName: body.displayName.trim(),
          claimedAt: new Date().toISOString(),
        },
      });
    }

    // Check if cell is already claimed
    if (existingCell.owner_id) {
      return res.status(409).json({ 
        error: 'Cell already claimed',
        details: `Cell ${body.cellIndex} is owned by ${existingCell.owner_name}`,
      });
    }

    // Claim the cell
    const { error: updateError } = await supabase
      .from('cells')
      .update({
        owner_id: body.userId,
        owner_name: body.displayName.trim(),
        claimed_at: new Date().toISOString(),
      })
      .eq('board_id', id)
      .eq('cell_index', body.cellIndex);

    if (updateError) {
      console.error('Error claiming cell:', updateError);
      return res.status(500).json({ error: 'Failed to claim cell', details: updateError.message });
    }

    return res.status(200).json({
      success: true,
      cell: {
        index: body.cellIndex,
        ownerId: body.userId,
        ownerName: body.displayName.trim(),
        claimedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Unexpected error in POST /api/games/[id]/claim:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Main handler
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClaimResponse | ErrorResponse>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Route by method
  switch (req.method) {
    case 'POST':
      return handlePost(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}