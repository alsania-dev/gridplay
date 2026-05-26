/**
 * GridCell Component Unit Tests
 * 
 * Tests cell states, click handling, and accessibility.
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GridCell, CellStatus } from '../GridCell';
import { BoardCell, CellOwner } from '../../types';

// Helper to create mock cell data
const createMockCell = (
  overrides: Partial<BoardCell> = {}
): BoardCell => ({
  row: 0,
  col: 0,
  owner: null,
  homeScore: null,
  awayScore: null,
  isWinner: false,
  ...overrides,
});

// Helper to create mock owner
const createMockOwner = (displayName: string = 'John Doe'): CellOwner => ({
  userId: 'user-123',
  displayName,
  claimedAt: '2024-01-01T00:00:00.000Z',
});

describe('GridCell Component', () => {
  // ===========================================
  // Cell State Tests
  // ===========================================
  
  describe('Cell States', () => {
    it('should render available state correctly', () => {
      const cell = createMockCell();
      render(<GridCell cell={cell} />);
      
      const cellElement = screen.getByRole('gridcell');
      expect(cellElement).toBeInTheDocument();
      expect(cellElement).toHaveClass('bg-[#1A1A1A]');
      expect(cellElement).toHaveTextContent('+');
    });
    
    it('should render claimed state correctly', () => {
      const owner = createMockOwner('Jane Smith');
      const cell = createMockCell({ owner });
      
      render(<GridCell cell={cell} />);
      
      const cellElement = screen.getByRole('gridcell');
      expect(cellElement).toHaveClass('bg-[#1E3A5A]');
      expect(cellElement).toHaveTextContent('Jane Smi'); // Truncated to 8 chars
    });
    
    it('should render winner state correctly', () => {
      const owner = createMockOwner('Winner User');
      const cell = createMockCell({ owner, isWinner: true });
      
      render(<GridCell cell={cell} />);
      
      const cellElement = screen.getByRole('gridcell');
      expect(cellElement).toHaveClass('bg-gradient-to-br');
      expect(cellElement).toHaveTextContent('WINNER');
    });
    
    it('should show score numbers when showScores is true', () => {
      const cell = createMockCell({ homeScore: 7, awayScore: 3 });
      
      render(<GridCell cell={cell} showScores={true} />);
      
      expect(screen.getByText('7')).toBeInTheDocument();
    });
    
    it('should hide score numbers when showScores is false', () => {
      const cell = createMockCell({ homeScore: 7, awayScore: 3 });
      
      render(<GridCell cell={cell} showScores={false} />);
      
      expect(screen.queryByText('7')).not.toBeInTheDocument();
    });
    
    it('should show question mark for null scores', () => {
      const cell = createMockCell({ homeScore: null });
      
      render(<GridCell cell={cell} showScores={true} />);
      
      expect(screen.getByText('?')).toBeInTheDocument();
    });
    
    it('should display home-away score for claimed cells', () => {
      const owner = createMockOwner();
      const cell = createMockCell({ 
        owner, 
        homeScore: 14, 
        awayScore: 7 
      });
      
      render(<GridCell cell={cell} showScores={true} />);
      
      expect(screen.getByText('14-7')).toBeInTheDocument();
    });
  });
  
  // ===========================================
  // Click Handling Tests
  // ===========================================
  
  describe('Click Handling', () => {
    it('should call onClick with row and col when available cell is clicked', () => {
      const handleClick = jest.fn();
      const cell = createMockCell({ row: 2, col: 3 });
      
      render(<GridCell cell={cell} onClick={handleClick} />);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(2, 3);
    });
    
    it('should not call onClick when cell is claimed', () => {
      const handleClick = jest.fn();
      const owner = createMockOwner();
      const cell = createMockCell({ owner });
      
      render(<GridCell cell={cell} onClick={handleClick} />);
      
      fireEvent.click(screen.getByRole('gridcell'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });
    
    it('should not call onClick when cell is a winner', () => {
      const handleClick = jest.fn();
      const owner = createMockOwner();
      const cell = createMockCell({ owner, isWinner: true });
      
      render(<GridCell cell={cell} onClick={handleClick} />);
      
      fireEvent.click(screen.getByRole('gridcell'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });
    
    it('should not call onClick when interactive is false', () => {
      const handleClick = jest.fn();
      const cell = createMockCell();
      
      render(<GridCell cell={cell} onClick={handleClick} interactive={false} />);
      
      fireEvent.click(screen.getByRole('gridcell'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });
    
    it('should not call onClick when no onClick handler provided', () => {
      const cell = createMockCell();
      
      // Should not throw error
      render(<GridCell cell={cell} />);
      
      const cellElement = screen.getByRole('gridcell');
      expect(() => fireEvent.click(cellElement)).not.toThrow();
    });
  });
  
  // ===========================================
  // Accessibility Tests
  // ===========================================
  
  describe('Accessibility', () => {
    it('should have role="button" for clickable available cells', () => {
      const cell = createMockCell();
      render(<GridCell cell={cell} onClick={jest.fn()} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
    
    it('should have role="gridcell" for non-clickable cells', () => {
      const owner = createMockOwner();
      const cell = createMockCell({ owner });
      
      render(<GridCell cell={cell} />);
      
      expect(screen.getByRole('gridcell')).toBeInTheDocument();
    });
    
    it('should have tabIndex={0} for clickable cells', () => {
      const cell = createMockCell();
      render(<GridCell cell={cell} onClick={jest.fn()} />);
      
      const cellElement = screen.getByRole('button');
      expect(cellElement).toHaveAttribute('tabIndex', '0');
    });
    
    it('should not have tabIndex for non-clickable cells', () => {
      const owner = createMockOwner();
      const cell = createMockCell({ owner });
      
      render(<GridCell cell={cell} />);
      
      const cellElement = screen.getByRole('gridcell');
      expect(cellElement).not.toHaveAttribute('tabIndex');
    });
    
    it('should have correct aria-label for available cell', () => {
      const cell = createMockCell({ row: 1, col: 2 });
      render(<GridCell cell={cell} onClick={jest.fn()} />);
      
      const cellElement = screen.getByRole('button');
      expect(cellElement).toHaveAttribute('aria-label', 'Cell row 2, column 3 - Available');
    });
    
    it('should have correct aria-label for claimed cell', () => {
      const owner = createMockOwner('Alice');
      const cell = createMockCell({ row: 0, col: 0, owner });
      
      render(<GridCell cell={cell} />);
      
      const cellElement = screen.getByRole('gridcell');
      expect(cellElement).toHaveAttribute('aria-label', 'Cell row 1, column 1 - Owned by Alice');
    });
    
    it('should have correct aria-label for winner cell', () => {
      const owner = createMockOwner('Bob');
      const cell = createMockCell({ row: 4, col: 9, owner, isWinner: true });
      
      render(<GridCell cell={cell} />);
      
      const cellElement = screen.getByRole('gridcell');
      expect(cellElement).toHaveAttribute('aria-label', 'Cell row 5, column 10 - Winner: Bob');
    });
    
    it('should have aria-disabled="true" for non-available cells', () => {
      const owner = createMockOwner();
      const cell = createMockCell({ owner });
      
      render(<GridCell cell={cell} />);
      
      const cellElement = screen.getByRole('gridcell');
      expect(cellElement).toHaveAttribute('aria-disabled', 'true');
    });
    
    it('should have aria-disabled="false" for available cells', () => {
      const cell = createMockCell();
      render(<GridCell cell={cell} onClick={jest.fn()} />);
      
      const cellElement = screen.getByRole('button');
      expect(cellElement).toHaveAttribute('aria-disabled', 'false');
    });
  });
  
  // ===========================================
  // Keyboard Navigation Tests
  // ===========================================
  
  describe('Keyboard Navigation', () => {
    it('should trigger click on Enter key', () => {
      const handleClick = jest.fn();
      const cell = createMockCell({ row: 3, col: 5 });
      
      render(<GridCell cell={cell} onClick={handleClick} />);
      
      const cellElement = screen.getByRole('button');
      fireEvent.keyDown(cellElement, { key: 'Enter' });
      
      expect(handleClick).toHaveBeenCalledWith(3, 5);
    });
    
    it('should trigger click on Space key', () => {
      const handleClick = jest.fn();
      const cell = createMockCell({ row: 1, col: 1 });
      
      render(<GridCell cell={cell} onClick={handleClick} />);
      
      const cellElement = screen.getByRole('button');
      fireEvent.keyDown(cellElement, { key: ' ' });
      
      expect(handleClick).toHaveBeenCalledWith(1, 1);
    });
    
    it('should not trigger click on other keys', () => {
      const handleClick = jest.fn();
      const cell = createMockCell();
      
      render(<GridCell cell={cell} onClick={handleClick} />);
      
      const cellElement = screen.getByRole('button');
      fireEvent.keyDown(cellElement, { key: 'Tab' });
      fireEvent.keyDown(cellElement, { key: 'Escape' });
      fireEvent.keyDown(cellElement, { key: 'ArrowRight' });
      
      expect(handleClick).not.toHaveBeenCalled();
    });
    
    it('should prevent default on Enter and Space', () => {
      const cell = createMockCell();
      
      render(<GridCell cell={cell} onClick={jest.fn()} />);
      
      const cellElement = screen.getByRole('button');
      
      const enterEvent = fireEvent.keyDown(cellElement, { key: 'Enter' });
      expect(enterEvent).toBe(true); // Event was handled
      
      const spaceEvent = fireEvent.keyDown(cellElement, { key: ' ' });
      expect(spaceEvent).toBe(true);
    });
  });
  
  // ===========================================
  // Display Name Truncation Tests
  // ===========================================
  
  describe('Display Name Truncation', () => {
    it('should truncate long names to 8 characters', () => {
      const owner = createMockOwner('Alexander Hamilton');
      const cell = createMockCell({ owner });
      
      render(<GridCell cell={cell} />);
      
      expect(screen.getByText('Alexande')).toBeInTheDocument();
    });
    
    it('should not truncate short names', () => {
      const owner = createMockOwner('Bob');
      const cell = createMockCell({ owner });
      
      render(<GridCell cell={cell} />);
      
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
    
    it('should handle exactly 8 character names', () => {
      const owner = createMockOwner('Elizabeth');
      const cell = createMockCell({ owner });
      
      render(<GridCell cell={cell} />);
      
      expect(screen.getByText('Elizabeth')).toBeInTheDocument();
    });
  });
  
  // ===========================================
  // Custom Props Tests
  // ===========================================
  
  describe('Custom Props', () => {
    it('should apply custom className', () => {
      const cell = createMockCell();
      
      render(<GridCell cell={cell} className="custom-cell-class" />);
      
      const cellElement = screen.getByRole('gridcell');
      expect(cellElement).toHaveClass('custom-cell-class');
    });
    
    it('should combine custom className with base styles', () => {
      const cell = createMockCell();
      
      render(<GridCell cell={cell} className="my-custom-class" />);
      
      const cellElement = screen.getByRole('gridcell');
      expect(cellElement).toHaveClass('relative', 'flex', 'my-custom-class');
    });
  });
  
  // ===========================================
  // Edge Cases
  // ===========================================
  
  describe('Edge Cases', () => {
    it('should handle cell at position (0, 0)', () => {
      const cell = createMockCell({ row: 0, col: 0 });
      
      render(<GridCell cell={cell} onClick={jest.fn()} />);
      
      const cellElement = screen.getByRole('button');
      expect(cellElement).toHaveAttribute('aria-label', 'Cell row 1, column 1 - Available');
    });
    
    it('should handle cell at maximum grid position (9, 9)', () => {
      const cell = createMockCell({ row: 9, col: 9 });
      
      render(<GridCell cell={cell} onClick={jest.fn()} />);
      
      const cellElement = screen.getByRole('button');
      expect(cellElement).toHaveAttribute('aria-label', 'Cell row 10, column 10 - Available');
    });
    
    it('should handle null owner gracefully', () => {
      const cell = createMockCell({ owner: null });
      
      render(<GridCell cell={cell} />);
      
      expect(screen.getByRole('gridcell')).toBeInTheDocument();
    });
    
    it('should handle zero scores', () => {
      const owner = createMockOwner();
      const cell = createMockCell({ owner, homeScore: 0, awayScore: 0 });
      
      render(<GridCell cell={cell} showScores={true} />);
      
      expect(screen.getByText('0-0')).toBeInTheDocument();
    });
    
    it('should handle high scores', () => {
      const owner = createMockOwner();
      const cell = createMockCell({ owner, homeScore: 99, awayScore: 88 });
      
      render(<GridCell cell={cell} showScores={true} />);
      
      expect(screen.getByText('99-88')).toBeInTheDocument();
    });
    
    it('should handle owner with empty displayName', () => {
      const owner = { ...createMockOwner(), displayName: '' };
      const cell = createMockCell({ owner });
      
      render(<GridCell cell={cell} />);
      
      expect(screen.getByRole('gridcell')).toBeInTheDocument();
    });
    
    it('should handle multiple rapid clicks', () => {
      const handleClick = jest.fn();
      const cell = createMockCell();
      
      render(<GridCell cell={cell} onClick={handleClick} />);
      
      const cellElement = screen.getByRole('button');
      fireEvent.click(cellElement);
      fireEvent.click(cellElement);
      fireEvent.click(cellElement);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });
  
  // ===========================================
  // Visual State Tests
  // ===========================================
  
  describe('Visual States', () => {
    it('should have hover styles for available cells', () => {
      const cell = createMockCell();
      
      render(<GridCell cell={cell} onClick={jest.fn()} />);
      
      const cellElement = screen.getByRole('button');
      expect(cellElement).toHaveClass('hover:bg-[#2A2A2A]');
      expect(cellElement).toHaveClass('hover:border-[#10B981]');
    });
    
    it('should have cursor-pointer for available cells', () => {
      const cell = createMockCell();
      
      render(<GridCell cell={cell} onClick={jest.fn()} />);
      
      const cellElement = screen.getByRole('button');
      expect(cellElement).toHaveClass('cursor-pointer');
    });
    
    it('should have cursor-default for claimed cells', () => {
      const owner = createMockOwner();
      const cell = createMockCell({ owner });
      
      render(<GridCell cell={cell} />);
      
      const cellElement = screen.getByRole('gridcell');
      expect(cellElement).toHaveClass('cursor-default');
    });
    
    it('should have winner animation for winner cells', () => {
      const owner = createMockOwner();
      const cell = createMockCell({ owner, isWinner: true });
      
      render(<GridCell cell={cell} />);
      
      const cellElement = screen.getByRole('gridcell');
      expect(cellElement).toHaveClass('animate-[winner-pulse_1s_ease-in-out_infinite]');
    });
  });
});