"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';

import type { Id } from '@/types/api';

import { getInsertIndex } from '@utils/list/reorder';

/** 모바일 길게 누르기 (US-14: 짧게 누르면 열기, 길게 누르면 끌기) */
export const LONG_PRESS_MS = 400;
/** 마우스: 이만큼 움직여야 끌기 시작 (그 전에 떼면 그냥 누르기) */
const MOUSE_SLOP = 4;
/** 터치: 길게 누르기 전에 이만큼 움직이면 스크롤로 본다 */
const TOUCH_SLOP = 8;

export interface DragState {
  id: Id;
  /** 처음 자리에서 움직인 거리(px) */
  dy: number;
  /** 옮기는 항목을 뺀 나머지 목록에서 끼워 넣을 자리 */
  insertIndex: number;
  fromIndex: number;
}

interface Pending {
  id: Id;
  pointerId: number;
  pointerType: string;
  startY: number;
  el: HTMLElement;
  timer: ReturnType<typeof setTimeout> | null;
}

interface Active {
  id: Id;
  startY: number;
  center: number;
  others: { top: number; height: number }[];
  fromIndex: number;
  insertIndex: number;
}

/**
 * useDragReorder - 목록을 끌어서 순서 바꾸기 (US-14, TODO-09)
 * - PC(마우스): 누른 채 4px 넘게 움직이면 끌기. 그 전에 떼면 평소 누르기(열기)
 * - 모바일(터치·펜): 0.4초 길게 누르면 끌기. 그 전에 움직이면 스크롤, 그 전에 떼면 평소 누르기
 * - 끈 뒤에 따라오는 click은 한 번 먹는다 (끌기 뒤에 수정 창이 열리지 않게)
 * - 줄 위치는 끌기 시작할 때 한 번 재고, 끄는 줄의 가운데가 다른 줄 가운데를 넘으면 자리가 바뀐다
 *
 * @param ids 지금 보이는 순서
 * @param onMove 놓았을 때. insertIndex는 옮기는 항목을 뺀 나머지 목록 기준 (제자리여도 부른다)
 */
export function useDragReorder(ids: Id[], onMove: (id: Id, insertIndex: number) => void) {
  const listRef = useRef<HTMLUListElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const pending = useRef<Pending | null>(null);
  const active = useRef<Active | null>(null);
  const suppressClick = useRef(false);
  const idsRef = useRef(ids);
  idsRef.current = ids;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const clearPending = () => {
    if (pending.current?.timer) clearTimeout(pending.current.timer);
    pending.current = null;
  };

  const begin = useCallback(() => {
    const p = pending.current;
    const list = listRef.current;
    if (!p || !list) return;
    if (p.timer) clearTimeout(p.timer);
    const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-reorder-id]'));
    const own = p.el.getBoundingClientRect();
    const others = rows.filter((r) => r !== p.el).map((r) => {
      const rect = r.getBoundingClientRect();
      return { top: rect.top, height: rect.height };
    });
    const fromIndex = idsRef.current.indexOf(p.id);
    active.current = { id: p.id, startY: p.startY, center: own.top + own.height / 2, others, fromIndex, insertIndex: fromIndex };
    p.el.setPointerCapture?.(p.pointerId);
    if (p.pointerType !== 'mouse') navigator.vibrate?.(10);
    pending.current = null;
    setDrag({ id: p.id, dy: 0, insertIndex: fromIndex, fromIndex });
  }, []);

  const finish = (commit: boolean) => {
    const a = active.current;
    clearPending();
    active.current = null;
    if (!a) return;
    suppressClick.current = true;
    setDrag(null);
    if (commit) onMoveRef.current(a.id, a.insertIndex);
  };

  // 끄는 동안에는 화면이 스크롤되지 않게 (터치는 touch-action을 도중에 바꿀 수 없어서 touchmove를 막는다)
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const block = (e: TouchEvent) => {
      if (active.current) e.preventDefault();
    };
    list.addEventListener('touchmove', block, { passive: false });
    return () => list.removeEventListener('touchmove', block);
  }, []);

  useEffect(() => () => clearPending(), []);

  const rowProps = (id: Id, enabled = true) => {
    if (!enabled) return {};
    const dragging = drag?.id === id;
    const style: CSSProperties | undefined = dragging ? { transform: `translateY(${drag.dy}px)`, position: 'relative', zIndex: 10 } : undefined;
    return {
      'data-reorder-id': id,
      'data-dragging': dragging ? '' : undefined,
      style,
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
        suppressClick.current = false;
        if (active.current) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if ((e.target as HTMLElement).closest('input, select, textarea')) return;
        clearPending();
        const el = e.currentTarget;
        pending.current = { id, pointerId: e.pointerId, pointerType: e.pointerType, startY: e.clientY, el, timer: null };
        if (e.pointerType !== 'mouse') pending.current.timer = setTimeout(begin, LONG_PRESS_MS);
      },
      onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
        const p = pending.current;
        if (p) {
          const moved = Math.abs(e.clientY - p.startY);
          if (p.pointerType === 'mouse') {
            if (moved >= MOUSE_SLOP) begin();
            else return;
          } else {
            if (moved > TOUCH_SLOP) clearPending();
            return;
          }
        }
        const a = active.current;
        if (!a) return;
        const dy = e.clientY - a.startY;
        a.insertIndex = getInsertIndex(a.others, a.center + dy);
        setDrag({ id: a.id, dy, insertIndex: a.insertIndex, fromIndex: a.fromIndex });
      },
      onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        finish(true);
      },
      onPointerCancel: () => finish(false),
      onClickCapture: (e: ReactMouseEvent) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      },
      // 길게 누를 때 뜨는 메뉴(복사·공유 등) 대신 끌기
      onContextMenu: (e: ReactMouseEvent) => {
        if (pending.current || active.current) e.preventDefault();
      },
    };
  };

  return { listRef, drag, rowProps };
}
