/**
 * GridPlay Supabase API Functions
 * 
 * Client-side API functions for interacting with Supabase database.
 * Handles games, cells, users, and payments.
 */

import { supabase, createServerClient } from '../utils/supabaseClient';
import type { 
  Database,
  Json,
} from '../types/database';
import type {
  BoardState,
  BoardCell,
  BoardConfig,
  BoardListItem,
  GameMode,
  ApiResponse,
  ClaimCellPayload,
  CreateBoardPayload,
  UserProfile,
  Payment,
  CreatePaymentPayload,
} from '../types';
import { 
  GAME_MODES, 
  GRID_SIZES, 
  BOARD_STATUS,
  DEFAULT_CELL_PRICE_CENTS,
} from './constants';

// ===========================================
// Type aliases for database tables
// ===========================================

type BoardRow = Database['public']['Tables']['boards']['Row'];
type BoardInsert = Database['public']['Tables']['boards']['Insert'];
type BoardUpdate = Database['public']['Tables']['boards']['Update'];

type CellRow = Database['public']['Tables']['cells']['Row'];
type CellInsert = Database['public']['Tables']['cells']['Insert'];

type UserRow = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

type PaymentRow = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];

// ===========================================
// Helper Functions
// ===========================================

/**
 * Convert database board row to BoardState
 */
function dbRowToBoardState(row: BoardRow, cells: CellRow[]): BoardState {
  const config = row.config as unknown as BoardConfig;
  
  return {
    id: row.id,
    name: row.name,
    config,
    status: row.status as BoardState['status'],
    cells: cells.map(dbRowToBoardCell),
    rowScores: row.row_scores || [],
    colScores: row.col_scores || [],
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lockedAt: row.locked_at || undefined,
    completedAt: row.completed_at || undefined,
  };
}

/**
 * Convert database cell row to BoardCell
 */
function dbRowToBoardCell(row: CellRow): BoardCell {
  return {
    row: row.row,
    col: row.col,
    owner: row.owner_id ? {
      userId: row.owner_id,
      displayName: row.owner_name || 'Unknown',
      claimedAt: row.claimed_at || new Date().toISOString(),
    } : null,
    homeScore: null,
    awayScore: null,
    isWinner: row.is_winner,
  };
}

/**
 * Convert database board row to BoardListItem
 */
