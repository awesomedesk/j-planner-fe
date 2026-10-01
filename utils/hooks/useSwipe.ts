"use client";

import { useCallback, useRef, useState, type CSSProperties, type TouchEvent, type TransitionEvent } from 'react';

import { useMediaQuery } from './useMediaQuery';

/** 이만큼(px) 넘게 옆으로 밀어야 넘긴다 */
export const SWIPE_MIN_DISTANCE = 50;
/** 옆으로 민 거리가 세로의 이만큼 배는 넘어야 한다 (시간표 세로 스크롤과 헷갈리지 않게) */
const HORIZONTAL_RATIO = 1.5;
/** 이만큼 움직이면 가로·세로 중 어느 쪽으로 미는지 정한다 */
const AXIS_LOCK_DISTANCE = 10;
const SETTLE_TRANSITION = 'transform 200ms ease-out';

interface UseSwipeOptions {
  /** 오른쪽으로 밀었을 때 (이전) */
  onPrev: () => void;
  /** 왼쪽으로 밀었을 때 (다음) */
  onNext: () => void;
}

interface Gesture {
  x: number;
  y: number;
  width: number;
  axis: 'x' | 'y' | null;
}

const isHorizontal = (dx: number, dy: number) => Math.abs(dx) >= Math.abs(dy) * HORIZONTAL_RATIO;

/**
 * 좌우 스와이프로 넘기기 (모바일 날짜 이동, D-025 · D-051)
 * - `handlers`는 손가락을 받을 영역에, `style`은 그 안에서 움직일 내용에 붙인다
 * - 가로로 분명히 미는 동안 내용이 손가락을 따라 움직이고, 넘기면 다음 화면이 민 쪽에서 이어서 들어온다
 * - 조금만 밀고 놓으면 제자리로. 움직임 줄이기 설정(prefers-reduced-motion)이면 효과 없이 바로 바뀐다
 * - `data-swipe-ignore` 안(좌우로 스크롤하는 탭 줄 등)에서 시작한 밀기는 무시한다
 */
export function useSwipe({ onPrev, onNext }: UseSwipeOptions) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const gesture = useRef<Gesture | null>(null);
  /** null = 움직이지 않음 (transform 없음) */
  const [offset, setOffset] = useState<number | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  /** 지금 자리에서 제자리(0)로 미끄러지기 */
  const settle = useCallback((from: number) => {
    setIsSettling(false);
    setOffset(from);
    requestAnimationFrame(() => {
      setIsSettling(true);
      setOffset(0);
    });
  }, []);

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    const ignored = (event.target as Element).closest?.('[data-swipe-ignore]');
    const touch = event.touches[0];
    gesture.current =
      ignored || !touch ? null : { x: touch.clientX, y: touch.clientY, width: event.currentTarget.clientWidth, axis: null };
  };

  const onTouchMove = (event: TouchEvent<HTMLElement>) => {
    const current = gesture.current;
    const touch = event.touches[0];
    if (!current || !touch || reduceMotion) return;
    const dx = touch.clientX - current.x;
    const dy = touch.clientY - current.y;
    if (!current.axis && Math.max(Math.abs(dx), Math.abs(dy)) >= AXIS_LOCK_DISTANCE) {
      current.axis = isHorizontal(dx, dy) ? 'x' : 'y';
    }
    if (current.axis !== 'x') return;
    setIsSettling(false);
    setOffset(dx);
  };

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const current = gesture.current;
    gesture.current = null;
    const touch = event.changedTouches[0];
    if (!current || !touch) return;
    const dx = touch.clientX - current.x;
    const dy = touch.clientY - current.y;
    const followed = !reduceMotion && current.axis === 'x';
    const passes = Math.abs(dx) >= SWIPE_MIN_DISTANCE && isHorizontal(dx, dy) && current.axis !== 'y';

    if (!passes) {
      if (followed) {
        setIsSettling(true);
        setOffset(0);
      }
      return;
    }
    if (dx < 0) onNext();
    else onPrev();
    // 새 화면은 '다음 장'이 있던 자리(민 거리만큼 들어온 곳)에서 시작해 제자리로
    if (followed) settle(Math.sign(dx) * -(current.width - Math.abs(dx)));
  };

  const onTouchCancel = () => {
    gesture.current = null;
    if (offset) {
      setIsSettling(true);
      setOffset(0);
    }
  };

  const style: CSSProperties | undefined =
    offset === null
      ? undefined
      : {
          transform: `translateX(${offset}px)`,
          transition: isSettling ? SETTLE_TRANSITION : undefined,
        };

  return {
    handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel },
    style,
    /** 제자리로 돌아온 뒤 transform을 지운다 (고정 위치 자식이 틀어지지 않게) */
    onTransitionEnd: (event: TransitionEvent<HTMLElement>) => {
      // 안쪽 요소의 transition이 올라온 것은 무시
      if (event.target !== event.currentTarget || event.propertyName !== 'transform') return;
      setIsSettling(false);
      setOffset(null);
    },
  };
}
