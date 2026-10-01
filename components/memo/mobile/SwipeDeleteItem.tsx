"use client";

import { useRef, useState, type ReactNode, type TouchEvent } from 'react';

import { SWIPE_MIN_DISTANCE } from '@utils/hooks/useSwipe';

/** 밀었을 때 드러나는 삭제 버튼 폭 (px) */
const DELETE_BUTTON_WIDTH = 72;
/** 옆으로 민 거리가 세로의 이만큼 배는 넘어야 한다 (목록 세로 스크롤과 헷갈리지 않게) */
const HORIZONTAL_RATIO = 1.5;

interface SwipeDeleteItemProps {
  onDelete: () => void;
  isDeleting?: boolean;
  /** 카드 (밀린 상태에서 누르면 원래 자리로) */
  children: (props: { isRevealed: boolean; close: () => void }) => ReactNode;
}

/**
 * SwipeDeleteItem - 왼쪽으로 밀면 오른쪽에 '삭제' 버튼이 드러나는 목록 줄 (MO-14, D-030 · D-055)
 * 오른쪽으로 밀면 다시 들어간다. 날짜 넘기기 스와이프와 겹치지 않게 data-swipe-ignore.
 */
export default function SwipeDeleteItem({ onDelete, isDeleting = false, children }: SwipeDeleteItemProps) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleTouchStart = (event: TouchEvent<HTMLLIElement>) => {
    const touch = event.touches[0];
    start.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLLIElement>) => {
    const origin = start.current;
    const touch = event.changedTouches[0];
    start.current = null;
    if (!origin || !touch) return;
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * HORIZONTAL_RATIO) return;
    setIsRevealed(dx < 0);
  };

  return (
    <li
      data-swipe-ignore
      className="relative overflow-hidden rounded-xl"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => (start.current = null)}
    >
      {isRevealed && (
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="absolute inset-y-0 right-0 flex items-center justify-center bg-danger text-sm font-semibold text-white disabled:opacity-60"
          style={{ width: DELETE_BUTTON_WIDTH }}
        >
          삭제
        </button>
      )}
      <div
        className="relative transition-transform duration-200"
        style={{ transform: isRevealed ? `translateX(-${DELETE_BUTTON_WIDTH}px)` : undefined }}
      >
        {children({ isRevealed, close: () => setIsRevealed(false) })}
      </div>
    </li>
  );
}
