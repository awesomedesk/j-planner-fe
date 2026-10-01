"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import {
  dragCreateRange,
  draftRange,
  moveDraftRange,
  resizeDraftRange,
  type MinuteRange,
  type TimetableDraft,
} from '../utils/timetableUtils';

/** 이만큼(px) 움직여야 끌기로 본다 (그보다 적으면 클릭) */
const DRAG_THRESHOLD = 4;

type DraftGrip = 'start' | 'end' | 'body';

const pxToMinutes = (px: number, hourHeight: number) => (px / hourHeight) * 60;

/**
 * 빠른 추가 임시 블록 끌기 (D-053)
 * - 위·아래 손잡이: 시작·끝을 30분 단위로, 몸통: 길이 그대로 30분 단위로 옮김. 마우스·손가락 모두
 * - 끄는 동안 바뀔 때마다 onDraftChange
 */
export function useDraftDrag(draft: TimetableDraft | null | undefined, hourHeight: number, onDraftChange?: (range: MinuteRange) => void) {
  const drag = useRef<{ grip: DraftGrip; y: number; origin: MinuteRange; last: string } | null>(null);
  const onChangeRef = useRef(onDraftChange);
  onChangeRef.current = onDraftChange;

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const current = drag.current;
      if (!current) return;
      const deltaMinutes = pxToMinutes(event.clientY - current.y, hourHeight);
      const next =
        current.grip === 'body'
          ? moveDraftRange(current.origin, deltaMinutes)
          : resizeDraftRange(current.origin, current.grip, current.origin[current.grip] + deltaMinutes);
      const key = `${next.start}-${next.end}`;
      if (key === current.last) return;
      current.last = key;
      onChangeRef.current?.(next);
    };
    const handleUp = () => {
      drag.current = null;
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [hourHeight]);

  /** 손잡이·몸통의 onPointerDown */
  const startDrag = useCallback(
    (grip: DraftGrip) => (event: ReactPointerEvent) => {
      if (!draft || !onChangeRef.current) return;
      event.stopPropagation(); // 칸의 '끌어서 만들기'가 시작되지 않게
      event.preventDefault(); // 손가락이면 스크롤 대신 끌기
      const origin = draftRange(draft);
      drag.current = { grip, y: event.clientY, origin, last: `${origin.start}-${origin.end}` };
    },
    [draft]
  );

  return { startDrag };
}

/**
 * PC: 빈 시간을 누른 채 아래로 끌어 만들기 (D-053, 구글 웹 방식)
 * - 마우스 왼쪽 버튼만. 손가락은 세로 스크롤과 겹쳐서 쓰지 않는다
 * - 끄는 동안 `creating`(분 범위)으로 점선 블록을 그리고, 놓으면 onCreate. 놓은 뒤 오는 click은 한 번 버린다
 */
export function useDragCreate(hourHeight: number, enabled: boolean, onCreate: (date: string, range: MinuteRange, column: DOMRect) => void) {
  const [creating, setCreating] = useState<{ date: string; range: MinuteRange } | null>(null);
  const drag = useRef<{ date: string; fromMinutes: number; y: number; column: DOMRect; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const onCreateRef = useRef(onCreate);
  onCreateRef.current = onCreate;

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const current = drag.current;
      if (!current) return;
      if (!current.moved && Math.abs(event.clientY - current.y) < DRAG_THRESHOLD) return;
      current.moved = true;
      const toMinutes = pxToMinutes(event.clientY - current.column.top, hourHeight);
      setCreating({ date: current.date, range: dragCreateRange(current.fromMinutes, toMinutes) });
    };
    const handleUp = (event: PointerEvent) => {
      const current = drag.current;
      drag.current = null;
      if (!current?.moved) return;
      suppressClick.current = true;
      setCreating(null);
      const toMinutes = pxToMinutes(event.clientY - current.column.top, hourHeight);
      onCreateRef.current(current.date, dragCreateRange(current.fromMinutes, toMinutes), current.column);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [hourHeight]);

  /** 날짜 칸의 onPointerDown */
  const onPointerDown = useCallback(
    (date: string) => (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || event.pointerType !== 'mouse' || event.button !== 0) return;
      if ((event.target as HTMLElement).closest('button, a, [data-draft]')) return;
      const column = event.currentTarget.getBoundingClientRect();
      drag.current = { date, fromMinutes: pxToMinutes(event.clientY - column.top, hourHeight), y: event.clientY, column, moved: false };
    },
    [enabled, hourHeight]
  );

  /** 끌기를 마친 뒤 브라우저가 보내는 click이면 true (그 click은 무시) */
  const consumeClick = () => {
    const suppressed = suppressClick.current;
    suppressClick.current = false;
    return suppressed;
  };

  return { creating, onPointerDown, consumeClick };
}
