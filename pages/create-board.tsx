/**
 * GridPlay Create Board Page
 * 
 * Form to create new game boards with configuration options.
 * Supports Shotgun, 5x5, and 10x10 game modes.
 */

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { createGame } from '../lib/api';
import { GAME_MODES, THEME_COLORS, ENTRY_FEES, PAYOUT_STRUCTURE } from '../lib/constants';
import type { GameMode, BoardConfig } from '../types';

type FormData = {
  name: string;
  gameMode: GameMode;
  homeTeam: string;
  awayTeam: string;
  entryFee: number;
  startTime: string;
  customEntryFee: boolean;
};

const initialFormData: FormData = {
  name: '',
  gameMode: '5x5',
  homeTeam: '',
  awayTeam: '',
  entryFee: ENTRY_FEES.STANDARD,
  startTime: '',
  customEntryFee: false,
};

export default function CreateBoard() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdBoardId, setCreatedBoardId] = useState<string | null>(null);

  // Get game mode configuration
  const gameModeConfig = useMemo(() => {
    return GAME_MODES[formData.gameMode];
  }, [formData.gameMode]);

  // Calculate prize pool
  const prizePool = useMemo(() => {
    const totalCells = gameModeConfig.totalCells;
    return formData.entryFee * totalCells;
  }, [formData.entryFee, gameModeConfig.totalCells]);

  // Calculate payouts
  const payouts = useMemo(() => {
    const structure = PAYOUT_STRUCTURE[formData.gameMode];
    return {
      first: Math.floor(prizePool * structure.first),
      second: Math.floor(prizePool * structure.second),
      third: Math.floor(prizePool * structure.third),
    };
  }, [prizePool, formData.gameMode]);

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    setError(null);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Board name is required');
      return false;
    }
    if (!formData.homeTeam.trim()) {
      setError('Home team name is required');
      return false;
    }
    if (!formData.awayTeam.trim()) {
      setError('Away team name is required');
      return false;
    }
    if (formData.entryFee <= 0) {
      setError('Entry fee must be greater than 0');
      return false;
    }
    if (formData.startTime) {
      const start = new Date(formData.startTime);
      if (start <= new Date()) {
        setError('Start time must be in the future');
        return false;
      }
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const config: BoardConfig = {
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        entryFee: formData.entryFee,
        prizePool,
        payouts,
        startTime: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
      };

      const board = await createGame({
        name: formData.name,
        mode: formData.gameMode,
        config,
      });

      if (board) {
        setCreatedBoardId(board.id);
      } else {
        setError('Failed to create board. Please try again.');
      }
    } catch (err) {
      console.error('Error creating board:', err);
      setError('An error occurred while creating the board.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle share link copy
  const copyShareLink = () => {
    if (!createdBoardId) return;
    
    const link = `${window.location.origin}/join-board?id=${createdBoardId}`;
    navigator.clipboard.writeText(link);
    alert('Share link copied to clipboard!');
  };

  // Success screen after board creation
  if (createdBoardId) {
    return (
      <Layout title="Board Created - GridPlay">
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div 
            className="max-w-md w-full p-8 rounded-lg border text-center"
            style={{ 
              backgroundColor: '#1A1A1A',
              borderColor: `${THEME_COLORS.PRIMARY}40`,
            }}
          >
            <div className="text-6xl mb-4">🎉</div>
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: THEME_COLORS.PRIMARY }}
            >
              Board Created!
            </h1>
            <p className="text-[#9CA3AF] mb-6">
              Your {gameModeConfig.name} board is ready for players.
            </p>
            
            <div 
              className="p-4 rounded mb-6"
              style={{ backgroundColor: '#0A0A0A' }}
            >
              <p className="text-xs text-[#9CA3AF] mb-2">Board ID:</p>
              <p 
                className="font-mono text-sm"
                style={{ color: THEME_COLORS.TEXT }}
              >
                {createdBoardId}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={copyShareLink}
              >
                Copy Share Link
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => router.push(`/join-board?id=${createdBoardId}`)}
              >
                View Board
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={() => {
                  setCreatedBoardId(null);
                  setFormData(initialFormData);
                }}
              >
                Create Another
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Create Board - GridPlay">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: THEME_COLORS.TEXT }}
          >
            Create a New Board
          </h1>
          <p className="text-[#9CA3AF]">
            Set up your game board and invite players to join
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div 
            className="p-6 rounded-lg border mb-6"
            style={{ 
              backgroundColor: '#1A1A1A',
              borderColor: '#374151',
            }}
          >
            {/* Board Name */}
            <div className="mb-6">
              <label 
                htmlFor="name"
                className="block text-sm font-medium mb-2"
                style={{ color: THEME_COLORS.TEXT }}
              >
                Board Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Super Bowl LVIII Squares"
                className="w-full px-4 py-3 rounded-lg border bg-[#0A0A0A] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#10B981]"
                style={{ borderColor: '#374151' }}
              />
            </div>

            {/* Game Mode Selection */}
            <div className="mb-6">
              <label 
                className="block text-sm font-medium mb-3"
                style={{ color: THEME_COLORS.TEXT }}
              >
                Game Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(GAME_MODES).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gameMode: key as GameMode }))}
                    className={`
                      p-4 rounded-lg border text-center transition-all
                      ${formData.gameMode === key ? 'ring-2 ring-[#10B981]' : ''}
                    `}
                    style={{ 
                      backgroundColor: formData.gameMode === key ? 'rgba(16, 185, 129, 0.1)' : '#0A0A0A',
                      borderColor: formData.gameMode === key ? THEME_COLORS.PRIMARY : '#374151',
                    }}
                  >
                    <div 
                      className="text-2xl mb-1"
                      style={{ color: THEME_COLORS.PRIMARY }}
                    >
                      {config.totalCells}
                    </div>
                    <div 
                      className="text-xs"
                      style={{ color: THEME_COLORS.TEXT }}
                    >
                      {config.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Teams Section */}
            <div className="mb-6">
              <label 
                className="block text-sm font-medium mb-3"
                style={{ color: THEME_COLORS.TEXT }}
              >
                Teams
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label 
                    htmlFor="homeTeam"
                    className="block text-xs text-[#9CA3AF] mb-1"
                  >
                    Home Team
                  </label>
                  <input
                    type="text"
                    id="homeTeam"
                    name="homeTeam"
                    value={formData.homeTeam}
                    onChange={handleChange}
                    placeholder="e.g., Chiefs"
                    className="w-full px-4 py-3 rounded-lg border bg-[#0A0A0A] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#10B981]"
                    style={{ borderColor: '#374151' }}
                  />
                </div>
                <div>
                  <label 
                    htmlFor="awayTeam"
                    className="block text-xs text-[#9CA3AF] mb-1"
                  >
                    Away Team
                  </label>
                  <input
                    type="text"
                    id="awayTeam"
                    name="awayTeam"
                    value={formData.awayTeam}
                    onChange={handleChange}
                    placeholder="e.g., 49ers"
                    className="w-full px-4 py-3 rounded-lg border bg-[#0A0A0A] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#10B981]"
                    style={{ borderColor: '#374151' }}
                  />
                </div>
              </div>
            </div>

            {/* Entry Fee */}
            <div className="mb-6">
              <label 
                className="block text-sm font-medium mb-3"
                style={{ color: THEME_COLORS.TEXT }}
              >
                Entry Fee per Cell
              </label>
              
              {!formData.customEntryFee ? (
                <div className="grid grid-cols-4 gap-2">
                  {[ENTRY_FEES.BUDGET, ENTRY_FEES.STANDARD, ENTRY_FEES.PREMIUM, ENTRY_FEES.VIP].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, entryFee: fee }))}
                      className={`
                        p-3 rounded-lg border text-center transition-all
                        ${formData.entryFee === fee ? 'ring-2 ring-[#10B981]' : ''}
                      `}
                      style={{ 
                        backgroundColor: formData.entryFee === fee ? 'rgba(16, 185, 129, 0.1)' : '#0A0A0A',
                        borderColor: formData.entryFee === fee ? THEME_COLORS.PRIMARY : '#374151',
                      }}
                    >
                      <div 
                        className="font-bold"
                        style={{ color: THEME_COLORS.TEXT }}
                      >
                        ${fee}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="number"
                  id="entryFee"
                  name="entryFee"
                  value={formData.entryFee}
                  onChange={handleChange}
                  min="1"
                  step="0.01"
                  placeholder="Enter custom amount"
                  className="w-full px-4 py-3 rounded-lg border bg-[#0A0A0A] text-white placeholder-[#6B7280] focus:outline-none focus:border-[#10B981]"
                  style={{ borderColor: '#374151' }}
                />
              )}
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  customEntryFee: !prev.customEntryFee,
                  entryFee: prev.customEntryFee ? ENTRY_FEES.STANDARD : prev.entryFee,
                }))}
                className="mt-2 text-sm text-[#10B981] hover:underline"
              >
                {formData.customEntryFee ? 'Use preset amounts' : 'Set custom amount'}
              </button>
            </div>

            {/* Start Time */}
            <div className="mb-6">
              <label 
                htmlFor="startTime"
                className="block text-sm font-medium mb-2"
                style={{ color: THEME_COLORS.TEXT }}
              >
                Game Start Time (Optional)
              </label>
              <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border bg-[#0A0A0A] text-white focus:outline-none focus:border-[#10B981]"
                style={{ borderColor: '#374151' }}
              />
              <p className="mt-1 text-xs text-[#9CA3AF]">
                Set when the game starts. Numbers will be revealed at this time.
              </p>
            </div>
          </div>

          {/* Summary Card */}
          <div 
            className="p-6 rounded-lg border mb-6"
            style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              borderColor: `${THEME_COLORS.PRIMARY}40`,
            }}
          >
            <h3 
              className="text-lg font-bold mb-4"
              style={{ color: THEME_COLORS.PRIMARY }}
            >
              Board Summary
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Game Mode:</span>
                <span className="text-white">{gameModeConfig.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Total Cells:</span>
                <span className="text-white">{gameModeConfig.totalCells}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">Entry Fee:</span>
                <span className="text-white">${formData.entryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-[#374151] pt-3">
                <span className="text-[#9CA3AF]">Total Prize Pool:</span>
                <span 
                  className="font-bold"
                  style={{ color: THEME_COLORS.ACCENT }}
                >
                  ${prizePool.toFixed(2)}
                </span>
              </div>
              
              <div className="border-t border-[#374151] pt-3 mt-3">
                <p className="text-[#9CA3AF] mb-2">Payout Structure:</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div 
                    className="p-2 rounded"
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                  >
                    <div className="text-xs text-[#9CA3AF]">1st</div>
                    <div 
                      className="font-bold"
                      style={{ color: THEME_COLORS.ACCENT }}
                    >
                      ${payouts.first}
                    </div>
                  </div>
                  <div 
                    className="p-2 rounded"
                    style={{ backgroundColor: 'rgba(192, 192, 192, 0.1)' }}
                  >
                    <div className="text-xs text-[#9CA3AF]">2nd</div>
                    <div className="font-bold text-[#C0C0C0]">${payouts.second}</div>
                  </div>
                  <div 
                    className="p-2 rounded"
                    style={{ backgroundColor: 'rgba(205, 127, 50, 0.1)' }}
                  >
                    <div className="text-xs text-[#9CA3AF]">3rd</div>
                    <div className="font-bold text-[#CD7F32]">${payouts.third}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="flex-1"
              onClick={() => router.push('/')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Board'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}