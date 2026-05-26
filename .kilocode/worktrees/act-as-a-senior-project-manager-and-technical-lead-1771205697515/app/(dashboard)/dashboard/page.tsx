'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/Card';
import { useAuth } from '@/app/lib/auth/authContext';

interface UserBoard {
  id: string;
  name: string;
  size: string;
  status: string;
  home_team: string;
  away_team: string;
  price_per_square: number;
  created_at: string;
  squares_count: number;
}

interface UserStats {
  totalBoards: number;
  totalSquares: number;
  totalWinnings: number;
  activeBoards: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [boards, setBoards] = useState<UserBoard[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalBoards: 0,
    totalSquares: 0,
    totalWinnings: 0,
    activeBoards: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch user's boards
        const boardsResponse = await fetch(`/api/users/${user.id}/boards`);
        const boardsData = await boardsResponse.json();

        if (boardsResponse.ok) {
          setBoards(boardsData.boards || []);
        }

        // Fetch user stats
        const statsResponse = await fetch(`/api/users/${user.id}/stats`);
        const statsData = await statsResponse.json();

        if (statsResponse.ok) {
          setStats(statsData.stats || stats);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted mt-1">Welcome back, {user?.email}</p>
          </div>
          <Link href="/board/create">
            <Button>Create New Board</Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-500">{stats.totalBoards}</p>
                <p className="text-sm text-muted mt-1">Total Boards</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-500">{stats.totalSquares}</p>
                <p className="text-sm text-muted mt-1">Squares Owned</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">${stats.totalWinnings.toFixed(2)}</p>
                <p className="text-sm text-muted mt-1">Total Winnings</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-500">{stats.activeBoards}</p>
                <p className="text-sm text-muted mt-1">Active Boards</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Boards Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Boards</CardTitle>
          </CardHeader>
          <CardContent>
            {boards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted mb-4">You haven't joined any boards yet</p>
                <Link href="/">
                  <Button variant="outline">Browse Boards</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted">Board</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted">Teams</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted">Size</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted">Squares</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boards.map((board) => (
                      <tr key={board.id} className="border-b border-border hover:bg-surface/50">
                        <td className="py-3 px-4">
                          <span className="font-medium">{board.name}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted">
                          {board.away_team} @ {board.home_team}
                        </td>
                        <td className="py-3 px-4 text-sm">{board.size}</td>
                        <td className="py-3 px-4 text-sm">{board.squares_count}</td>
                        <td className="py-3 px-4">
                          <span className={`
                            px-2 py-1 rounded text-xs font-medium
                            ${board.status === 'open' ? 'bg-green-500/20 text-green-500' : ''}
                            ${board.status === 'locked' ? 'bg-yellow-500/20 text-yellow-500' : ''}
                            ${board.status === 'completed' ? 'bg-blue-500/20 text-blue-500' : ''}
                            ${board.status === 'draft' ? 'bg-gray-500/20 text-gray-500' : ''}
                          `}>
                            {board.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/board/${board.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}