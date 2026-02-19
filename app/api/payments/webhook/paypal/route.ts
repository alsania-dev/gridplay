import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { captureOrder, getOrder } from '@/app/lib/payments/paypal';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());

    // Verify webhook signature (simplified - in production, use proper verification)
    const eventType = body.event_type;
    const resource = body.resource;

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
    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED': {
        // Capture the payment
        const orderId = resource.id;
        const captureResult = await captureOrder(orderId);

        if (!captureResult.success) {
          console.error('Failed to capture PayPal order:', captureResult.error);
          break;
        }

        // Get order details to retrieve metadata
        const orderResult = await getOrder(orderId);
        
        if (!orderResult.success || !orderResult.order) {
          console.error('Failed to get PayPal order details');
          break;
        }

        const purchaseUnit = orderResult.order.purchase_units?.[0];
        const boardId = purchaseUnit?.reference_id;
        const squareIds = purchaseUnit?.custom_id?.split(',') || [];

        if (!boardId || squareIds.length === 0) {
          console.error('Missing metadata in PayPal order');
          break;
        }

        // Get the user who reserved these squares
        const { data: squares } = await supabase
          .from('board_squares')
          .select('owner_id')
          .in('id', squareIds)
          .limit(1)
          .single();

        const userId = squares?.owner_id;

        if (!userId) {
          console.error('Could not find owner for squares');
          break;
        }

        // Update squares to purchased
        const { error: updateError } = await supabase
          .from('board_squares')
          .update({
            status: 'purchased',
            purchased_at: new Date().toISOString(),
          })
          .in('id', squareIds);

        if (updateError) {
          console.error('Error updating squares:', updateError);
          throw updateError;
        }

        // Create transaction record
        const amount = parseFloat(purchaseUnit?.amount?.value || '0');
        
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            board_id: boardId,
            square_ids: squareIds,
            amount,
            payment_provider: 'paypal',
            payment_id: captureResult.transactionId || orderId,
            status: 'completed',
            created_at: new Date().toISOString(),
          });

        if (transactionError) {
          console.error('Error creating transaction:', transactionError);
        }

        break;
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED': {
        const captureId = resource.id;
        
        // Find and update the transaction
        const { data: transaction } = await supabase
          .from('transactions')
          .select('*')
          .eq('payment_id', captureId)
          .single();

        if (transaction) {
          // Update transaction status
          await supabase
            .from('transactions')
            .update({ status: 'refunded' })
            .eq('id', transaction.id);

          // Release squares
          await supabase
            .from('board_squares')
            .update({
              status: 'available',
              owner_id: null,
              purchased_at: null,
            })
            .in('id', transaction.square_ids);
        }

        break;
      }

      case 'CHECKOUT.ORDER.VOIDED': {
        // Order was cancelled
        const orderId = resource.id;
        const orderResult = await getOrder(orderId);
        
        if (orderResult.success && orderResult.order) {
          const squareIds = orderResult.order.purchase_units?.[0]?.custom_id?.split(',');
          
          if (squareIds && squareIds.length > 0) {
            // Release reserved squares
            await supabase
              .from('board_squares')
              .update({
                status: 'available',
                owner_id: null,
                reserved_at: null,
              })
              .in('id', squareIds);
          }
        }

        break;
      }

      default:
        console.log(`Unhandled PayPal event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}