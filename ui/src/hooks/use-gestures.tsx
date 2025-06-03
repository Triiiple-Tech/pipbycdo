import { useEffect, useRef, useState } from 'react';

interface TouchPosition {
  x: number;
  y: number;
}

interface GestureState {
  isGesturing: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  velocity: number;
  startPosition: TouchPosition | null;
  currentPosition: TouchPosition | null;
}

interface GestureCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onTap?: () => void;
  onLongPress?: () => void;
}

interface GestureOptions {
  swipeThreshold?: number; // Minimum distance for swipe
  velocityThreshold?: number; // Minimum velocity for swipe
  longPressDelay?: number; // Time for long press
  pinchThreshold?: number; // Minimum scale change for pinch
  enabled?: boolean;
}

export function useGestures(
  callbacks: GestureCallbacks = {},
  options: GestureOptions = {}
) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [gestureState, setGestureState] = useState<GestureState>({
    isGesturing: false,
    direction: null,
    distance: 0,
    velocity: 0,
    startPosition: null,
    currentPosition: null,
  });

  const {
    swipeThreshold = 50,
    velocityThreshold = 0.5,
    longPressDelay = 500,
    pinchThreshold = 0.1,
    enabled = true,
  } = options;

  const touchStartRef = useRef<TouchPosition | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialPinchDistanceRef = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    const getTouchPosition = (touch: Touch): TouchPosition => ({
      x: touch.clientX,
      y: touch.clientY,
    });

    const getDistance = (pos1: TouchPosition, pos2: TouchPosition): number => {
      return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
    };

    const getPinchDistance = (touches: TouchList): number => {
      if (touches.length < 2) return 0;
      const touch1 = touches[0];
      const touch2 = touches[1];
      return getDistance(getTouchPosition(touch1), getTouchPosition(touch2));
    };

    const getSwipeDirection = (
      start: TouchPosition,
      end: TouchPosition
    ): 'left' | 'right' | 'up' | 'down' | null => {
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (Math.max(absDeltaX, absDeltaY) < swipeThreshold) {
        return null;
      }

      if (absDeltaX > absDeltaY) {
        return deltaX > 0 ? 'right' : 'left';
      } else {
        return deltaY > 0 ? 'down' : 'up';
      }
    };

    const clearLongPressTimer = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const position = getTouchPosition(touch);
      
      touchStartRef.current = position;
      touchStartTimeRef.current = Date.now();

      setGestureState(prev => ({
        ...prev,
        isGesturing: true,
        startPosition: position,
        currentPosition: position,
      }));

      // Handle pinch gesture
      if (e.touches.length === 2) {
        initialPinchDistanceRef.current = getPinchDistance(e.touches);
      }

      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        callbacks.onLongPress?.();
      }, longPressDelay);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling during gesture
      
      const touch = e.touches[0];
      const position = getTouchPosition(touch);

      if (!touchStartRef.current) return;

      const distance = getDistance(touchStartRef.current, position);
      const direction = getSwipeDirection(touchStartRef.current, position);

      setGestureState(prev => ({
        ...prev,
        currentPosition: position,
        distance,
        direction,
      }));

      // Handle pinch gesture
      if (e.touches.length === 2 && callbacks.onPinch) {
        const currentPinchDistance = getPinchDistance(e.touches);
        if (initialPinchDistanceRef.current > 0) {
          const scale = currentPinchDistance / initialPinchDistanceRef.current;
          if (Math.abs(scale - 1) > pinchThreshold) {
            callbacks.onPinch(scale);
          }
        }
      }

      // Clear long press if moving too much
      if (distance > 10) {
        clearLongPressTimer();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      clearLongPressTimer();

      if (!touchStartRef.current) return;

      const endTime = Date.now();
      const duration = endTime - touchStartTimeRef.current;
      const touch = e.changedTouches[0];
      const endPosition = getTouchPosition(touch);

      const distance = getDistance(touchStartRef.current, endPosition);
      const velocity = distance / duration;

      const direction = getSwipeDirection(touchStartRef.current, endPosition);

      setGestureState(prev => ({
        ...prev,
        isGesturing: false,
        velocity,
      }));

      // Handle swipe gestures
      if (direction && velocity > velocityThreshold) {
        switch (direction) {
          case 'left':
            callbacks.onSwipeLeft?.();
            break;
          case 'right':
            callbacks.onSwipeRight?.();
            break;
          case 'up':
            callbacks.onSwipeUp?.();
            break;
          case 'down':
            callbacks.onSwipeDown?.();
            break;
        }
      } else if (distance < 10 && duration < 300) {
        // Handle tap gesture
        callbacks.onTap?.();
      }

      // Reset refs
      touchStartRef.current = null;
      touchStartTimeRef.current = 0;
      initialPinchDistanceRef.current = 0;
    };

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      clearLongPressTimer();
    };
  }, [callbacks, enabled, swipeThreshold, velocityThreshold, longPressDelay, pinchThreshold]);

  return {
    ref: elementRef,
    gestureState,
  };
}

// Predefined gesture configurations
export const GesturePresets = {
  swipeNavigation: {
    swipeThreshold: 100,
    velocityThreshold: 0.3,
  },
  quickSwipe: {
    swipeThreshold: 30,
    velocityThreshold: 0.8,
  },
  preciseSwipe: {
    swipeThreshold: 80,
    velocityThreshold: 0.2,
  },
} as const;

// Hook for simple swipe detection
export function useSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  options: GestureOptions = {}
) {
  return useGestures(
    {
      onSwipeLeft,
      onSwipeRight,
    },
    options
  );
}