/**
 * GridPlay Join Board Page
 * 
 * Join a game board by code/link, view game details,
 * pay entry fee with tokens, and select/claim available cells.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { WalletStatus, useWallet } from '../components/WalletConnector';
import { TokenPayment } from '../components/TokenPayment';
import { GameBoard } from '../components/GameBoard';
import { ShotgunBoard } from '../components/ShotgunBoard';
import { getGame, joinGame, claimCell } from '../lib/api';
import { GAME_MODES, THEME_COLORS, BOARD_STATUS } from '../lib/constants';
import { TOKEN_METADATA, type TokenSymbol } from '../lib/tokens';
import type { Game, GameMode, CellOwner, BoardConfig } from '../types';

type JoinState = 'loading' | 'not_found' | 'join_form' | 'payment' | 'board_view' | 'error';

// Escrow/Game contract address
const GAME_CONTRACT_ADDRESS = '0x9c9B69d52b195241b5EfBAD43d368567a59d8C53';

export default function JoinBoard() {
  const router = useRouter();
  const { id: boardId } = router.query;
  const { isConnected, isCorrectNetwork, formattedBalances } = useWallet();

  // State
  const [game, setGame] = useState<Game | null>(null);
  const [state, setState] = useState<JoinState>('loading');
  const [error, setError] = useState<string | null>(null);
  
  // User info for joining
  const [displayName, setDisplayName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  
  // Payment state
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentTxHash, setPaymentTxHash] = useState<string | null>(null);
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<TokenSymbol>('ALSA');
  
  // Cell selection
  const [selectedCells, setSelectedCells] = useState<Set<number>>(new Set());
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedCells, setClaimedCells] = useState<Map<number, CellOwner>>(new Map());

  // Load game data
  useEffect(() => {
    if (!boardId || typeof boardId !== 'string') return;

    const loadGame = async () => {
      try {
        const result = await getGame(boardId);
        if (result.success && result.data) {
          const gameData = result.data;
          setGame(gameData);
          
          // Get token symbol from game config or default to ALSA
          const config = gameData.config as BoardConfig;
          if (config.tokenSymbol) {
            setSelectedTokenSymbol(config.tokenSymbol as TokenSymbol);
          }
          
          // Check if user has already joined
          const storedUserId = localStorage.getItem('gridplay_user_id');
          const storedName = localStorage.getItem('gridplay_display_name');
          
          if (storedUserId && storedName) {
            setUserId(storedUserId);
            setDisplayName(storedName);
            // Check if user has paid
            const hasPaid = localStorage.getItem(`paid_${boardId}_${storedUserId}`);
            if (hasPaid === 'true') {
              setPaymentComplete(true);
              setState('board_view');
            } else {
              setState('payment');
            }
          } else {
            setState('join_form');
          }
        } else {
          setState('not_found');
        }
      } catch (err) {
        console.error('Error loading game:', err);
        setError('Failed to load game. Please try again.');
        setState('error');
      }
    };

    loadGame();
  }, [boardId]);

  // Get game mode configuration
  const gameModeConfig = useMemo(() => {
    if (!game) return null;
    return GAME_MODES[game.mode];
  }, [game]);

  // Get entry fee from game config
  const entryFee = useMemo(() => {
    if (!game) return 0;
    const config = game.config as BoardConfig;
    return config.entryFee || 0;
  }, [game]);

  // Calculate total cost for selected cells
  const totalCost = useMemo(() => {
    return selectedCells.size * entryFee;
  }, [selectedCells, entryFee]);

  const selectedTokenMeta = TOKEN_METADATA[selectedTokenSymbol];

  // Handle join form submission
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Please enter your display name');
      return;
    }

    if (!boardId || typeof boardId !== 'string') return;

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
      
      const result = await joinGame(boardId, newUserId);
      
      if (result.success) {
        setUserId(newUserId);
        setState('payment');
      } else {
        setError('Failed to join game. Please try again.');
      }
    } catch (err) {
      console.error('Error joining game:', err);
      setError('An error occurred while joining the game.');
    } finally {
      setIsJoining(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (transactionHash: string) => {
    setPaymentComplete(true);
    setPaymentTxHash(transactionHash);
    
    if (userId && boardId) {
      localStorage.setItem(`paid_${boardId}_${userId}`, 'true');
    }
    
    setState('board_view');
  };

  // Handle payment error
  const handlePaymentError = (err: Error) => {
    setError(`Payment failed: ${err.message}`);
  };

  // Handle cell selection toggle
  const toggleCellSelection = useCallback((index: number) => {
    if (claimedCells.has(index)) return; // Already claimed
    
    setSelectedCells(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, [claimedCells]);

  // Handle cell claiming
  const handleClaimCells = async () => {
    if (!boardId || !userId || !displayName || selectedCells.size === 0 || !game || !gameModeConfig) return;

    setIsClaiming(true);
    setError(null);

    try {
      const cellsToClaim = Array.from(selectedCells);
      const { rows, cols } = gameModeConfig.gridSize || { rows: 5, cols: 5 };
      
      for (const cellIndex of cellsToClaim) {
        const row = Math.floor(cellIndex / cols);
        const col = cellIndex % cols;
        const result = await claimCell(
          boardId as string,
          row,
          col,
          userId,
          displayName
        );
        
        if (result.success && result.data) {
          setClaimedCells(prev => {
            const next = new Map(prev);
            next.set(cellIndex, {
              userId,
              displayName,
              claimedAt: new Date().toISOString(),
            });
            return next;
          });
        }
      }
      
      setSelectedCells(new Set());
    } catch (err) {
      console.error('Error claiming cells:', err);
      setError('Failed to claim cells. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Handle cell claim from board component (single cell)
  const handleCellClaim = async (index: number) => {
    if (!boardId || !userId || !displayName || !game || !gameModeConfig) return;
    
    const { rows, cols } = gameModeConfig.gridSize || { rows: 5, cols: 5 };
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    setIsClaiming(true);
    try {
      const result = await claimCell(
        boardId as string,
        row,
        col,
        userId,
        displayName
      );
      
      if (result.success && result.data) {
        setClaimedCells(prev => {
          const next = new Map(prev);
          next.set(index, {
            userId,
            displayName,
            claimedAt: new Date().toISOString(),
          });
          return next;
        });
      }
    } catch (err) {
      console.error('Error claiming cell:', err);
      setError('Failed to claim cell. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Loading state
  if (state === 'loading') {
    return (
      <Layout title="Loading... - GridPlay" showWallet={true}>
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
  if (state === 'not_found') {
    return (
      <Layout title="Game Not Found - GridPlay" showWallet={true}>
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
              The game you're looking for doesn't exist or has ended.
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
  if (state === 'error') {
    return (
      <Layout title="Error - GridPlay" showWallet={true}>
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
                  setState('loading');
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

  // Join form state
  if (state === 'join_form' && game) {
    const config = game.config as BoardConfig;
    
    return (
      <Layout title={`Join ${game.name} - GridPlay`} showWallet={true}>
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Wallet Status */}
          <div className="mb-6">
            <WalletStatus compact={false} />
          </div>

          {/* Game Info Card */}
          <div 
            className="p-6 rounded-lg border mb-6"
            style={{ 
              backgroundColor: '#1A1A1A',
              borderColor: '#374151',
            }}
          >
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: THEME_COLORS.TEXT }}
            >
              {game.name}
            </h1>
            <p className="text-[#9CA3AF] mb-4">
              {config.awayTeam} @ {config.homeTeam}
            </p>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-[#9CA3AF]">Mode</div>
                <div 
                  className="font-bold"
                  style={{ color: THEME_COLORS.PRIMARY }}
                >
                  {gameModeConfig?.name}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#9CA3AF]">Entry Fee</div>
                <div className="font-bold text-white">
                  {TOKEN_METADATA[config.tokenSymbol as TokenSymbol || 'ALSA'].icon} {config.entryFee}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#9CA3AF]">Prize Pool</div>
                <div 
                  className="font-bold"
                  style={{ color: THEME_COLORS.ACCENT }}
                >
                  {TOKEN_METADATA[config.tokenSymbol as TokenSymbol || 'ALSA'].icon} {config.prizePool}
                </div>
              </div>
            </div>
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
              <p className="mt-2 text-xs text-[#9CA3AF]">
                This name will appear on cells you claim.
              </p>
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
              disabled={isJoining || !displayName.trim() || !isConnected || !isCorrectNetwork}
            >
              {isJoining ? 'Joining...' : 'Join Game'}
            </Button>
          </form>

          {/* Connection Warning */}
          {(!isConnected || !isCorrectNetwork) && (
            <div className="mt-4 p-3 rounded-lg bg-amber-900/30 border border-amber-500/50 text-center">
              <p className="text-amber-400 text-sm">
                {!isConnected ? 'Connect wallet to join game' : 'Switch to Polygon network to play'}
              </p>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Payment state
  if (state === 'payment' && game) {
    const config = game.config as BoardConfig;
    const tokenSymbol = (config.tokenSymbol || 'ALSA') as TokenSymbol;
    
    return (
      <Layout title={`Pay Entry Fee - ${game.name}`} showWallet={true}>
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Wallet Status */}
          <div className="mb-6">
            <WalletStatus compact={false} />
          </div>

          {/* Game Info Card */}
          <div 
            className="p-6 rounded-lg border mb-6"
            style={{ 
              backgroundColor: '#1A1A1A',
              borderColor: '#374151',
            }}
          >
            <h1 
              className="text-xl font-bold mb-2"
              style={{ color: THEME_COLORS.TEXT }}
            >
              {game.name}
            </h1>
            <p className="text-[#9CA3AF] mb-4">
              {config.awayTeam} @ {config.homeTeam}
            </p>
            
            <div className="border-t border-[#374151] pt-4 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-[#9CA3AF]">Entry Fee:</span>
                <span className="text-2xl font-bold" style={{ color: THEME_COLORS.ACCENT }}>
                  {TOKEN_METADATA[tokenSymbol].icon} {entryFee} {tokenSymbol}
                </span>
              </div>
            </div>
          </div>

          {/* Token Payment Component */}
          <TokenPayment
            tokenSymbol={tokenSymbol}
            amount={entryFee}
            recipientAddress={GAME_CONTRACT_ADDRESS}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            buttonText={`Pay Entry Fee with ${tokenSymbol}`}
          />

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/50">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
            <p className="text-sm text-blue-300">
              💡 Payment is one-time per game. After paying, you'll be able to claim your cells.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Board view state
  if (state === 'board_view' && game && gameModeConfig) {
    const config = game.config as BoardConfig;
    const isShotgun = game.mode === 'shotgun';
    const availableCells = gameModeConfig.totalCells - claimedCells.size;
    const userClaimedCount = Array.from(claimedCells.values()).filter(c => c.userId === userId).length;
    
    return (
      <Layout title={`${game.name} - GridPlay`} showWallet={true}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Game Header */}
          <div className="text-center mb-8">
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: THEME_COLORS.TEXT }}
            >
              {game.name}
            </h1>
            <p className="text-lg text-white mb-2">
              {config.awayTeam} @ {config.homeTeam}
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <div>
                <span className="text-[#9CA3AF]">Mode: </span>
                <span style={{ color: THEME_COLORS.PRIMARY }}>{gameModeConfig.name}</span>
              </div>
              <div>
                <span className="text-[#9CA3AF]">Entry: </span>
                <span className="text-white">
                  {TOKEN_METADATA[config.tokenSymbol as TokenSymbol || 'ALSA'].icon} {config.entryFee}
                </span>
              </div>
              <div>
                <span className="text-[#9CA3AF]">Prize: </span>
                <span style={{ color: THEME_COLORS.ACCENT }}>
                  {TOKEN_METADATA[config.tokenSymbol as TokenSymbol || 'ALSA'].icon} {config.prizePool}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Confirmation Badge */}
          {paymentTxHash && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-center">
              <p className="text-green-400 text-sm">
                ✅ Entry fee paid! Tx: {paymentTxHash.slice(0, 10)}...{paymentTxHash.slice(-8)}
              </p>
            </div>
          )}

          {/* Game Board */}
          <div className="mb-8">
            {isShotgun ? (
              <ShotgunBoard
                boardId={game.id}
                homeTeam={config.homeTeam}
                awayTeam={config.awayTeam}
                startTime={config.startTime ? new Date(config.startTime).getTime() : undefined}
                initialCells={claimedCells}
                onCellClaim={handleCellClaim}
                userId={userId || undefined}
                displayName={displayName}
              />
            ) : (
              <GameBoard
                boardId={game.id}
                mode={game.mode}
                homeTeam={config.homeTeam}
                awayTeam={config.awayTeam}
                gridSize={gameModeConfig.gridSize}
                initialCells={claimedCells}
                onCellClick={toggleCellSelection}
                selectedCells={selectedCells}
                userId={userId || undefined}
              />
            )}
          </div>

          {/* Selection Summary (for non-shotgun modes) */}
          {!isShotgun && selectedCells.size > 0 && (
            <div 
              className="fixed bottom-0 left-0 right-0 p-4 border-t"
              style={{ 
                backgroundColor: '#1A1A1A',
                borderColor: THEME_COLORS.PRIMARY,
              }}
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">
                    {selectedCells.size} cell{selectedCells.size !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-sm text-[#9CA3AF]">
                    Total: <span style={{ color: THEME_COLORS.ACCENT }}>
                      {TOKEN_METADATA[config.tokenSymbol as TokenSymbol || 'ALSA'].icon} {totalCost}
                    </span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setSelectedCells(new Set())}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleClaimCells}
                    disabled={isClaiming}
                  >
                    {isClaiming ? 'Claiming...' : 'Claim Cells'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Game Info */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              borderColor: `${THEME_COLORS.PRIMARY}40`,
            }}
          >
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="text-[#9CA3AF]">Available Cells: </span>
                <span className="text-white">{availableCells} / {gameModeConfig.totalCells}</span>
              </div>
              <div>
                <span className="text-[#9CA3AF]">Your Cells: </span>
                <span style={{ color: THEME_COLORS.PRIMARY }}>
                  {userClaimedCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}
