/**
 * useTimer Hook Unit Tests
 * 
 * Tests countdown functionality, start/pause/reset, and completion callback.
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useTimer, formatTime, formatTimeLong, parseTimeString } from '../useTimer';

// Mock timers
jest.useFakeTimers();

describe('useTimer Hook', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  // ===========================================
  // Initialization Tests
  // ===========================================
  
  describe('Initialization', () => {
    it('should initialize with provided initial time', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 600 }));
      
      expect(result.current.time).toBe(600);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.hasEnded).toBe(false);
    });
    
    it('should auto-start when autoStart is true', () => {
      const { result } = renderHook(() => 
        useTimer({ initialTime: 300, autoStart: true })
      );
      
      expect(result.current.isRunning).toBe(true);
    });
    
    it('should not auto-start by default', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 300 }));
      
      expect(result.current.isRunning).toBe(false);
    });
    
    it('should initialize with hasEnded false', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 0 }));
      
      expect(result.current.hasEnded).toBe(false);
    });
  });
  
  // ===========================================
  // Countdown Functionality Tests
  // ===========================================
  
  describe('Countdown Functionality', () => {
    it('should count down every second when running', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 10 }));
      
      act(() => {
        result.current.start();
      });
      
      expect(result.current.time).toBe(10);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(result.current.time).toBe(9);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      expect(result.current.time).toBe(8);
    });
    
    it('should not count down when paused', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 10 }));
      
      act(() => {
        result.current.start();
      });
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      expect(result.current.time).toBe(7);
      
      act(() => {
        result.current.pause();
      });
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(result.current.time).toBe(7);
    });
    
    it('should count down to zero and stop', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 3 }));
      
      act(() => {
        result.current.start();
      });
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      expect(result.current.time).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.hasEnded).toBe(true);
    });
    
    it('should not go below zero', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 2 }));
      
      act(() => {
        result.current.start();
      });
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(result.current.time).toBe(0);
    });
  });
  
  // ===========================================
  // Start/Pause/Reset Tests
  // ===========================================
  
  describe('Start/Pause/Reset', () => {
    it('should start the timer', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 60 }));
      
      expect(result.current.isRunning).toBe(false);
      
      act(() => {
        result.current.start();
      });
      
      expect(result.current.isRunning).toBe(true);
    });
    
    it('should not start if time is zero', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 0 }));
      
      act(() => {
        result.current.start();
      });
      
      expect(result.current.isRunning).toBe(false);
    });
    
    it('should pause the timer', () => {
      const { result } = renderHook(() => 
        useTimer({ initialTime: 60, autoStart: true })
      );
      
      expect(result.current.isRunning).toBe(true);
      
      act(() => {
        result.current.pause();
      });
      
      expect(result.current.isRunning).toBe(false);
    });
    
    it('should reset the timer to initial time', () => {
      const { result } = renderHook(() => 
        useTimer({ initialTime: 100, autoStart: true })
      );
      
      act(() => {
        jest.advanceTimersByTime(50);
      });
      
      expect(result.current.time).toBe(50);
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.time).toBe(100);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.hasEnded).toBe(false);
    });
    
    it('should restart (reset and start) the timer', () => {
      const { result } = renderHook(() => 
        useTimer({ initialTime: 100, autoStart: true })
      );
      
      act(() => {
        jest.advanceTimersByTime(50);
      });
      
      expect(result.current.time).toBe(50);
      
      act(() => {
        result.current.restart();
      });
      
      expect(result.current.time).toBe(100);
      expect(result.current.isRunning).toBe(true);
      expect(result.current.hasEnded).toBe(false);
    });
    
    it('should clear hasEnded on start', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 2 }));
      
      act(() => {
        result.current.start();
      });
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      expect(result.current.hasEnded).toBe(true);
      
      act(() => {
        result.current.reset();
        result.current.start();
      });
      
      expect(result.current.hasEnded).toBe(false);
    });
  });
  
  // ===========================================
  // Completion Callback Tests
  // ===========================================
  
  describe('Completion Callback', () => {
    it('should call onEnd when timer reaches zero', () => {
      const onEnd = jest.fn();
      const { result } = renderHook(() => 
        useTimer({ initialTime: 3, onEnd })
      );
      
      act(() => {
        result.current.start();
      });
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      expect(onEnd).toHaveBeenCalledTimes(1);
    });
    
    it('should not call onEnd before timer reaches zero', () => {
      const onEnd = jest.fn();
      const { result } = renderHook(() => 
        useTimer({ initialTime: 10, onEnd })
      );
      
      act(() => {
        result.current.start();
      });
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(onEnd).not.toHaveBeenCalled();
    });
    
    it('should call onTick on each tick', () => {
      const onTick = jest.fn();
      const { result } = renderHook(() => 
        useTimer({ initialTime: 5, onTick })
      );
      
      act(() => {
        result.current.start();
      });
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      // Should be called 3 times (for each second)
      expect(onTick).toHaveBeenCalledTimes(3);
      expect(onTick).toHaveBeenNthCalledWith(1, 4);
      expect(onTick).toHaveBeenNthCalledWith(2, 3);
      expect(onTick).toHaveBeenNthCalledWith(3, 2);
    });
  });
  
  // ===========================================
  // Target Time Mode Tests
  // ===========================================
  
  describe('Target Time Mode', () => {
    it('should set target time and count down to it', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 0 }));
      
      // Set target time 10 seconds in the future
      const targetTime = Date.now() + 10000;
      
      act(() => {
        result.current.setTargetTime(targetTime);
      });
      
      expect(result.current.isRunning).toBe(true);
    });
    
    it('should count down based on target timestamp', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 0 }));
      
      const targetTime = Date.now() + 5000;
      
      act(() => {
        result.current.setTargetTime(targetTime);
      });
      
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      // Should have ~3 seconds remaining
      expect(result.current.time).toBeCloseTo(3, 0);
    });
  });
  
  // ===========================================
  // Time Formatting Tests
  // ===========================================
  
  describe('Time Formatting', () => {
    it('should format time as MM:SS', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 125 }));
      
      // 125 seconds = 2:05
      expect(result.current.formatted).toBe('02:05');
    });
    
    it('should format zero as 00:00', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 0 }));
      
      expect(result.current.formatted).toBe('00:00');
    });
    
    it('should format large times correctly', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 3661 }));
      
      // 3661 seconds = 61:01 (or 1:01:01)
      expect(result.current.formatted).toBe('61:01');
    });
    
    it('should format time as HH:MM:SS for formattedLong', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 3661 }));
      
      // 3661 seconds = 1:01:01
      expect(result.current.formattedLong).toBe('01:01:01');
    });
    
    it('should format times under 1 hour as MM:SS for formattedLong', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 125 }));
      
      expect(result.current.formattedLong).toBe('02:05');
    });
  });
  
  // ===========================================
  // Helper Function Tests
  // ===========================================
  
  describe('Helper Functions', () => {
    describe('formatTime', () => {
      it('should format seconds as MM:SS', () => {
        expect(formatTime(0)).toBe('00:00');
        expect(formatTime(59)).toBe('00:59');
        expect(formatTime(60)).toBe('01:00');
        expect(formatTime(125)).toBe('02:05');
        expect(formatTime(3600)).toBe('60:00');
      });
    });
    
    describe('formatTimeLong', () => {
      it('should format seconds as HH:MM:SS when over an hour', () => {
        expect(formatTimeLong(3661)).toBe('01:01:01');
        expect(formatTimeLong(7200)).toBe('02:00:00');
        expect(formatTimeLong(3599)).toBe('59:59');
      });
      
      it('should format seconds as MM:SS when under an hour', () => {
        expect(formatTimeLong(59)).toBe('00:59');
        expect(formatTimeLong(60)).toBe('01:00');
        expect(formatTimeLong(3599)).toBe('59:59');
      });
    });
    
    describe('parseTimeString', () => {
      it('should parse MM:SS format', () => {
        expect(parseTimeString('00:00')).toBe(0);
        expect(parseTimeString('01:00')).toBe(60);
        expect(parseTimeString('02:05')).toBe(125);
        expect(parseTimeString('10:30')).toBe(630);
      });
      
      it('should parse HH:MM:SS format', () => {
        expect(parseTimeString('01:01:01')).toBe(3661);
        expect(parseTimeString('02:00:00')).toBe(7200);
        expect(parseTimeString('00:30:00')).toBe(1800);
      });
      
      it('should return 0 for invalid format', () => {
        expect(parseTimeString('invalid')).toBe(0);
        expect(parseTimeString('')).toBe(0);
        expect(parseTimeString('1:2:3:4')).toBe(0);
      });
    });
  });
  
  // ===========================================
  // Custom Interval Tests
  // ===========================================
  
  describe('Custom Interval', () => {
    it('should use custom interval when provided', () => {
      const onTick = jest.fn();
      const { result } = renderHook(() => 
        useTimer({ initialTime: 10, interval: 500, onTick })
      );
      
      act(() => {
        result.current.start();
      });
      
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // With 500ms interval, 1.5 seconds should trigger 3 ticks
      expect(onTick).toHaveBeenCalledTimes(3);
    });
  });
  
  // ===========================================
  // Edge Cases
  // ===========================================
  
  describe('Edge Cases', () => {
    it('should handle very large initial times', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 86400 }));
      
      expect(result.current.time).toBe(86400);
      expect(result.current.formattedLong).toBe('24:00:00');
    });
    
    it('should handle starting an already running timer', () => {
      const { result } = renderHook(() => 
        useTimer({ initialTime: 60, autoStart: true })
      );
      
      // Timer is already running
      expect(result.current.isRunning).toBe(true);
      
      // Start again should not cause issues
      act(() => {
        result.current.start();
      });
      
      expect(result.current.isRunning).toBe(true);
    });
    
    it('should handle pausing an already paused timer', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 60 }));
      
      expect(result.current.isRunning).toBe(false);
      
      act(() => {
        result.current.pause();
      });
      
      expect(result.current.isRunning).toBe(false);
    });
    
    it('should handle reset when timer has ended', () => {
      const onEnd = jest.fn();
      const { result } = renderHook(() => 
        useTimer({ initialTime: 2, onEnd })
      );
      
      act(() => {
        result.current.start();
      });
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      expect(result.current.hasEnded).toBe(true);
      expect(onEnd).toHaveBeenCalled();
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.time).toBe(2);
      expect(result.current.hasEnded).toBe(false);
    });
    
    it('should cleanup interval on unmount', () => {
      const { unmount } = renderHook(() => 
        useTimer({ initialTime: 60, autoStart: true })
      );
      
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
    
    it('should handle multiple start/pause cycles', () => {
      const { result } = renderHook(() => useTimer({ initialTime: 100 }));
      
      // First cycle
      act(() => {
        result.current.start();
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      act(() => {
        result.current.pause();
      });
      
      expect(result.current.time).toBe(90);
      
      // Second cycle
      act(() => {
        result.current.start();
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      act(() => {
        result.current.pause();
      });
      
      expect(result.current.time).toBe(80);
      
      // Third cycle
      act(() => {
        result.current.start();
      });
      
      act(() => {
        jest.advanceTimersByTime(10);
      });
      
      expect(result.current.time).toBe(70);
    });
  });
});