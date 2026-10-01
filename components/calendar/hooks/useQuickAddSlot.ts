"use client";

import { useCallback, useEffect } from 'react';
import type { MouseEvent, RefObject } from 'react';

import type { LocalDate } from '@/types/api';

import { revealScrollDelta, type Rect } from '@utils/dom/placement';

import { clockToMinutes, slotStartTime, type TimetableDraft } from '../utils/timetableUtils';

/** 빈 시간을 누른 자리 (US-10) */
export interface TimetableSlot {
  date: LocalDate;
  /** 누른 칸 시작 `HH:mm` */
  startTime: string;
  /** 누른 칸의 화면 위치 (팝업이 가리지 않게) */
  anchor: Rect;
}

/** 블록·링크 등 누를 수 있는 것을 누른 것은 빠른 추가가 아니다 */
const INTERACTIVE = 'button, a, input, select, textarea';

/**
 * 시간표 날짜 칸의 빈 시간 누르기 → onAddAt (US-10, D-017 · D-021)
 * @returns 날짜를 받아 그 칸의 onClick을 돌려준다
 */
export const useSlotClick = (hourHeight: number, onAddAt?: (slot: TimetableSlot) => void) =>
  useCallback(
    (date: LocalDate) => (event: MouseEvent<HTMLElement>) => {
      if (!onAddAt || (event.target as HTMLElement).closest(INTERACTIVE)) return;
      const column = event.currentTarget.getBoundingClientRect();
      const startTime = slotStartTime(event.clientY - column.top, hourHeight);
      const top = column.top + (clockToMinutes(startTime) / 60) * hourHeight;
      onAddAt({ date, startTime, anchor: { left: column.left, right: column.right, top, bottom: top + hourHeight } });
    },
    [hourHeight, onAddAt]
  );

/**
 * 모바일 바텀 시트가 임시 블록을 가리지 않게 시간표를 스크롤 (MO-12)
 * 임시 블록 자리(날짜·시작)가 바뀔 때 맞춘다. 제목을 쓰는 동안에는 움직이지 않는다.
 */
export const useRevealDraft = (
  scrollRef: RefObject<HTMLElement>,
  draftRef: RefObject<HTMLElement>,
  draft: TimetableDraft | null | undefined,
  coverBottom: number
) => {
  const key = draft ? `${draft.date} ${draft.startTime}` : null;
  useEffect(() => {
    const scroller = scrollRef.current;
    const block = draftRef.current;
    if (!key || !coverBottom || !scroller || !block) return;
    const area = scroller.getBoundingClientRect();
    const delta = revealScrollDelta(block.getBoundingClientRect(), {
      top: area.top,
      bottom: Math.min(area.bottom, window.innerHeight - coverBottom),
    });
    if (delta) scroller.scrollTop += delta;
  }, [key, coverBottom, scrollRef, draftRef]);
};