function dbRowToBoardListItem(row: BoardRow, cells: CellRow[]): BoardListItem {
  const config = row.config as unknown as BoardConfig;
  const totalCells = cells.length;
  const claimedCells = cells.filter(c => c.owner_id !== null).length;
  
  return {
    id: row.id,
    name: row.name,
    mode: row.mode as GameMode,
    status: row.status as BoardListItem['status'],
    pricePerCell: config.pricePerCell || DEFAULT_CELL_PRICE_CENTS,
    homeTeam: config.homeTeam,
    awayTeam: config.awayTeam,
    availableCells: totalCells - claimedCells,
    totalCells,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

// ===========================================
// Game/Board API Functions
// ===========================================

/**
 * Create a new game board
 */
export async function createGame(
  payload: CreateBoardPayload,
  userId: string
): Promise<ApiResponse<BoardState>> {
  try {
    const gridSize = GRID_SIZES[payload.mode as keyof typeof GRID_SIZES];
    
    // Create board config
    const config: BoardConfig = {
      mode: payload.mode,
      pricePerCell: payload.pricePerCell,
      homeTeam: {
        id: payload.homeTeamId,
        name: payload.homeTeamId,
        abbreviation: payload.homeTeamId.substring(0, 3).toUpperCase(),
      },
      awayTeam: {
        id: payload.awayTeamId,
        name: payload.awayTeamId,
        abbreviation: payload.awayTeamId.substring(0, 3).toUpperCase(),
      },
      sport: payload.sport,
      externalGameId: payload.externalGameId,
      gameStartTime: payload.gameStartTime,
    };

    // Insert board
    const boardData: BoardInsert = {
      name: payload.name,
      mode: payload.mode,
      status: BOARD_STATUS.OPEN,
      config: config as unknown as Json,
      created_by: userId,
    };

    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert(boardData)
      .select()
      .single();

    if (boardError || !board) {
      return {
        success: false,
        error: {
          code: 'CREATE_BOARD_ERROR',
          message: boardError?.message || 'Failed to create board',
        },
      };
    }

    // Create cells for the board
    const cellsData: CellInsert[] = [];
    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        cellsData.push({
          board_id: board.id,
          row,
          col,
        });
      }
    }

    const { error: cellsError } = await supabase
      .from('cells')
      .insert(cellsData);

    if (cellsError) {
      // Rollback board creation
      await supabase.from('boards').delete().eq('id', board.id);
      
      return {
        success: false,
        error: {
          code: 'CREATE_CELLS_ERROR',
          message: cellsError.message,
        },
      };
    }

    // Fetch the created board with cells
    return getGame(board.id);
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Get a game by ID
 */
export async function getGame(gameId: string): Promise<ApiResponse<BoardState>> {
  try {
    // Fetch board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', gameId)
      .single();

    if (boardError || !board) {
      return {
        success: false,
        error: {
          code: 'BOARD_NOT_FOUND',
          message: 'Board not found',
        },
      };
    }

    // Fetch cells
    const { data: cells, error: cellsError } = await supabase
      .from('cells')
      .select('*')
      .eq('board_id', gameId)
      .order('row', { ascending: true })
      .order('col', { ascending: true });

    if (cellsError) {
      return {
        success: false,
        error: {
          code: 'FETCH_CELLS_ERROR',
          message: cellsError.message,
        },
      };
    }

    return {
      success: true,
      data: dbRowToBoardState(board, cells || []),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Join a game by ID
 */
export async function joinGame(
  gameId: string,
  userId: string
): Promise<ApiResponse<BoardState>> {
  try {
    // Check if game exists and is open
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', gameId)
      .single();

    if (boardError || !board) {
      return {
        success: false,
        error: {
          code: 'BOARD_NOT_FOUND',
          message: 'Board not found',
        },
      };
    }

    if (board.status !== BOARD_STATUS.OPEN) {
      return {
        success: false,
        error: {
          code: 'BOARD_NOT_OPEN',
          message: 'This board is not open for joining',
        },
      };
    }

    // Return the game state
    return getGame(gameId);
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Claim a cell on a board
 */
export async function claimCell(
  gameId: string,
  row: number,
  col: number,
  userId: string,
  displayName: string
): Promise<ApiResponse<BoardCell>> {
  try {
    // Use the database function to claim the cell
    const { data, error } = await supabase.rpc('claim_cell', {
      p_board_id: gameId,
      p_row: row,
      p_col: col,
      p_user_id: userId,
      p_display_name: displayName,
    });

    if (error) {
      return {
        success: false,
        error: {
          code: 'CLAIM_CELL_ERROR',
          message: error.message,
        },
      };
    }

    // Fetch the updated cell
    const { data: cell, error: cellError } = await supabase
      .from('cells')
      .select('*')
      .eq('board_id', gameId)
      .eq('row', row)
      .eq('col', col)
      .single();

    if (cellError || !cell) {
      return {
        success: false,
        error: {
          code: 'FETCH_CELL_ERROR',
          message: 'Failed to fetch claimed cell',
        },
      };
    }

    return {
      success: true,
      data: dbRowToBoardCell(cell),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Update game scores
 */
export async function updateScore(
  gameId: string,
  rowScores: number[],
  colScores: number[]
): Promise<ApiResponse<BoardState>> {
  try {
    const { error } = await supabase
      .from('boards')
      .update({
        row_scores: rowScores,
        col_scores: colScores,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId);

    if (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_SCORE_ERROR',
          message: error.message,
        },
      };
    }

    return getGame(gameId);
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Lock a game board
 */
export async function lockGame(gameId: string): Promise<ApiResponse<BoardState>> {
  try {
    const { error } = await supabase
      .from('boards')
      .update({
        status: BOARD_STATUS.LOCKED,
        locked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId);

    if (error) {
      return {
        success: false,
        error: {
          code: 'LOCK_BOARD_ERROR',
          message: error.message,
        },
      };
    }

    return getGame(gameId);
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Start a game (set status to in_progress)
 */
export async function startGame(gameId: string): Promise<ApiResponse<BoardState>> {
  try {
    const { error } = await supabase
      .from('boards')
      .update({
        status: BOARD_STATUS.IN_PROGRESS,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId);

    if (error) {
      return {
        success: false,
        error: {
          code: 'START_GAME_ERROR',
          message: error.message,
        },
      };
    }

    return getGame(gameId);
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Complete a game
 */
export async function completeGame(gameId: string): Promise<ApiResponse<BoardState>> {
  try {
    const { error } = await supabase
      .from('boards')
      .update({
        status: BOARD_STATUS.COMPLETED,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId);

    if (error) {
      return {
        success: false,
        error: {
          code: 'COMPLETE_GAME_ERROR',
          message: error.message,
        },
      };
    }

    return getGame(gameId);
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

/**
 * List all open games
 */
export async function listGames(
  status?: string,
  limit: number = 20,
  offset: number = 0
): Promise<ApiResponse<BoardListItem[]>> {
  try {
    let query = supabase
      .from('boards')
      .select('*, cells(count)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: boards, error } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: 'LIST_GAMES_ERROR',
          message: error.message,
        },
      };
    }

    // Fetch cells for each board
    const boardListItems: BoardListItem[] = [];

    for (const board of boards || []) {
      const { data: cells } = await supabase
        .from('cells')
        .select('*')
        .eq('board_id', board.id);

      boardListItems.push(dbRowToBoardListItem(board, cells || []));
    }

    return {
      success: true,
      data: boardListItems,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Generate random scores for a board
 */
export async function generateScores(gameId: string): Promise<ApiResponse<{ rowScores: number[]; colScores: number[] }>> {
  try {
    const { data, error } = await supabase.rpc('generate_scores', {
      p_board_id: gameId,
    });

    if (error) {
      return {
        success: false,
        error: {
          code: 'GENERATE_SCORES_ERROR',
          message: error.message,
        },
      };
    }

    return {
      success: true,
      data: {
        rowScores: data?.row_scores || [],
        colScores: data?.col_scores || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Calculate winners for a game
 */
export async function calculateWinners(
  gameId: string,
  homeScore: number,
  awayScore: number
): Promise<ApiResponse<BoardCell[]>> {
  try {
    const { data, error } = await supabase.rpc('calculate_winners', {
      p_board_id: gameId,
      p_home_score: homeScore,
      p_away_score: awayScore,
    });

    if (error) {
      return {
        success: false,
        error: {
          code: 'CALCULATE_WINNERS_ERROR',
          message: error.message,
        },
      };
    }

    // Fetch winning cells
    const { data: cells, error: cellsError } = await supabase
      .from('cells')
      .select('*')
      .eq('board_id', gameId)
      .eq('is_winner', true);

    if (cellsError) {
      return {
        success: false,
        error: {
          code: 'FETCH_WINNERS_ERROR',
          message: cellsError.message,
        },
      };
    }

    return {
      success: true,
      data: (cells || []).map(dbRowToBoardCell),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

// ===========================================
// User API Functions
// ===========================================

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      };
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url || undefined,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Create or update user profile
 */
export async function upsertUserProfile(
  userId: string,
  email: string,
  displayName: string,
  avatarUrl?: string
): Promise<ApiResponse<UserProfile>> {
  try {
    const userData: UserInsert = {
      id: userId,
      email,
      display_name: displayName,
      avatar_url: avatarUrl || null,
    };

    const { data: user, error } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .select()
      .single();

    if (error || !user) {
      return {
        success: false,
        error: {
          code: 'UPSERT_USER_ERROR',
          message: error?.message || 'Failed to create/update user',
        },
      };
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url || undefined,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

// ===========================================
// Payment API Functions
// ===========================================

/**
 * Create a payment
 */
export async function createPayment(
  payload: CreatePaymentPayload,
  userId: string
): Promise<ApiResponse<Payment>> {
  try {
    const paymentData: PaymentInsert = {
      user_id: userId,
      board_id: payload.boardId,
      amount: payload.cells.length * 100, // $1 per cell for now
      currency: 'USD',
      status: 'pending',
      provider: payload.provider,
      cells: payload.cells as unknown as Json,
    };

    const { data: payment, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error || !payment) {
      return {
        success: false,
        error: {
          code: 'CREATE_PAYMENT_ERROR',
          message: error?.message || 'Failed to create payment',
        },
      };
    }

    return {
      success: true,
      data: {
        id: payment.id,
        userId: payment.user_id,
        boardId: payment.board_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status as Payment['status'],
        provider: payment.provider as Payment['provider'],
        providerPaymentId: payment.provider_payment_id || undefined,
        cells: payment.cells as Payment['cells'],
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: Payment['status'],
  providerPaymentId?: string
): Promise<ApiResponse<Payment>> {
  try {
    const updateData: Partial<PaymentRow> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (providerPaymentId) {
      updateData.provider_payment_id = providerPaymentId;
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error || !payment) {
      return {
        success: false,
        error: {
          code: 'UPDATE_PAYMENT_ERROR',
          message: error?.message || 'Failed to update payment',
        },
      };
    }

    return {
      success: true,
      data: {
        id: payment.id,
        userId: payment.user_id,
        boardId: payment.board_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status as Payment['status'],
        provider: payment.provider as Payment['provider'],
        providerPaymentId: payment.provider_payment_id || undefined,
        cells: payment.cells as Payment['cells'],
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}

// ===========================================
// Server-side API Functions
// ===========================================

/**
 * Server-side function to get game data
 */
export async function getGameServer(gameId: string): Promise<ApiResponse<BoardState>> {
  try {
    const serverClient = createServerClient();
    
    const { data: board, error: boardError } = await serverClient
      .from('boards')
      .select('*')
      .eq('id', gameId)
      .single();

    if (boardError || !board) {
      return {
        success: false,
        error: {
          code: 'BOARD_NOT_FOUND',
          message: 'Board not found',
        },
      };
    }

    const { data: cells, error: cellsError } = await serverClient
      .from('cells')
      .select('*')
      .eq('board_id', gameId);

    if (cellsError) {
      return {
        success: false,
        error: {
          code: 'FETCH_CELLS_ERROR',
          message: cellsError.message,
        },
      };
    }

    return {
      success: true,
      data: dbRowToBoardState(board, cells || []),
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
  }
}