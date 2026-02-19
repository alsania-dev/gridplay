import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/users/[id]/boards - Get user's boards
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Only allow users to access their own boards
    if (user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get boards where user has squares
    const { data: squares, error: squaresError } = await supabase
      .from('board_squares')
      .select(`
        board_id,
        boards (
          id,
          name,
          size,
          status,
          home_team,
          away_team,
          price_per_square,
          created_at
        )
      `)
      .eq('owner_id', id)
      .eq('status', 'purchased');

    if (squaresError) {
      return NextResponse.json({ error: squaresError.message }, { status: 400 });
    }

    // Group by board and count squares
    const boardMap = new Map<string, {
      id: string;
      name: string;
      size: string;
      status: string;
      home_team: string;
      away_team: string;
      price_per_square: number;
      created_at: string;
      squares_count: number;
    }>();

    squares?.forEach((square) => {
      if (!square.boards) return;
      
      const boardId = square.board_id;
      const board = square.boards as unknown as { id: string; name: string; size: string; status: string; home_team: string; away_team: string; price_per_square: number; created_at: string };
      if (boardMap.has(boardId)) {
        boardMap.get(boardId)!.squares_count += 1;
      } else {
        boardMap.set(boardId, {
          id: board.id,
          name: board.name,
          size: board.size,
          status: board.status,
          home_team: board.home_team,
          away_team: board.away_team,
          price_per_square: board.price_per_square,
          created_at: board.created_at,
          squares_count: 1,
        });
      }
    });

    // Also get boards created by user
    const { data: createdBoards, error: createdError } = await supabase
      .from('boards')
      .select('*')
      .eq('created_by', id);

    if (createdError) {
      console.error('Error fetching created boards:', createdError);
    }

    // Add created boards that aren't already in the map
    createdBoards?.forEach(board => {
      if (!boardMap.has(board.id)) {
        boardMap.set(board.id, {
          id: board.id,
          name: board.name,
          size: board.size,
          status: board.status,
          home_team: board.home_team,
          away_team: board.away_team,
          price_per_square: board.price_per_square,
          created_at: board.created_at,
          squares_count: 0,
        });
      }
    });

    const boards = Array.from(boardMap.values());

    return NextResponse.json({ boards });
  } catch (error) {
    console.error('Error fetching user boards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}