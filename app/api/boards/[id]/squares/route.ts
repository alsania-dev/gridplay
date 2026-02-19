import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const purchaseSquaresSchema = z.object({
  squareIds: z.array(z.string()).min(1, 'At least one square must be selected'),
});

const updateSquareSchema = z.object({
  status: z.enum(['available', 'reserved', 'purchased']).optional(),
  ownerId: z.string().nullable().optional(),
});

// GET /api/boards/[id]/squares - Get all squares for a board
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

    const { data: squares, error } = await supabase
      .from('board_squares')
      .select(`
        *,
        owner:users!board_squares_owner_id_fkey(id, email, name)
      `)
      .eq('board_id', id)
      .order('row', { ascending: true })
      .order('col', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Group squares by status
    const available = squares.filter(s => s.status === 'available');
    const reserved = squares.filter(s => s.status === 'reserved');
    const purchased = squares.filter(s => s.status === 'purchased');

    return NextResponse.json({
      squares,
      summary: {
        total: squares.length,
        available: available.length,
        reserved: reserved.length,
        purchased: purchased.length,
      },
    });
  } catch (error) {
    console.error('Error fetching squares:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/boards/[id]/squares - Purchase squares
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = purchaseSquaresSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { squareIds } = result.data;
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

    // Check if board is open for purchases
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('status, price_per_square')
      .eq('id', id)
      .single();

    if (boardError) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    if (board.status !== 'open') {
      return NextResponse.json(
        { error: 'Board is not open for purchases' },
        { status: 400 }
      );
    }

    // Verify all squares are available
    const { data: squares, error: squaresError } = await supabase
      .from('board_squares')
      .select('*')
      .in('id', squareIds)
      .eq('board_id', id);

    if (squaresError) {
      return NextResponse.json({ error: squaresError.message }, { status: 400 });
    }

    const unavailableSquares = squares.filter(s => s.status !== 'available');
    if (unavailableSquares.length > 0) {
      return NextResponse.json(
        { error: 'Some squares are no longer available', unavailableSquares },
        { status: 400 }
      );
    }

    // Reserve squares (will be marked as purchased after payment)
    const { error: updateError } = await supabase
      .from('board_squares')
      .update({
        owner_id: user.id,
        status: 'reserved',
        reserved_at: new Date().toISOString(),
      })
      .in('id', squareIds);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Calculate total price
    const totalPrice = squares.length * board.price_per_square;

    return NextResponse.json({
      message: 'Squares reserved successfully',
      squares: squareIds,
      totalPrice,
      pricePerSquare: board.price_per_square,
      quantity: squares.length,
    });
  } catch (error) {
    console.error('Error purchasing squares:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/boards/[id]/squares - Update square status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateSquareSchema.safeParse(body);

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

    const { squareId, ...updates } = body;

    // Check if user owns the square or is board owner
    const { data: square } = await supabase
      .from('board_squares')
      .select('*, board:boards(created_by)')
      .eq('id', squareId)
      .single();

    if (!square) {
      return NextResponse.json({ error: 'Square not found' }, { status: 404 });
    }

    const isBoardOwner = square.board?.created_by === user.id;
    const isSquareOwner = square.owner_id === user.id;

    if (!isBoardOwner && !isSquareOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update square
    const { data: updatedSquare, error: updateError } = await supabase
      .from('board_squares')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', squareId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      square: updatedSquare,
      message: 'Square updated successfully',
    });
  } catch (error) {
    console.error('Error updating square:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}