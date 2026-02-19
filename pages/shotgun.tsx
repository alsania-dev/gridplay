/**
 * GridPlay Shotgun Game Page
 * 
 * Complete Shotgun game implementation with timer and winner display.
 * Uses the ShotgunBoard component for the game board.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { ShotgunBoard } from '../components/ShotgunBoard';
import { useTimer } from '../hooks/useTimer';
import { getGame, joinGame, claimCell, generateScores, calculateWinners } from '../lib/api';
import { THEME_COLORS, GAME_MODES, BOARD_STATES } from '../lib/constants';
import type { Game, CellOwner, BoardConfig, ScoreData } from '../types';

type GameState = 'loading' | 'not_found' | 'setup' | 'playing' | 'completed' | 'error';

// Demo mode data for testing without backend
const DEMO_GAME: Game = {
  id: 'demo-shotgun',
  name: 'Demo Shotgun Game',
  mode: 'shotgun',
  status: 'open',
  config: {
    homeTeam: 'Chiefs',
    awayTeam: '49ers',
    entryFee: 5,
    prizePool: 100,
    payouts: {
      first: 60,
      second: 30,
      third: 10,
    },
    startTime: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function ShotgunPage() {
  const router = useRouter();
  const { id: gameId, demo } = router.query;

  // State
  const [game, setGame] = useState<Game | null>(null);
  const [gameState, setGameState] = useState<GameState>('loading');
  const [error, setError] = useState<string | null>(null);
  
  // User state
  const [displayName, setDisplayName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Game state
  const [claimedCells, setClaimedCells] = useState<Map<number, CellOwner>>(new Map());
  const [scores, setScores] = useState<ScoreData | null>(null);
  const [winners, setWinners] = useState<{ halftime: number | null; final: number | null } | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Timer for game
  const timer = useTimer({
    initialTime: 600, // 10 minutes default
    autoStart: false,
  });

  // Load game data
  useEffect(() => {
    // Demo mode
    if (demo === 'true' || !gameId) {
      setGame(DEMO_GAME);
      
      // Check for stored user info
      const storedUserId = localStorage.getItem('gridplay_user_id');
      const storedName = localStorage.getItem('gridplay_display_name');
      
      if (storedUserId && storedName) {
        setUserId(storedUserId);
        setDisplayName(storedName);
        setGameState('playing');
      } else {
        setGameState('setup');
      }
      
      // Set timer based on game start time
      if (DEMO_GAME.config.startTime) {
        const start = new Date(DEMO_GAME.config.startTime).getTime();
        const now = Date.now();
        const secondsUntilStart = Math.max(0, Math.floor((start - now) / 1000));
        timer.reset(secondsUntilStart);
        timer.start();
      }
      
      return;
    }

    // Real game mode
    if (typeof gameId !== 'string') return;

    const loadGame = async () => {
      try {
        const gameData = await getGame(gameId);
        if (gameData) {
          setGame(gameData);
          
          // Check if user has already joined
          const storedUserId = localStorage.getItem('gridplay_user_id');
          const storedName = localStorage.getItem('gridplay_display_name');
          
          if (storedUserId && storedName) {
            setUserId(storedUserId);
            setDisplayName(storedName);
            setGameState('playing');
          } else {
            setGameState('setup');
          }
          
          // Set timer based on game start time
          const config = gameData.config as BoardConfig;
          if (config.startTime) {
            const start = new Date(config.startTime).getTime();
            const now = Date.now();
            const secondsUntilStart = Math.max(0, Math.floor((start - now) / 1000));
            timer.reset(secondsUntilStart);
            timer.start();
          }
        } else {
          setGameState('not_found');
        }
      } catch (err) {
        console.error('Error loading game:', err);
        setError('Failed to load game. Please try again.');
        setGameState('error');
      }
    };

    loadGame();
  }, [gameId, demo]);

  // Handle join form submission
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Please enter your display name');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // Generate or retrieve user ID
      let newUserId = localStorage.getItem('gridplay_user_id');
      if (!newUserId) {
        newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('gridplay_user_id', newUserId);
      }
      
      localStorage.setItem('gridplay_display_name', displayName.trim());
      
      // Join game if not demo mode
      if (game && game.id !== 'demo-shotgun') {
        await joinGame(game.id, newUserId);
      }
      
      setUserId(newUserId);
      setGameState('playing');
    } catch (err) {
      console.error('Error joining game:', err);
      setError('An error occurred while joining the game.');
    } finally {
      setIsJoining(false);
    }
  };

  // Handle cell claim
  const handleCellClaim = async (index: number) => {
    if (!game || !userId || !displayName) return;

    // Update local state immediately for responsive UI
    setClaimedCells(prev => {
      const next = new Map(prev);
      next.set(index, {
        userId,
        displayName,
        claimedAt: new Date().toISOString(),
      });
      return next;
    });

    // If not demo mode, sync with backend
    if (game.id !== 'demo-shotgun') {
      try {
        await claimCell(game.id, index, userId, displayName);
      } catch (err) {
        console.error('Error claiming cell:', err);
        // Revert on error
        setClaimedCells(prev => {
          const next = new Map(prev);
          next.delete(index);
          return next;
        });
        setError('Failed to claim cell. Please try again.');
      }
    }
  };

  // Handle lock in
  const handleLockIn = async () => {
    if (!game) return;
    
    setIsLocked(true);
    
    // Generate scores
    const scoreData = await generateScores(game.id);
    if (scoreData) {
      setScores(scoreData);
    }
    
    // Calculate winners
    const winnerData = await calculateWinners(game.id);
    if (winnerData) {
      setWinners(winnerData);
    }
    
    setGameState('completed');
  };

  // Handle game start
  const handleGameStart = () => {
    // Game has started, enable interactions
  };

  // Loading state
  if (gameState === 'loading') {
    return (
      <Layout title="Loading... - GridPlay">
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: THEME_COLORS.PRIMARY }}
            />
            <p className="text-[#9CA3AF]">Loading game...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Not found state
  if (gameState === 'not_found') {
    return (
      <Layout title="Game Not Found - GridPlay">
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: THEME_COLORS.TEXT }}
            >
              Game Not Found
            </h1>
            <p className="text-[#9CA3AF] mb-6">
              The shotgun game you're looking for doesn't exist or has ended.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/')}
            >
              Go Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (gameState === 'error') {
    return (
      <Layout title="Error - GridPlay">
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: THEME_COLORS.TEXT }}
            >
              Something Went Wrong
            </h1>
            <p className="text-[#9CA3AF] mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => router.push('/')}
              >
                Go Home
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  setError(null);
                  setGameState('loading');
                  window.location.reload();
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Setup state (user needs to enter name)
  if (gameState === 'setup' && game) {
    const config = game.config as BoardConfig;
    
    return (
      <Layout title={`Join ${game.name} - GridPlay`}>
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Game Info Card */}
          <div 
            className="p-6 rounded-lg border mb-6"
            style={{ 
              backgroundColor: '#1A1A1A',
              borderColor: '#374151',
            }}
          >
            <div className="text-center mb-4">
              <div 
                className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2"
                style={{ 
                  backgroundColor: `${THEME_COLORS.ACCENT}20`,
                  color: THEME_COLORS.ACCENT,
                }}
              >
                SHOTGUN MODE
              </div>
              <h1 
                className="text-2xl font-bold mb-2"
                style={{ color: THEME_COLORS.TEXT }}
              >
                {game.name}
              </h1>
              <p className="text-lg text-white mb-2">
                {config.awayTeam} @ {config.homeTeam}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-[#9CA3AF]">Entry Fee</div>
                <div className="font-bold text-white">${config.entryFee}</div>
              </div>
              <div>
                <div className="text-xs text-[#9CA3AF]">Prize Pool</div>
                <div 
                  className="font-bold"
                  style={{ color: THEME_COLORS.ACCENT }}
                >
                  ${config.prizePool}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#9CA3AF]">Cells</div>
                <div 
                  className="font-bold"
                  style={{ color: THEME_COLORS.PRIMARY }}
                >
                  20
                </div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div 
            className="p-4 rounded-lg border mb-6"
            style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              borderColor: `${THEME_COLORS.PRIMARY}40`,
            }}
          >
            <h3 className="font-bold text-white mb-2">How Shotgun Works:</h3>
            <ul className="text-sm text-[#9CA3AF] space-y-1">
              <li>• 20 cells in 2 rows (Halftime & Final)</li>
              <li>• Claim cells before the game starts</li>
              <li>• Numbers are revealed at game time</li>
              <li>• Match the score digits to win!</li>
            </ul>
          </div>

          {/* Join Form */}
          <form onSubmit={handleJoin}>
            <div 
              className="p-6 rounded-lg border mb-6"
              style={{ 
                backgroundColor: '#1A1A1A',
                borderColor: '#374151',
              }}
            >
              <label 
                htmlFor="displayName"
                className="block text-sm font-medium mb-2"
                style={{ color: THEME_COLORS.TEXT }}
              >
                Your Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full px-4 py-3 rounded-lg border bg-[#0A0A0A] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#10B981]"
                style={{ borderColor: '#374151' }}
              />
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isJoining || !displayName.trim()}
            >
              {isJoining ? 'Joining...' : 'Join Game'}
            </Button>
          </form>
        </div>
      </Layout>
    );
  }

  // Playing or completed state
  if ((gameState === 'playing' || gameState === 'completed') && game) {
    const config = game.config as BoardConfig;
    
    return (
      <Layout title={`${game.name} - GridPlay`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Game Header */}
          <div className="text-center mb-8">
            <div 
              className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2"
              style={{ 
                backgroundColor: `${THEME_COLORS.ACCENT}20`,
                color: THEME_COLORS.ACCENT,
              }}
            >
              SHOTGUN MODE
            </div>
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: THEME_COLORS.TEXT }}
            >
              {game.name}
            </h1>
            <p className="text-lg text-white mb-2">
              {config.awayTeam} @ {config.homeTeam}
            </p>
          </div>

          {/* Game Board */}
          <ShotgunBoard
            boardId={game.id}
            homeTeam={config.homeTeam}
            awayTeam={config.awayTeam}
            startTime={config.startTime ? new Date(config.startTime).getTime() : undefined}
            initialCells={claimedCells}
            onCellClaim={handleCellClaim}
            onGameStart={handleGameStart}
            onLockIn={handleLockIn}
            userId={userId || undefined}
            displayName={displayName}
            demoMode={game.id === 'demo-shotgun'}
          />

          {/* Results (if completed) */}
          {gameState === 'completed' && winners && (
            <div 
              className="mt-8 p-6 rounded-lg border"
              style={{ 
                backgroundColor: '#1A1A1A',
                borderColor: THEME_COLORS.ACCENT,
              }}
            >
              <h2 
                className="text-xl font-bold text-center mb-4"
                style={{ color: THEME_COLORS.ACCENT }}
              >
                🎉 Game Complete!
              </h2>
              
              {scores && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div 
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <div className="text-xs text-[#9CA3AF] mb-1">Halftime Score</div>
                    <div className="text-2xl font-bold text-white">
                      {scores.awayHalftime} - {scores.homeHalftime}
                    </div>
                  </div>
                  <div 
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <div className="text-xs text-[#9CA3AF] mb-1">Final Score</div>
                    <div className="text-2xl font-bold text-white">
                      {scores.awayFinal} - {scores.homeFinal}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/')}
                >
                  Play Another Game
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/50">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return null;
}