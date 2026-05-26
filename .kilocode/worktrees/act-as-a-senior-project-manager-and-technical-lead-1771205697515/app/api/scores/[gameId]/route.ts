import { NextResponse } from 'next/server';
import { getGame, getLiveScores } from '@/app/lib/scores';

// GET /api/scores/[gameId] - Get scores for a specific game
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const { searchParams } = new URL(request.url);
    const sport = (searchParams.get('sport') || 'nfl') as 'nfl' | 'college-football';

    const result = await getGame(gameId, sport);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ game: result.data });
  } catch (error) {
    console.error('Error fetching game scores:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}