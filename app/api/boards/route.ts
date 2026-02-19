import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createBoard,
  createEmptySquares,
  generateBoardNumberGrid,
  calculatePayouts,
  getGridDimensions,
  BoardSize,
  BoardType,
} from '@/app/lib/board';

const createBoardSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').optional(),
  size: z.enum(['5x5', '10x10']),
  type: z.enum(['standard', 'shotgun']).default('standard'),
  pricePerSquare: z.number().min(1, 'Price must be at least $1'),
  homeTeam: z.string().min(1, 'Home team is required'),
  awayTeam: z.string().min(1, 'Away team is required'),
  gameId: z.string().optional(),
  payoutConfig: z.object({
    firstQuarter: z.number().min(0),
    secondQuarter: z.number().min(0),
    thirdQuarter: z.number().min(0),
    final: z.number().min(0),
  }).optional(),
});

// GET /api/boards - List all boards
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors in Server Component context
            }
          },
        },
      }
    );

    let query = supabase
      .from('boards')
      .select(`
        *,
        squares:board_squares(count),
        creator:users!boards_created_by_fkey(id, email, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('created_by', userId);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      boards: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/boards - Create a new board
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createBoardSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors in Server Component context
            }
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { size, type, pricePerSquare, homeTeam, awayTeam, gameId, name, payoutConfig } = result.data;
    const { rows, cols } = getGridDimensions(size as BoardSize);
    const totalPot = pricePerSquare * rows * cols;

    // Generate random numbers for rows and columns
    const { rowNumbers, colNumbers } = generateBoardNumberGrid(size as BoardSize);

    // Calculate payouts
    const payouts = payoutConfig || calculatePayouts(totalPot);

    // Create board
    const boardData = {
      name: name || `${homeTeam} vs ${awayTeam}`,
      size,
      type,
      price_per_square: pricePerSquare,
      home_team: homeTeam,
      away_team: awayTeam,
      game_id: gameId || null,
      row_numbers: rowNumbers,
      col_numbers: colNumbers,
      status: 'open',
      created_by: user.id,
      payout_config: payouts,
    };

    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert(boardData)
      .select()
      .single();

    if (boardError) {
      return NextResponse.json({ error: boardError.message }, { status: 400 });
    }

    // Create squares for the board
    const squaresData = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        squaresData.push({
          board_id: board.id,
          row,
          col,
          row_number: rowNumbers[row],
          col_number: colNumbers[col],
          price: pricePerSquare,
          status: 'available',
        });
      }
    }

    const { error: squaresError } = await supabase
      .from('board_squares')
      .insert(squaresData);

    if (squaresError) {
      // Rollback board creation
      await supabase.from('boards').delete().eq('id', board.id);
      return NextResponse.json({ error: squaresError.message }, { status: 400 });
    }

    return NextResponse.json({
      board,
      message: 'Board created successfully',
    });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}