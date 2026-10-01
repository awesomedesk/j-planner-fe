"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent, SyntheticEvent } from 'react';

import type { Id } from '@/types/api';

/** 필터에서 빠진 카테고리로 저장했을 때 필터 목록을 저절로 펼치는 요청 (D-056) */
export interface FilterReveal {
  categoryId: Id;
  /** 요청마다 다른 값 (같은 카테고리로 두 번 저장해도 다시 펼친다) */
  key: number;
}

/** 시간 (ms) — D-056 */
export const REVEAL_TIMING = {
  /** 펼친 직후 눌러도 반응 없는 시간 (저장 두 번 누름 방지) */
  guard: 400,
  /** 저장한 줄의 두 번째 빛 고리까지 */
  glowDelay: 500,
  /** 저절로 닫힐 때까지 */
  close: 1800,
} as const;
/** PC: 목록 안에서 마우스가 이만큼(px) 넘게 움직여야 '쓰는 중'으로 본다 (가만히 놓인 커서는 무시) */
const HOLD_MOVE_PX = 4;

interface Options {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  onDone?: () => void;
  /** PC 드롭다운만: 마우스 움직임도 붙잡은 것으로 본다 */
  trackMouseMove?: boolean;
}

/**
 * 필터 목록 저절로 펼치기 (D-056)
 * - 펼치고 저장한 카테고리 줄에 표시(marked), 0.5초 뒤 빛 고리(glow), 1.8초 뒤 닫는다
 * - 동작 줄이기면 아예 요청하지 않는다 (useHiddenSaveNotice)
 * - 펼친 직후 0.4초는 눌러도 무시. 그 뒤 누르거나 포커스하면(PC는 마우스를 움직여도) 닫지 않는다
 * @returns 목록 틀에 붙일 panelProps, 줄 표시용 markedId·glow, 버튼 커짐용 pulse
 */
export function useFilterReveal(reveal: FilterReveal | null | undefined, { isOpen, open, close, onDone, trackMouseMove = false }: Options) {
  const [state, setState] = useState<{ markedId: Id; glow: boolean; pulse: boolean } | null>(null);
  const openedAt = useRef(0);
  const held = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const callbacks = useRef({ open, close, onDone });
  callbacks.current = { open, close, onDone };

  useEffect(() => {
    if (!reveal) return undefined;
    callbacks.current.open();
    openedAt.current = Date.now();
    held.current = false;
    lastPoint.current = null;
    setState({ markedId: reveal.categoryId, glow: false, pulse: true });
    const timers = [
      setTimeout(() => setState((s) => s && { ...s, glow: true }), REVEAL_TIMING.glowDelay),
      setTimeout(() => {
        if (!held.current) callbacks.current.close();
        callbacks.current.onDone?.();
      }, REVEAL_TIMING.close),
    ];
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [reveal]);

  // 목록이 닫히면 표시도 지운다 (열림 → 닫힘일 때만)
  const wasOpen = useRef(isOpen);
  useEffect(() => {
    if (wasOpen.current && !isOpen) setState(null);
    wasOpen.current = isOpen;
  }, [isOpen]);

  const isGuarded = () => state !== null && Date.now() - openedAt.current < REVEAL_TIMING.guard;
  const hold = useCallback(() => {
    if (Date.now() - openedAt.current >= REVEAL_TIMING.guard) held.current = true;
  }, []);

  const panelProps = {
    onClickCapture: (event: SyntheticEvent) => {
      if (!isGuarded()) return;
      event.preventDefault();
      event.stopPropagation();
    },
    onPointerDownCapture: () => state && hold(),
    onFocusCapture: () => state && hold(),
    onPointerMove: (event: PointerEvent) => {
      if (!state || !trackMouseMove || event.pointerType !== 'mouse') return;
      const last = lastPoint.current;
      if (last && Math.hypot(event.clientX - last.x, event.clientY - last.y) > HOLD_MOVE_PX) hold();
      lastPoint.current = { x: event.clientX, y: event.clientY };
    },
  };

  return { panelProps, markedId: state?.markedId ?? null, glow: state?.glow ?? false, pulse: state?.pulse ?? false };
}
