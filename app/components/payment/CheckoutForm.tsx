'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/app/components/ui/Card';

interface CheckoutFormProps {
  boardId: string;
  squareIds: string[];
  amount: number;
  pricePerSquare: number;
  quantity: number;
}

export function CheckoutForm({
  boardId,
  squareIds,
  amount,
  pricePerSquare,
  quantity,
}: CheckoutFormProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId,
          squareIds,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to payment page
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Purchase</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Squares</span>
              <span>{quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Price per Square</span>
              <span>${pricePerSquare.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span className="text-primary-500">${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div>
          <h3 className="font-medium mb-3">Payment Method</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('stripe')}
              className={`
                p-4 border rounded-lg flex flex-col items-center gap-2 transition-all
                ${paymentMethod === 'stripe'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-border hover:border-primary-500/50'
                }
              `}
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
              </svg>
              <span className="text-sm font-medium">Credit Card</span>
            </button>
            
            <button
              type="button"
              onClick={() => setPaymentMethod('paypal')}
              className={`
                p-4 border rounded-lg flex flex-col items-center gap-2 transition-all
                ${paymentMethod === 'paypal'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-border hover:border-primary-500/50'
                }
              `}
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#003087">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
              </svg>
              <span className="text-sm font-medium">PayPal</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-3">
        <Button
          className="w-full"
          onClick={handleCheckout}
          isLoading={isLoading}
          disabled={isLoading}
        >
          Pay ${amount.toFixed(2)} with {paymentMethod === 'stripe' ? 'Card' : 'PayPal'}
        </Button>
        
        <p className="text-xs text-muted text-center">
          By completing this purchase, you agree to our Terms of Service
        </p>
      </CardFooter>
    </Card>
  );
}

export default CheckoutForm;