/**
 * Stripe Payment Integration for GridPlay
 */

import Stripe from 'stripe';

// Lazy-initialize Stripe to avoid build-time errors
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return stripe;
}

export interface CheckoutSessionData {
  boardId: string;
  squareIds: string[];
  userId: string;
  userEmail: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentResult {
  success: boolean;
  sessionId?: string;
  paymentIntentId?: string;
  error?: string;
}

/**
 * Create a Stripe checkout session for square purchase
 */
export async function createCheckoutSession(data: CheckoutSessionData): Promise<PaymentResult> {
  try {
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: data.userEmail,
      metadata: {
        boardId: data.boardId,
        squareIds: data.squareIds.join(','),
        userId: data.userId,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `GridPlay Squares - Board ${data.boardId}`,
              description: `${data.squareIds.length} square(s) purchased`,
            },
            unit_amount: Math.round(data.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
    });

    return {
      success: true,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    };
  }
}

/**
 * Retrieve a checkout session
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    return {
      success: true,
      session,
    };
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve session',
    };
  }
}

/**
 * Construct webhook event from raw body
 */
export function constructWebhookEvent(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  try {
    const event = Stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return {
      success: true,
      event,
    };
  } catch (error) {
    console.error('Error constructing webhook event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid webhook signature',
    };
  }
}

/**
 * Create a payment intent for direct payment
 */
export async function createPaymentIntent(
  amount: number,
  metadata: Record<string, string>
): Promise<PaymentResult> {
  try {
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment intent',
    };
  }
}

/**
 * Retrieve a payment intent
 */
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve payment intent',
    };
  }
}

/**
 * Create a refund
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number
): Promise<PaymentResult> {
  try {
    const refund = await getStripe().refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return {
      success: true,
      paymentIntentId: refund.id,
    };
  } catch (error) {
    console.error('Error creating refund:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create refund',
    };
  }
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default {
  createCheckoutSession,
  getCheckoutSession,
  constructWebhookEvent,
  createPaymentIntent,
  getPaymentIntent,
  createRefund,
  formatAmount,
};