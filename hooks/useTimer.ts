/**
 * GridPlay useTimer Hook
 * 
 * Countdown timer functionality with start/stop/reset controls.
 * Used for game start countdowns and in-game timers.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseTimerOptions {
  /** Initial time in seconds */
  initialTime: number;
  /** Callback when timer reaches zero */
  onEnd?: () => void;
  /** Callback on each tick */
  onTick?: (remainingTime: number) => void;
  /** Auto-start the timer */
  autoStart?: boolean;
  /** Update interval in milliseconds */
  interval?: number;
}

export interface UseTimerReturn {
  /** Remaining time in seconds */
  time: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Whether the timer has ended */
  hasEnded: boolean;
  /** Start the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Reset the timer to initial time */
  reset: () => void;
  /** Reset and start the timer */
  restart: () => void;
  /** Set a new target time (absolute timestamp in milliseconds) */
  setTargetTime: (timestamp: number) => void;
  /** Format time as MM:SS */
  formatted: string;
  /** Format time as HH:MM:SS */
  formattedLong: string;
}

/**
 * Custom hook for countdown timer functionality
 * 
 * @example
 * ```tsx
 * const timer = useTimer({
 *   initialTime: 600, // 10 minutes
 *   onEnd: () => console.log('Time is up!'),
 *   autoStart: false,
 * });
 * 
 * return (
 *   <div>
 *     <p>Time remaining: {timer.formatted}</p>
 *     <button onClick={timer.start}>Start</button>
 *     <button onClick={timer.pause}>Pause</button>
 *     <button onClick={timer.reset}>Reset</button>
 *   </div>
 * );
 * ```
 */
export function useTimer(options: UseTimerOptions): UseTimerReturn {
  const {
    initialTime,
    onEnd,
    onTick,
    autoStart = false,
    interval = 1000,
  } = options;

  const [time, setTime] = useState<number>(initialTime);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);
  const [hasEnded, setHasEnded] = useState<boolean>(false);
  const [targetTime, setTargetTimeState] = useState<number | null>(null);

  // Use refs for callbacks to avoid re-renders
  const onEndRef = useRef(onEnd);
  const onTickRef = useRef(onTick);

  // Update refs when callbacks change
  useEffect(() => {
    onEndRef.current = onEnd;
    onTickRef.current = onTick;
  }, [onEnd, onTick]);

  // Main timer effect
  useEffect(() => {
    if (!isRunning || time <= 0) {
      return;
    }

    const tick = () => {
      setTime((prevTime) => {
        const newTime = prevTime - 1;
        
        // Call onTick callback
        if (onTickRef.current) {
          onTickRef.current(newTime);
        }

        // Check if timer ended
        if (newTime <= 0) {
          setIsRunning(false);
          setHasEnded(true);
          
          // Call onEnd callback
          if (onEndRef.current) {
            onEndRef.current();
          }
          
          return 0;
        }

        return newTime;
      });
    };

    const timerId = setInterval(tick, interval);

    return () => {
      clearInterval(timerId);
    };
  }, [isRunning, interval, time]);

  // Effect for target time mode (countdown to specific timestamp)
  useEffect(() => {
    if (targetTime === null || !isRunning) {
      return;
    }

    const updateFromTarget = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((targetTime - now) / 1000));
      
      setTime(remaining);
      
      if (onTickRef.current) {
        onTickRef.current(remaining);
      }

      if (remaining <= 0) {
        setIsRunning(false);
        setHasEnded(true);
        
        if (onEndRef.current) {
          onEndRef.current();
        }
      }
    };

    // Update immediately
    updateFromTarget();

    // Then update every second
    const timerId = setInterval(updateFromTarget, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [targetTime, isRunning, onEnd]);

  // Start the timer
  const start = useCallback(() => {
    if (time > 0) {
      setIsRunning(true);
      setHasEnded(false);
    }
  }, [time]);

  // Pause the timer
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Reset the timer to initial time
  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(initialTime);
    setHasEnded(false);
    setTargetTimeState(null);
  }, [initialTime]);

  // Reset and start the timer
  const restart = useCallback(() => {
    setTime(initialTime);
    setHasEnded(false);
    setTargetTimeState(null);
    setIsRunning(true);
  }, [initialTime]);

  // Set a target timestamp to count down to
  const setTargetTime = useCallback((timestamp: number) => {
    setTargetTimeState(timestamp);
    setIsRunning(true);
    setHasEnded(false);
  }, []);

  // Format time as MM:SS
  const formatted = formatTime(time);

  // Format time as HH:MM:SS
  const formattedLong = formatTimeLong(time);

  return {
    time,
    isRunning,
    hasEnded,
    start,
    pause,
    reset,
    restart,
    setTargetTime,
    formatted,
    formattedLong,
  };
}

/**
 * Format seconds as MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds as HH:MM:SS
 */
export function formatTimeLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse a time string (MM:SS or HH:MM:SS) to seconds
 */
export function parseTimeString(timeString: string): number {
  const parts = timeString.split(':').map(Number);
  
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
}

export default useTimer;