'use client';

import { useRef, useCallback, useState } from 'react';

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

interface SwipeState {
  deltaX: number;
  deltaY: number;
  isSwiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 80 }: SwipeCallbacks) {
  const startPos = useRef({ x: 0, y: 0 });
  const [swipeState, setSwipeState] = useState<SwipeState>({ deltaX: 0, deltaY: 0, isSwiping: false, direction: null });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    setSwipeState({ deltaX: 0, deltaY: 0, isSwiping: true, direction: null });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;
    let direction: SwipeState['direction'] = null;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    setSwipeState({ deltaX, deltaY, isSwiping: true, direction });
  }, []);

  const onTouchEnd = useCallback(() => {
    const { deltaX, deltaY } = swipeState;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY && absX > threshold) {
      if (deltaX < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    } else if (absY > absX && absY > threshold) {
      if (deltaY < 0) onSwipeUp?.();
      else onSwipeDown?.();
    }

    setSwipeState({ deltaX: 0, deltaY: 0, isSwiping: false, direction: null });
  }, [swipeState, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    swipeState,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
