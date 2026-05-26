export {
  createCheckoutSession,
  getCheckoutSession,
  constructWebhookEvent,
  createPaymentIntent,
  getPaymentIntent,
  createRefund,
  formatAmount as formatStripeAmount,
} from './stripe';

export {
  createOrder,
  captureOrder,
  getOrder,
  refundPayment,
  verifyWebhookSignature,
  formatAmount as formatPayPalAmount,
} from './paypal';

// Common format amount function
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
