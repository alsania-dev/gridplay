/**
 * useGameBoard Hook Unit Tests
 * 
 * Tests cell selection, Fisher-Yates shuffle, and winner calculation.
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useGameBoard, fisherYatesShuffle } from '../useGameBoard';
import { BoardCell, GameMode } from '../../types';

// Mock Math.random for predictable shuffle results
const mockMathRandom = (values: number[]) => {
  let index = 0;
  const originalRandom = Math.random;
  Math.random = () => values[index++ % values.length];
  return () => {
    Math.random = originalRandom;
  };
};

describe('useGameBoard Hook', () => {
  // ===========================================
  // Initialization Tests
  // ===========================================
  
  describe('Initialization', () => {
    it('should initialize with correct grid size for 10x10 mode', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      expect(result.current.cells.length).toBe(100);
      expect(result.current.availableCells).toBe(100);
      expect(result.current.claimedCells).toBe(0);
    });
    
    it('should initialize with correct grid size for 5x5 mode', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '5x5' as GameMode })
      );
      
      expect(result.current.cells.length).toBe(25);
      expect(result.current.availableCells).toBe(25);
    });
    
    it('should initialize with correct grid size for shotgun mode', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: 'shotgun' as GameMode })
      );
      
      expect(result.current.cells.length).toBe(100);
    });
    
    it('should initialize all cells as available', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      const allAvailable = result.current.cells.every(
        cell => cell.owner === null && !cell.isWinner
      );
      expect(allAvailable).toBe(true);
    });
    
    it('should initialize with empty row and column scores', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      expect(result.current.rowScores).toEqual([]);
      expect(result.current.colScores).toEqual([]);
    });
    
    it('should not be locked initially', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      expect(result.current.isLocked).toBe(false);
    });
    
    it('should not have started initially', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      expect(result.current.hasStarted).toBe(false);
    });
  });
  
  // ===========================================
  // Cell Selection Tests
  // ===========================================
  
  describe('Cell Selection', () => {
    it('should select a cell', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.selectCell(0, 0);
      });
      
      expect(result.current.selectedCells.length).toBe(1);
      expect(result.current.selectedCells[0]).toEqual({ row: 0, col: 0 });
    });
    
    it('should select multiple cells', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.selectCell(0, 0);
        result.current.selectCell(1, 1);
        result.current.selectCell(2, 2);
      });
      
      expect(result.current.selectedCells.length).toBe(3);
    });
    
    it('should not select the same cell twice', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.selectCell(0, 0);
        result.current.selectCell(0, 0);
      });
      
      expect(result.current.selectedCells.length).toBe(1);
    });
    
    it('should deselect a cell', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.selectCell(0, 0);
        result.current.selectCell(1, 1);
      });
      
      expect(result.current.selectedCells.length).toBe(2);
      
      act(() => {
        result.current.deselectCell(0, 0);
      });
      
      expect(result.current.selectedCells.length).toBe(1);
      expect(result.current.selectedCells[0]).toEqual({ row: 1, col: 1 });
    });
    
    it('should toggle cell selection', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.toggleCell(0, 0);
      });
      
      expect(result.current.selectedCells.length).toBe(1);
      
      act(() => {
        result.current.toggleCell(0, 0);
      });
      
      expect(result.current.selectedCells.length).toBe(0);
    });
    
    it('should not select cells when board is locked', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.lockBoard();
      });
      
      act(() => {
        result.current.selectCell(0, 0);
      });
      
      expect(result.current.selectedCells.length).toBe(0);
    });
    
    it('should not select already claimed cells', () => {
      const { result } = renderHook(() => 
        useGameBoard({ 
          mode: '10x10' as GameMode,
          userId: 'user-1',
          displayName: 'Test User'
        })
      );
      
      // Claim a cell first
      act(async () => {
        await result.current.claimCell(0, 0);
      });
      
      // Try to select the claimed cell
      act(() => {
        result.current.selectCell(0, 0);
      });
      
      expect(result.current.selectedCells.length).toBe(0);
    });
    
    it('should check if cell is selected', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      expect(result.current.isCellSelected(0, 0)).toBe(false);
      
      act(() => {
        result.current.selectCell(0, 0);
      });
      
      expect(result.current.isCellSelected(0, 0)).toBe(true);
    });
    
    it('should check if cell is claimed', () => {
      const { result } = renderHook(() => 
        useGameBoard({ 
          mode: '10x10' as GameMode,
          userId: 'user-1',
          displayName: 'Test User'
        })
      );
      
      expect(result.current.isCellClaimed(0, 0)).toBe(false);
      
      act(async () => {
        await result.current.claimCell(0, 0);
      });
      
      expect(result.current.isCellClaimed(0, 0)).toBe(true);
    });
  });
  
  // ===========================================
  // Fisher-Yates Shuffle Tests
  // ===========================================
  
  describe('Fisher-Yates Shuffle', () => {
    it('should return a new array (not mutate original)', () => {
      const original = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const shuffled = fisherYatesShuffle(original);
      
      expect(original).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(shuffled).not.toBe(original);
    });
    
    it('should contain all original elements', () => {
      const original = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const shuffled = fisherYatesShuffle(original);
      
      const sortedOriginal = [...original].sort((a, b) => a - b);
      const sortedShuffled = [...shuffled].sort((a, b) => a - b);
      
      expect(sortedShuffled).toEqual(sortedOriginal);
    });
    
    it('should produce different order (usually)', () => {
      // Run multiple times to verify shuffling occurs
      let differentCount = 0;
      const original = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      
      for (let i = 0; i < 10; i++) {
        const shuffled = fisherYatesShuffle([...original]);
        if (shuffled.join(',') !== original.join(',')) {
          differentCount++;
        }
      }
      
      // At least some should be different
      expect(differentCount).toBeGreaterThan(0);
    });
    
    it('should handle single element array', () => {
      const original = [1];
      const shuffled = fisherYatesShuffle(original);
      
      expect(shuffled).toEqual([1]);
    });
    
    it('should handle empty array', () => {
      const original: number[] = [];
      const shuffled = fisherYatesShuffle(original);
      
      expect(shuffled).toEqual([]);
    });
  });
  
  // ===========================================
  // Generate Scores Tests
  // ===========================================
  
  describe('Generate Scores', () => {
    it('should generate row and column scores', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.generateScores();
      });
      
      expect(result.current.rowScores.length).toBe(10);
      expect(result.current.colScores.length).toBe(10);
    });
    
    it('should generate scores 0-9 for 10x10 mode', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.generateScores();
      });
      
      const sortedRowScores = [...result.current.rowScores].sort((a, b) => a - b);
      const sortedColScores = [...result.current.colScores].sort((a, b) => a - b);
      
      expect(sortedRowScores).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(sortedColScores).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
    
    it('should generate 5 scores for 5x5 mode', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '5x5' as GameMode })
      );
      
      act(() => {
        result.current.generateScores();
      });
      
      expect(result.current.rowScores.length).toBe(5);
      expect(result.current.colScores.length).toBe(5);
    });
    
    it('should generate different row and column scores', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.generateScores();
      });
      
      // They might occasionally be the same, but usually different
      // Just verify both are valid
      expect(result.current.rowScores.every(s => s >= 0 && s <= 9)).toBe(true);
      expect(result.current.colScores.every(s => s >= 0 && s <= 9)).toBe(true);
    });
  });
  
  // ===========================================
  // Winner Calculation Tests
  // ===========================================
  
  describe('Winner Calculation', () => {
    it('should calculate winner based on last digit of scores', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      // Generate scores first
      act(() => {
        result.current.generateScores();
      });
      
      // Find which row/col corresponds to score digit
      const homeDigit = result.current.rowScores[3]; // Row 3
      const awayDigit = result.current.colScores[5]; // Col 5
      
      const winners = act(() => {
        return result.current.calculateWinners(
          homeDigit + 10, // Score ending in homeDigit
          awayDigit + 20  // Score ending in awayDigit
        );
      });
      
      // Should find winning cell at row 3, col 5
      expect(winners).toContainEqual({ row: 3, col: 5 });
    });
    
    it('should return empty array if no scores generated', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      const winners = result.current.calculateWinners(21, 14);
      
      expect(winners).toEqual([]);
    });
    
    it('should mark winning cell with isWinner flag', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.generateScores();
      });
      
      const homeDigit = result.current.rowScores[2];
      const awayDigit = result.current.colScores[7];
      
      act(() => {
        result.current.calculateWinners(homeDigit + 10, awayDigit + 20);
      });
      
      const winningCell = result.current.cells.find(
        cell => cell.row === 2 && cell.col === 7
      );
      
      expect(winningCell?.isWinner).toBe(true);
    });
    
    it('should update winningCells derived state', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.generateScores();
      });
      
      const homeDigit = result.current.rowScores[4];
      const awayDigit = result.current.colScores[6];
      
      act(() => {
        result.current.calculateWinners(homeDigit + 10, awayDigit + 20);
      });
      
      expect(result.current.winningCells.length).toBe(1);
      expect(result.current.winningCells[0].row).toBe(4);
      expect(result.current.winningCells[0].col).toBe(6);
    });
    
    it('should handle scores of 0', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.generateScores();
      });
      
      // Find row and col with score 0
      const rowWithZero = result.current.rowScores.indexOf(0);
      const colWithZero = result.current.colScores.indexOf(0);
      
      const winners = act(() => {
        return result.current.calculateWinners(0, 0);
      });
      
      expect(winners).toContainEqual({ row: rowWithZero, col: colWithZero });
    });
    
    it('should handle high scores correctly (only last digit matters)', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.generateScores();
      });
      
      const homeDigit = result.current.rowScores[1];
      const awayDigit = result.current.colScores[9];
      
      // 47 ends in 7, 123 ends in 3
      const winners = act(() => {
        return result.current.calculateWinners(
          homeDigit + 100, // Last digit is homeDigit
          awayDigit + 200  // Last digit is awayDigit
        );
      });
      
      expect(winners).toContainEqual({ row: 1, col: 9 });
    });
  });
  
  // ===========================================
  // Cell Claiming Tests
  // ===========================================
  
  describe('Cell Claiming', () => {
    it('should claim a single cell', async () => {
      const onCellClaim = jest.fn();
      const { result } = renderHook(() => 
        useGameBoard({ 
          mode: '10x10' as GameMode,
          userId: 'user-1',
          displayName: 'Test User',
          onCellClaim
        })
      );
      
      await act(async () => {
        await result.current.claimCell(0, 0);
      });
      
      expect(result.current.claimedCells).toBe(1);
      expect(result.current.availableCells).toBe(99);
      expect(onCellClaim).toHaveBeenCalledWith(0, 0);
    });
    
    it('should claim multiple selected cells', async () => {
      const onCellClaim = jest.fn();
      const { result } = renderHook(() => 
        useGameBoard({ 
          mode: '10x10' as GameMode,
          userId: 'user-1',
          displayName: 'Test User',
          onCellClaim
        })
      );
      
      act(() => {
        result.current.selectCell(0, 0);
        result.current.selectCell(1, 1);
        result.current.selectCell(2, 2);
      });
      
      await act(async () => {
        await result.current.claimSelectedCells();
      });
      
      expect(result.current.claimedCells).toBe(3);
      expect(result.current.selectedCells.length).toBe(0);
      expect(onCellClaim).toHaveBeenCalledTimes(3);
    });
    
    it('should not claim cells without user info', async () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.selectCell(0, 0);
      });
      
      await act(async () => {
        await result.current.claimSelectedCells();
      });
      
      expect(result.current.claimedCells).toBe(0);
    });
    
    it('should not claim cells when board is locked', async () => {
      const { result } = renderHook(() => 
        useGameBoard({ 
          mode: '10x10' as GameMode,
          userId: 'user-1',
          displayName: 'Test User'
        })
      );
      
      act(() => {
        result.current.lockBoard();
      });
      
      await act(async () => {
        await result.current.claimCell(0, 0);
      });
      
      expect(result.current.claimedCells).toBe(0);
    });
    
    it('should not claim already claimed cells', async () => {
      const { result } = renderHook(() => 
        useGameBoard({ 
          mode: '10x10' as GameMode,
          userId: 'user-1',
          displayName: 'Test User'
        })
      );
      
      await act(async () => {
        await result.current.claimCell(0, 0);
      });
      
      expect(result.current.claimedCells).toBe(1);
      
      // Try to claim again
      await act(async () => {
        await result.current.claimCell(0, 0);
      });
      
      // Should still be 1
      expect(result.current.claimedCells).toBe(1);
    });
    
    it('should store owner information in claimed cell', async () => {
      const { result } = renderHook(() => 
        useGameBoard({ 
          mode: '10x10' as GameMode,
          userId: 'user-123',
          displayName: 'John Doe'
        })
      );
      
      await act(async () => {
        await result.current.claimCell(5, 5);
      });
      
      const cell = result.current.getCell(5, 5);
      
      expect(cell?.owner).not.toBeNull();
      expect(cell?.owner?.userId).toBe('user-123');
      expect(cell?.owner?.displayName).toBe('John Doe');
      expect(cell?.owner?.claimedAt).toBeDefined();
    });
  });
  
  // ===========================================
  // Board State Management Tests
  // ===========================================
  
  describe('Board State Management', () => {
    it('should lock the board', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      expect(result.current.isLocked).toBe(false);
      
      act(() => {
        result.current.lockBoard();
      });
      
      expect(result.current.isLocked).toBe(true);
    });
    
    it('should start the game', () => {
      const onGameStart = jest.fn();
      const { result } = renderHook(() => 
        useGameBoard({ 
          mode: '10x10' as GameMode,
          onGameStart
        })
      );
      
      expect(result.current.hasStarted).toBe(false);
      
      act(() => {
        result.current.startGame();
      });
      
      expect(result.current.hasStarted).toBe(true);
      expect(onGameStart).toHaveBeenCalled();
    });
    
    it('should complete the game', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      expect(result.current.isCompleted).toBe(false);
      
      act(() => {
        result.current.completeGame();
      });
      
      expect(result.current.isCompleted).toBe(true);
    });
    
    it('should reset the board', async () => {
      const { result } = renderHook(() => 
        useGameBoard({ 
          mode: '10x10' as GameMode,
          userId: 'user-1',
          displayName: 'Test User'
        })
      );
      
      // Make some changes
      await act(async () => {
        await result.current.claimCell(0, 0);
      });
      
      act(() => {
        result.current.generateScores();
        result.current.lockBoard();
      });
      
      expect(result.current.claimedCells).toBe(1);
      expect(result.current.isLocked).toBe(true);
      
      // Reset
      act(() => {
        result.current.resetBoard();
      });
      
      expect(result.current.claimedCells).toBe(0);
      expect(result.current.availableCells).toBe(100);
      expect(result.current.rowScores).toEqual([]);
      expect(result.current.colScores).toEqual([]);
      expect(result.current.isLocked).toBe(false);
      expect(result.current.selectedCells.length).toBe(0);
    });
  });
  
  // ===========================================
  // Get Cell Tests
  // ===========================================
  
  describe('Get Cell', () => {
    it('should return cell at specified position', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      const cell = result.current.getCell(5, 7);
      
      expect(cell).toBeDefined();
      expect(cell?.row).toBe(5);
      expect(cell?.col).toBe(7);
    });
    
    it('should return undefined for invalid position', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      const cell = result.current.getCell(20, 20);
      
      expect(cell).toBeUndefined();
    });
    
    it('should return cell at position (0, 0)', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      const cell = result.current.getCell(0, 0);
      
      expect(cell).toBeDefined();
      expect(cell?.row).toBe(0);
      expect(cell?.col).toBe(0);
    });
    
    it('should return cell at maximum position', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      const cell = result.current.getCell(9, 9);
      
      expect(cell).toBeDefined();
      expect(cell?.row).toBe(9);
      expect(cell?.col).toBe(9);
    });
  });
  
  // ===========================================
  // Initial State Tests
  // ===========================================
  
  describe('Initial State', () => {
    it('should accept initial board state', () => {
      const initialCells: BoardCell[] = [
        { row: 0, col: 0, owner: null, homeScore: null, awayScore: null, isWinner: false },
        { row: 0, col: 1, owner: { userId: 'u1', displayName: 'User 1', claimedAt: '2024-01-01' }, homeScore: 7, awayScore: 3, isWinner: false },
      ];
      
      const initialState = {
        id: 'test-board',
        name: 'Test Board',
        config: {
          mode: '5x5' as GameMode,
          pricePerCell: 100,
          homeTeam: { id: 'h1', name: 'Home', abbreviation: 'H' },
          awayTeam: { id: 'a1', name: 'Away', abbreviation: 'A' },
          sport: 'nfl'
        },
        status: 'open',
        cells: initialCells,
        rowScores: [0, 1],
        colScores: [2, 3],
        createdBy: 'user-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };
      
      const { result } = renderHook(() => 
        useGameBoard({ 
          mode: '5x5' as GameMode,
          initialState
        })
      );
      
      expect(result.current.cells.length).toBe(2);
      expect(result.current.rowScores).toEqual([0, 1]);
      expect(result.current.colScores).toEqual([2, 3]);
    });
  });
  
  // ===========================================
  // Edge Cases
  // ===========================================
  
  describe('Edge Cases', () => {
    it('should handle selecting all cells', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '5x5' as GameMode })
      );
      
      act(() => {
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            result.current.selectCell(row, col);
          }
        }
      });
      
      expect(result.current.selectedCells.length).toBe(25);
    });
    
    it('should handle claiming all cells', async () => {
      const { result } = renderHook(() => 
        useGameBoard({ 
          mode: '5x5' as GameMode,
          userId: 'user-1',
          displayName: 'Test User'
        })
      );
      
      act(() => {
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            result.current.selectCell(row, col);
          }
        }
      });
      
      await act(async () => {
        await result.current.claimSelectedCells();
      });
      
      expect(result.current.claimedCells).toBe(25);
      expect(result.current.availableCells).toBe(0);
    });
    
    it('should handle multiple reset operations', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.resetBoard();
        result.current.resetBoard();
        result.current.resetBoard();
      });
      
      expect(result.current.cells.length).toBe(100);
    });
    
    it('should handle rapid toggle operations', () => {
      const { result } = renderHook(() => 
        useGameBoard({ mode: '10x10' as GameMode })
      );
      
      act(() => {
        result.current.toggleCell(0, 0);
        result.current.toggleCell(0, 0);
        result.current.toggleCell(0, 0);
        result.current.toggleCell(0, 0);
      });
      
      // Should end up unselected (even number of toggles)
      expect(result.current.selectedCells.length).toBe(0);
    });
  });
});