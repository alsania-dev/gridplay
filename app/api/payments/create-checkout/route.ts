import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckoutSession } from '@/app/lib/payments/stripe';
import { createOrder } from '@/app/lib/payments/paypal';

const checkoutSchema = z.object({
  boardId: z.string(),
  squareIds: z.array(z.string()).min(1),
  paymentMethod: z.enum(['stripe', 'paypal']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { boardId, squareIds, paymentMethod } = result.data;
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

    // Verify board and squares
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id, price_per_square, status')
      .eq('id', boardId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    if (board.status !== 'open') {
      return NextResponse.json({ error: 'Board is not open for purchases' }, { status: 400 });
    }

    // Verify squares are reserved by this user
    const { data: squares, error: squaresError } = await supabase
      .from('board_squares')
      .select('*')
      .in('id', squareIds)
      .eq('board_id', boardId);

    if (squaresError) {
      return NextResponse.json({ error: squaresError.message }, { status: 400 });
    }

    const invalidSquares = squares.filter(s => 
      s.status !== 'reserved' || s.owner_id !== user.id
    );

    if (invalidSquares.length > 0) {
      return NextResponse.json(
        { error: 'Some squares are not reserved for you' },
        { status: 400 }
      );
    }

    const amount = squares.length * board.price_per_square;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (paymentMethod === 'stripe') {
      const checkoutResult = await createCheckoutSession({
        boardId,
        squareIds,
        userId: user.id,
        userEmail: user.email || '',
        amount,
        successUrl: `${baseUrl}/payment/success?boardId=${boardId}`,
        cancelUrl: `${baseUrl}/board/${boardId}?cancelled=true`,
      });

      if (!checkoutResult.success) {
        return NextResponse.json(
          { error: checkoutResult.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        sessionId: checkoutResult.sessionId,
        url: `https://checkout.stripe.com/pay/${checkoutResult.sessionId}`,
      });
    } else if (paymentMethod === 'paypal') {
      const orderResult = await createOrder({
        boardId,
        squareIds,
        userId: user.id,
        amount,
        returnUrl: `${baseUrl}/payment/success?boardId=${boardId}&provider=paypal`,
        cancelUrl: `${baseUrl}/board/${boardId}?cancelled=true`,
      });

      if (!orderResult.success) {
        return NextResponse.json(
          { error: orderResult.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        orderId: orderResult.orderId,
        url: orderResult.approvalUrl,
      });
    }

    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}