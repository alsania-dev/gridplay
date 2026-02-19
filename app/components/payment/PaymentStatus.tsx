'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/app/components/ui/Card';

type PaymentStatus = 'loading' | 'success' | 'error';

interface PaymentStatusProps {
  boardId?: string;
}

export function PaymentStatus({ boardId: propBoardId }: PaymentStatusProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState<string>('');

  const boardId = propBoardId || searchParams.get('boardId');
  const sessionId = searchParams.get('session_id');
  const paymentProvider = searchParams.get('provider') || 'stripe';

  useEffect(() => {
    const verifyPayment = async () => {
      if (!boardId) {
        setStatus('error');
        setMessage('Missing board information');
        return;
      }

      // If we have a session ID, verify the payment was successful
      if (sessionId && paymentProvider === 'stripe') {
        try {
          const response = await fetch(`/api/payments/verify?sessionId=${sessionId}`);
          const data = await response.json();

          if (data.success) {
            setStatus('success');
            setMessage('Your payment has been processed successfully!');
          } else {
            setStatus('error');
            setMessage(data.error || 'Payment verification failed');
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
          setStatus('error');
          setMessage('Failed to verify payment status');
        }
      } else {
        // For PayPal or direct success redirect
        setStatus('success');
        setMessage('Your payment has been processed successfully!');
      }
    };

    verifyPayment();
  }, [boardId, sessionId, paymentProvider]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-muted">Verifying payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'success' ? 'Payment Successful!' : 'Payment Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center">
          <div className={`
            w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center
            ${status === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}
          `}>
            {status === 'success' ? (
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <p className={`
            ${status === 'success' ? 'text-green-500' : 'text-red-500'}
          `}>
            {message}
          </p>

          {status === 'success' && (
            <p className="text-sm text-muted mt-2">
              You will receive a confirmation email shortly.
            </p>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-3">
          {boardId && (
            <Link href={`/board/${boardId}`} className="w-full">
              <Button className="w-full" variant="primary">
                View Board
              </Button>
            </Link>
          )}
          <Link href="/dashboard" className="w-full">
            <Button className="w-full" variant="outline">
              Go to Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default PaymentStatus;