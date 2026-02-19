import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET /api/boards/[id] - Get a single board
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

    // Get board with squares and creator info
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select(`
        *,
        creator:users!boards_created_by_fkey(id, email, name)
      `)
      .eq('id', id)
      .single();

    if (boardError) {
      return NextResponse.json({ error: boardError.message }, { status: 404 });
    }

    // Get squares with owner info
    const { data: squares, error: squaresError } = await supabase
      .from('board_squares')
      .select(`
        *,
        owner:users!board_squares_owner_id_fkey(id, email, name)
      `)
      .eq('board_id', id)
      .order('row', { ascending: true })
      .order('col', { ascending: true });

    if (squaresError) {
      return NextResponse.json({ error: squaresError.message }, { status: 400 });
    }

    // Get game scores if available
    const { data: scores } = await supabase
      .from('game_scores')
      .select('*')
      .eq('board_id', id)
      .order('quarter', { ascending: true });

    return NextResponse.json({
      board: {
        ...board,
        squares,
        scores: scores || [],
      },
    });
  } catch (error) {
    console.error('Error fetching board:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/boards/[id] - Update a board
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
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

    // Check if user owns the board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('created_by, status')
      .eq('id', id)
      .single();

    if (boardError) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    if (board.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update board
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name) updateData.name = body.name;
    if (body.status) updateData.status = body.status;
    if (body.payoutConfig) updateData.payout_config = body.payoutConfig;

    const { data: updatedBoard, error: updateError } = await supabase
      .from('boards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      board: updatedBoard,
      message: 'Board updated successfully',
    });
  } catch (error) {
    console.error('Error updating board:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/boards/[id] - Delete a board
export async function DELETE(
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

    // Check if user owns the board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('created_by, status')
      .eq('id', id)
      .single();

    if (boardError) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    if (board.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow deletion of draft boards
    if (board.status !== 'draft' && board.status !== 'open') {
      return NextResponse.json(
        { error: 'Cannot delete a board that is locked or completed' },
        { status: 400 }
      );
    }

    // Delete squares first
    await supabase.from('board_squares').delete().eq('board_id', id);

    // Delete board
    const { error: deleteError } = await supabase
      .from('boards')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Board deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}