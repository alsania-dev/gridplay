/**
 * Button Component Unit Tests
 * 
 * Tests all button variants, sizes, states, and interactions.
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button, ButtonVariant, ButtonSize } from '../Button';

describe('Button Component', () => {
  // ===========================================
  // Variant Tests
  // ===========================================
  
  describe('Variants', () => {
    const variants: ButtonVariant[] = ['primary', 'secondary', 'accent', 'outline', 'ghost'];
    
    variants.forEach((variant) => {
      it(`should render ${variant} variant with correct styles`, () => {
        render(<Button variant={variant}>Click Me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });
        
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('inline-flex');
        expect(button).not.toBeDisabled();
      });
    });
    
    it('should apply primary variant styles by default', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button');
      
      // Primary variant should have green background
      expect(button).toHaveClass('bg-[#10B981]');
    });
    
    it('should apply secondary variant styles correctly', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-[#1E3A5A]');
    });
    
    it('should apply accent variant styles correctly', () => {
      render(<Button variant="accent">Accent</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-[#F59E0B]');
    });
    
    it('should apply outline variant styles correctly', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('border-2');
    });
    
    it('should apply ghost variant styles correctly', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-transparent');
    });
  });
  
  // ===========================================
  // Size Tests
  // ===========================================
  
  describe('Sizes', () => {
    const sizes: ButtonSize[] = ['sm', 'md', 'lg'];
    
    sizes.forEach((size) => {
      it(`should render ${size} size with correct padding`, () => {
        render(<Button size={size}>Size Test</Button>);
        const button = screen.getByRole('button');
        
        expect(button).toBeInTheDocument();
        
        if (size === 'sm') {
          expect(button).toHaveClass('px-3', 'py-1', 'text-xs');
        } else if (size === 'md') {
          expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
        } else {
          expect(button).toHaveClass('px-6', 'py-3', 'text-base');
        }
      });
    });
    
    it('should apply medium size by default', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('px-4', 'py-2');
    });
  });
  
  // ===========================================
  // Loading State Tests
  // ===========================================
  
  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      render(<Button loading>Loading Button</Button>);
      const button = screen.getByRole('button');
      
      // Button should be disabled when loading
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      
      // Should contain spinner SVG
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });
    
    it('should have correct spinner size for sm button', () => {
      render(<Button loading size="sm">Small Loading</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      
      expect(spinner).toHaveClass('w-3', 'h-3');
    });
    
    it('should have correct spinner size for md button', () => {
      render(<Button loading size="md">Medium Loading</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      
      expect(spinner).toHaveClass('w-4', 'h-4');
    });
    
    it('should have correct spinner size for lg button', () => {
      render(<Button loading size="lg">Large Loading</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg');
      
      expect(spinner).toHaveClass('w-5', 'h-5');
    });
    
    it('should not show left/right icons when loading', () => {
      const LeftIcon = <span data-testid="left-icon">L</span>;
      const RightIcon = <span data-testid="right-icon">R</span>;
      
      render(
        <Button loading leftIcon={LeftIcon} rightIcon={RightIcon}>
          Loading with Icons
        </Button>
      );
      
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });
  
  // ===========================================
  // Disabled State Tests
  // ===========================================
  
  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });
    
    it('should be disabled when loading is true (even if disabled is false)', () => {
      render(<Button loading={true} disabled={false}>Loading State</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
    });
    
    it('should not fire click events when disabled', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Cannot Click</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
  
  // ===========================================
  // Click Handling Tests
  // ===========================================
  
  describe('Click Handling', () => {
    it('should call onClick handler when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
    
    it('should pass event object to onClick handler', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
    
    it('should not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(<Button loading onClick={handleClick}>Loading</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
  
  // ===========================================
  // Icon Tests
  // ===========================================
  
  describe('Icons', () => {
    it('should render left icon before text', () => {
      const LeftIcon = <span data-testid="left-icon">L</span>;
      render(<Button leftIcon={LeftIcon}>With Left Icon</Button>);
      
      const button = screen.getByRole('button');
      const leftIcon = screen.getByTestId('left-icon');
      
      expect(leftIcon).toBeInTheDocument();
      expect(button.firstChild).toContainElement(leftIcon);
    });
    
    it('should render right icon after text', () => {
      const RightIcon = <span data-testid="right-icon">R</span>;
      render(<Button rightIcon={RightIcon}>With Right Icon</Button>);
      
      const button = screen.getByRole('button');
      const rightIcon = screen.getByTestId('right-icon');
      
      expect(rightIcon).toBeInTheDocument();
      expect(button.lastChild).toContainElement(rightIcon);
    });
    
    it('should render both left and right icons', () => {
      const LeftIcon = <span data-testid="left-icon">L</span>;
      const RightIcon = <span data-testid="right-icon">R</span>;
      
      render(<Button leftIcon={LeftIcon} rightIcon={RightIcon}>Both Icons</Button>);
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });
  
  // ===========================================
  // Full Width Tests
  // ===========================================
  
  describe('Full Width', () => {
    it('should apply full width class when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('w-full');
    });
    
    it('should not apply full width class by default', () => {
      render(<Button>Normal Width</Button>);
      const button = screen.getByRole('button');
      
      expect(button).not.toHaveClass('w-full');
    });
  });
  
  // ===========================================
  // Accessibility Tests
  // ===========================================
  
  describe('Accessibility', () => {
    it('should have correct role attribute', () => {
      render(<Button>Accessible Button</Button>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
    
    it('should have aria-disabled attribute when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
    
    it('should have aria-disabled attribute when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
    
    it('should support keyboard focus', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
    });
    
    it('should have focus ring styles', () => {
      render(<Button>Focus Ring</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-offset-2');
    });
  });
  
  // ===========================================
  // Custom Props Tests
  // ===========================================
  
  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('custom-class');
    });
    
    it('should spread additional HTML attributes', () => {
      render(<Button data-testid="custom-button" type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('data-testid', 'custom-button');
    });
    
    it('should support form attribute', () => {
      render(<Button form="my-form">Submit Form</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('form', 'my-form');
    });
  });
  
  // ===========================================
  // Edge Cases
  // ===========================================
  
  describe('Edge Cases', () => {
    it('should render with empty children', () => {
      render(<Button>{''}</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeInTheDocument();
    });
    
    it('should render with complex children', () => {
      render(
        <Button>
          <span>Part 1</span>
          <span>Part 2</span>
        </Button>
      );
      
      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText('Part 2')).toBeInTheDocument();
    });
    
    it('should handle multiple rapid clicks', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Rapid Click</Button>);
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });
});