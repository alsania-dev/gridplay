'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/app/components/ui/Card';
import { BoardGrid } from '@/app/components/board/BoardGrid';
import { BoardHeader } from '@/app/components/board/BoardHeader';
import { useAuth } from '@/app/lib/auth/authContext';
import { getPayoutBreakdown } from '@/app/lib/board/payoutCalculator';
import { getBoardCompletionPercentage } from '@/app/lib/board/boardUtils';

interface Square {
  id: string;
  row: number;
  col: number;
  row_number: number;
  col_number: number;
  status: 'available' | 'reserved' | 'purchased';
  price: number;
  owner_id: string | null;
  owner?: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface Board {
  id: string;
  name: string;
  size: '5x5' | '10x10';
  type: 'standard' | 'shotgun';
  status: 'draft' | 'open' | 'locked' | 'completed';
  price_per_square: number;
  home_team: string;
  away_team: string;
  row_numbers: number[];
  col_numbers: number[];
  payout_config: {
    firstQuarter: number;
    secondQuarter: number;
    thirdQuarter: number;
    final: number;
    total: number;
  };
  created_at: string;
  creator?: {
    id: string;
    email: string;
    name: string | null;
  };
  squares: Square[];
  scores?: Array<{
    quarter: string;
    home_score: number;
    away_score: number;
  }>;
}

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSquares, setSelectedSquares] = useState<string[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const fetchBoard = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/boards/${boardId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch board');
      }

      const data = await response.json();
      setBoard(data.board);
    } catch (err) {
      console.error('Error fetching board:', err);
      setError('Failed to load board');
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleSquareSelect = (squareId: string) => {
    if (!board || board.status !== 'open') return;

    setSelectedSquares(prev => {
      if (prev.includes(squareId)) {
        return prev.filter(id => id !== squareId);
      }
      // Limit selection to 10 squares
      if (prev.length >= 10) {
        return prev;
      }
      return [...prev, squareId];
    });
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/board/${boardId}`);
      return;
    }

    if (selectedSquares.length === 0) return;

    setIsPurchasing(true);

    try {
      const response = await fetch(`/api/boards/${boardId}/squares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ squareIds: selectedSquares }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase squares');
      }

      // Redirect to payment
      router.push(`/payment?boardId=${boardId}&squares=${selectedSquares.join(',')}`);
    } catch (err) {
      console.error('Error purchasing squares:', err);
      setError('Failed to reserve squares');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-500 mb-4">{error || 'Board not found'}</p>
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionPercentage = getBoardCompletionPercentage(
    board.squares.map(s => ({
      id: s.id,
      boardId: board.id,
      row: s.row,
      col: s.col,
      rowNumber: s.row_number,
      colNumber: s.col_number,
      ownerId: s.owner_id,
      ownerName: s.owner?.name ?? undefined,
      ownerEmail: s.owner?.email ?? undefined,
      purchasedAt: null,
      price: s.price,
      status: s.status as 'available' | 'reserved' | 'purchased'
    }))
  );
  const payoutBreakdown = getPayoutBreakdown(board.payout_config);
  const totalPrice = selectedSquares.length * board.price_per_square;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <BoardHeader
          homeTeam={board.home_team}
          awayTeam={board.away_team}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          {/* Board Info Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Board Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted">Board Type</p>
                  <p className="font-medium capitalize">{board.type} ({board.size})</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Price per Square</p>
                  <p className="font-medium">${board.price_per_square.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Total Pot</p>
                  <p className="font-medium text-primary-500">${board.payout_config.total.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Created By</p>
                  <p className="font-medium">{board.creator?.name || board.creator?.email || 'Unknown'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {payoutBreakdown.map(({ quarter, amount, percentage }) => (
                    <div key={quarter} className="flex justify-between items-center">
                      <span className="text-sm text-muted">{quarter}</span>
                      <div className="text-right">
                        <span className="font-medium">${amount.toFixed(2)}</span>
                        <span className="text-xs text-muted ml-1">({percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selection Summary */}
            {board.status === 'open' && (
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Your Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted">Selected Squares</span>
                      <span className="font-medium">{selectedSquares.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Total Price</span>
                      <span className="font-medium text-primary-500">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button
                    className="w-full"
                    onClick={handlePurchase}
                    disabled={selectedSquares.length === 0 || isPurchasing}
                    isLoading={isPurchasing}
                  >
                    {isAuthenticated ? 'Purchase Squares' : 'Sign In to Purchase'}
                  </Button>
                  <p className="text-xs text-muted text-center">
                    Max 10 squares per user
                  </p>
                </CardFooter>
              </Card>
            )}
          </div>

          {/* Board Grid */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-4 overflow-x-auto">
                <BoardGrid
                  size={board.size === '5x5' ? 5 : 10}
                  rowNumbers={board.row_numbers}
                  colNumbers={board.col_numbers}
                  squares={board.squares.map(s => ({
                    row: s.row,
                    col: s.col,
                    owner: s.owner?.name || s.owner?.email || undefined,
                  }))}
                  homeTeam={board.home_team}
                  awayTeam={board.away_team}
                  onSquareClick={board.status === 'open' ? (row, col) => {
                    const square = board.squares.find(s => s.row === row && s.col === col);
                    if (square && square.status === 'available') {
                      handleSquareSelect(square.id);
                    }
                  } : undefined}
                />
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-surface border border-border rounded"></div>
                <span className="text-sm text-muted">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary-500/20 border border-primary-500 rounded"></div>
                <span className="text-sm text-muted">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500 rounded"></div>
                <span className="text-sm text-muted">Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500/20 border border-green-500 rounded"></div>
                <span className="text-sm text-muted">Purchased</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}