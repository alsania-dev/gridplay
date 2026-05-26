/**
 * PayPal Payment Integration for GridPlay
 */

export interface PayPalOrderData {
  boardId: string;
  squareIds: string[];
  userId: string;
  amount: number;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayPalOrderResponse {
  success: boolean;
  orderId?: string;
  approvalUrl?: string;
  error?: string;
}

export interface PayPalCaptureResponse {
  success: boolean;
  orderId?: string;
  transactionId?: string;
  error?: string;
}

// PayPal API base URL (sandbox or live)
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

/**
 * Get PayPal access token
 */
async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('PayPal credentials not configured');
    return null;
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Failed to get PayPal access token:', data);
      return null;
    }

    return data.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    return null;
  }
}

/**
 * Create a PayPal order
 */
export async function createOrder(data: PayPalOrderData): Promise<PayPalOrderResponse> {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      error: 'Failed to authenticate with PayPal',
    };
  }

  try {
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: data.boardId,
            description: `GridPlay Squares - Board ${data.boardId}`,
            custom_id: data.squareIds.join(','),
            amount: {
              currency_code: 'USD',
              value: data.amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'GridPlay',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: data.returnUrl,
          cancel_url: data.cancelUrl,
        },
      }),
    });

    const orderData = await response.json();

    if (!response.ok) {
      console.error('Failed to create PayPal order:', orderData);
      return {
        success: false,
        error: orderData.message || 'Failed to create order',
      };
    }

    // Find the approval URL
    const approvalUrl = orderData.links?.find(
      (link: { rel: string; href: string }) => link.rel === 'approve'
    )?.href;

    return {
      success: true,
      orderId: orderData.id,
      approvalUrl,
    };
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}

/**
 * Capture payment for an approved order
 */
export async function captureOrder(orderId: string): Promise<PayPalCaptureResponse> {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      error: 'Failed to authenticate with PayPal',
    };
  }

  try {
    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const captureData = await response.json();

    if (!response.ok) {
      console.error('Failed to capture PayPal order:', captureData);
      return {
        success: false,
        error: captureData.message || 'Failed to capture payment',
      };
    }

    const transactionId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    return {
      success: true,
      orderId,
      transactionId,
    };
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture payment',
    };
  }
}

/**
 * Get order details
 */
export async function getOrder(orderId: string) {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      error: 'Failed to authenticate with PayPal',
    };
  }

  try {
    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const orderData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: orderData.message || 'Failed to get order',
      };
    }

    return {
      success: true,
      order: orderData,
    };
  } catch (error) {
    console.error('Error getting PayPal order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get order',
    };
  }
}

/**
 * Refund a captured payment
 */
export async function refundPayment(
  captureId: string,
  amount?: number
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      error: 'Failed to authenticate with PayPal',
    };
  }

  try {
    const body: {
      amount?: { currency_code: string; value: string };
    } = {};
    
    if (amount) {
      body.amount = {
        currency_code: 'USD',
        value: amount.toFixed(2),
      };
    }

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    const refundData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: refundData.message || 'Failed to refund payment',
      };
    }

    return {
      success: true,
      refundId: refundData.id,
    };
  } catch (error) {
    console.error('Error refunding PayPal payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refund payment',
    };
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  headers: Record<string, string>
): boolean {
  // In production, you should verify the webhook signature
  // This is a simplified version
  const transmissionId = headers['paypal-transmission-id'];
  const transmissionTime = headers['paypal-transmission-time'];
  const certUrl = headers['paypal-cert-url'];
  const authAlgo = headers['paypal-auth-algo'];
  const transmissionSig = headers['paypal-transmission-sig'];

  // All required headers should be present
  return !!(transmissionId && transmissionTime && certUrl && authAlgo && transmissionSig);
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
  createOrder,
  captureOrder,
  getOrder,
  refundPayment,
  verifyWebhookSignature,
  formatAmount,
};