import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/users/[id]/stats - Get user statistics
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

    // Only allow users to access their own stats
    if (user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get total squares owned
    const { count: totalSquares, error: squaresError } = await supabase
      .from('board_squares')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', id)
      .eq('status', 'purchased');

    if (squaresError) {
      console.error('Error counting squares:', squaresError);
    }

    // Get boards count
    const { data: boardsData, error: boardsError } = await supabase
      .from('board_squares')
      .select('board_id')
      .eq('owner_id', id)
      .eq('status', 'purchased');

    if (boardsError) {
      console.error('Error fetching boards:', boardsError);
    }

    const uniqueBoards = new Set(boardsData?.map(s => s.board_id) || []);

    // Get active boards count
    const { count: activeBoards, error: activeError } = await supabase
      .from('boards')
      .select('*', { count: 'exact', head: true })
      .in('id', Array.from(uniqueBoards))
      .eq('status', 'open');

    if (activeError) {
      console.error('Error counting active boards:', activeError);
    }

    // Get total winnings from transactions
    const { data: winnings, error: winningsError } = await supabase
      .from('winner_payouts')
      .select('amount')
      .eq('user_id', id)
      .eq('status', 'paid');

    if (winningsError) {
      console.error('Error fetching winnings:', winningsError);
    }

    const totalWinnings = winnings?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

    // Get boards created
    const { count: boardsCreated, error: createdError } = await supabase
      .from('boards')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', id);

    if (createdError) {
      console.error('Error counting created boards:', createdError);
    }

    const stats = {
      totalBoards: uniqueBoards.size + (boardsCreated || 0),
      totalSquares: totalSquares || 0,
      totalWinnings,
      activeBoards: activeBoards || 0,
      boardsCreated: boardsCreated || 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}