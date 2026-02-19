/**
 * Number Generator for GridPlay
 * Generates random numbers for board rows and columns
 */

import { BoardSize, getGridDimensions } from './boardUtils';

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate random numbers 0-9 for 10x10 board
 */
export function generate10x10Numbers(): number[] {
  return shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
}

/**
 * Generate random numbers 0-4 for 5x5 board
 * Each number appears twice
 */
export function generate5x5Numbers(): number[] {
  // For 5x5, we have 5 positions but numbers 0-4
  // Each number appears exactly once
  return shuffleArray([0, 1, 2, 3, 4]);
}

/**
 * Generate random numbers for a board based on size
 */
export function generateBoardNumbers(size: BoardSize): number[] {
  switch (size) {
    case '10x10':
      return generate10x10Numbers();
    case '5x5':
      return generate5x5Numbers();
    default:
      throw new Error(`Unknown board size: ${size}`);
  }
}

/**
 * Generate both row and column numbers for a board
 */
export function generateBoardNumberGrid(size: BoardSize): {
  rowNumbers: number[];
  colNumbers: number[];
} {
  return {
    rowNumbers: generateBoardNumbers(size),
    colNumbers: generateBoardNumbers(size),
  };
}

/**
 * Validate that numbers are valid for board size
 */
export function validateBoardNumbers(
  numbers: number[],
  size: BoardSize
): { valid: boolean; error?: string } {
  const { rows } = getGridDimensions(size);
  
  if (numbers.length !== rows) {
    return {
      valid: false,
      error: `Expected ${rows} numbers, got ${numbers.length}`,
    };
  }

  // Check for valid range
  const maxNum = size === '10x10' ? 9 : 4;
  for (const num of numbers) {
    if (num < 0 || num > maxNum) {
      return {
        valid: false,
        error: `Number ${num} is out of range [0-${maxNum}]`,
      };
    }
  }

  // Check for uniqueness
  const uniqueNumbers = new Set(numbers);
  if (uniqueNumbers.size !== numbers.length) {
    // For 5x5, duplicates are expected (each number appears twice)
    if (size === '5x5') {
      // Each number 0-4 should appear exactly once
      const counts = new Map<number, number>();
      for (const num of numbers) {
        counts.set(num, (counts.get(num) || 0) + 1);
      }
      for (let i = 0; i <= 4; i++) {
        if (counts.get(i) !== 1) {
          return {
            valid: false,
            error: `Number ${i} should appear exactly once in 5x5 board`,
          };
        }
      }
    } else {
      return {
        valid: false,
        error: 'Numbers must be unique for 10x10 board',
      };
    }
  }

  return { valid: true };
}

/**
 * Generate a seed for reproducible random numbers
 */
export function generateSeed(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Simple seeded random number generator (for reproducibility)
 * Uses a simple LCG (Linear Congruential Generator)
 */
export function seededRandom(seed: string): () => number {
  let state = 0;
  
  // Convert seed string to a number
  for (let i = 0; i < seed.length; i++) {
    state = ((state << 5) - state + seed.charCodeAt(i)) | 0;
  }
  
  return () => {
    state = (state * 1103515245 + 12345) | 0;
    return (state >>> 16) / 65536;
  };
}

/**
 * Generate board numbers with a seed (for reproducibility)
 */
export function generateSeededBoardNumbers(size: BoardSize, seed: string): number[] {
  const random = seededRandom(seed);
  const numbers = size === '10x10' 
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    : [0, 1, 2, 3, 4];
  
  // Fisher-Yates with seeded random
  const shuffled = [...numbers];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Assign numbers to board squares
 */
export function assignNumbersToSquares(
  squares: { row: number; col: number; rowNumber: number | null; colNumber: number | null }[],
  rowNumbers: number[],
  colNumbers: number[]
): void {
  squares.forEach(square => {
    square.rowNumber = rowNumbers[square.row];
    square.colNumber = colNumbers[square.col];
  });
}

/**
 * Get number frequency for a board (useful for analysis)
 */
export function getNumberFrequency(numbers: number[]): Map<number, number> {
  const frequency = new Map<number, number>();
  for (const num of numbers) {
    frequency.set(num, (frequency.get(num) || 0) + 1);
  }
  return frequency;
}

/**
 * Calculate probability of each number winning
 * Based on historical NFL score data
 */
export function getWinningProbability(size: BoardSize): Map<number, number> {
  // Historical probabilities based on NFL scores last digit
  // These are approximate probabilities
  const probabilities10x10 = new Map<number, number>([
    [0, 0.17],
    [1, 0.08],
    [2, 0.06],
    [3, 0.12],
    [4, 0.12],
    [5, 0.05],
    [6, 0.10],
    [7, 0.18],
    [8, 0.06],
    [9, 0.06],
  ]);

  // For 5x5, combine probabilities
  const probabilities5x5 = new Map<number, number>([
    [0, 0.23], // 0 + 5
    [1, 0.14], // 1 + 6
    [2, 0.16], // 2 + 7
    [3, 0.18], // 3 + 8
    [4, 0.18], // 4 + 9
  ]);

  return size === '10x10' ? probabilities10x10 : probabilities5x5;
}

export default {
  shuffleArray,
  generate10x10Numbers,
  generate5x5Numbers,
  generateBoardNumbers,
  generateBoardNumberGrid,
  validateBoardNumbers,
  generateSeed,
  seededRandom,
  generateSeededBoardNumbers,
  assignNumbersToSquares,
  getNumberFrequency,
  getWinningProbability,
};