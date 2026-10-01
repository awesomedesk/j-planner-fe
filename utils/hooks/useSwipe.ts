"use client";

import { useRef, type TouchEvent } from 'react';

/** 이만큼(px) 넘게 옆으로 밀어야 넘긴다 */
export const SWIPE_MIN_DISTANCE = 50;
/** 옆으로 민 거리가 세로의 이만큼 배는 넘어야 한다 (시간표 세로 스크롤과 헷갈리지 않게) */
const HORIZONTAL_RATIO = 1.5;

interface UseSwipeOptions {
  /** 오른쪽으로 밀었을 때 (이전) */
  onPrev: () => void;
  /** 왼쪽으로 밀었을 때 (다음) */
  onNext: () => void;
}

/**
 * 좌우 스와이프로 넘기기 (모바일 날짜 이동, D-025)
 * 돌려받은 핸들러를 넘길 영역에 펼쳐 붙인다. `data-swipe-ignore` 안(좌우로 스크롤하는 탭 줄 등)에서 시작한 밀기는 무시한다.
 */
export function useSwipe({ onPrev, onNext }: UseSwipeOptions) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (event: TouchEvent) => {
    const ignored = (event.target as Element).closest?.('[data-swipe-ignore]');
    const touch = event.touches[0];
    start.current = ignored || !touch ? null : { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: TouchEvent) => {
    const from = start.current;
    start.current = null;
    const touch = event.changedTouches[0];
    if (!from || !touch) return;
    const dx = touch.clientX - from.x;
    const dy = touch.clientY - from.y;
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * HORIZONTAL_RATIO) return;
    if (dx < 0) onNext();
    else onPrev();
  };

  return { onTouchStart, onTouchEnd };
}
