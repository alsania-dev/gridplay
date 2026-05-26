import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/app/lib/payments/stripe';

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    // Verify webhook signature
    const { success, event, error } = constructWebhookEvent(payload, signature);

    if (!success || !event) {
      return NextResponse.json({ error }, { status: 400 });
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

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const { boardId, squareIds, userId } = metadata;

        if (!boardId || !squareIds || !userId) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Update squares to purchased
        const { error: updateError } = await supabase
          .from('board_squares')
          .update({
            status: 'purchased',
            purchased_at: new Date().toISOString(),
          })
          .in('id', squareIds.split(','));

        if (updateError) {
          console.error('Error updating squares:', updateError);
          throw updateError;
        }

        // Create transaction record
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            board_id: boardId,
            square_ids: squareIds.split(','),
            amount: (session.amount_total ?? 0) / 100, // Convert from cents
            payment_provider: 'stripe',
            payment_id: session.id,
            status: 'completed',
            created_at: new Date().toISOString(),
          });

        if (transactionError) {
          console.error('Error creating transaction:', transactionError);
        }

        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const { squareIds } = metadata;

        if (squareIds) {
          // Release reserved squares
          await supabase
            .from('board_squares')
            .update({
              status: 'available',
              owner_id: null,
              reserved_at: null,
            })
            .in('id', squareIds.split(','));
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.error('Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}