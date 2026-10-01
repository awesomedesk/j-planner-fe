"use client";

import { useEffect } from 'react';
import type { MouseEvent, RefObject } from 'react';

import type { LocalDate } from '@/types/api';

import { revealScrollDelta, type Rect } from '@utils/dom/placement';

import { clockToMinutes, minutesToClock, slotStartTime, type MinuteRange, type TimetableDraft } from '../utils/timetableUtils';

import { useDraftDrag, useDragCreate } from './useTimetableDrag';

/** 빈 시간을 누른 자리 (US-10) */
export interface TimetableSlot {
  date: LocalDate;
  /** 누른 칸 시작 `HH:mm` (30분 단위, D-053) */
  startTime: string;
  /** 길이 (분). PC에서 누른 채 끌어 만들었을 때만. 없으면 1시간 */
  durationMinutes?: number;
  /** 누른 자리의 화면 위치 (팝업이 가리지 않게) */
  anchor: Rect;
  /** 임시 블록을 끌어 시간이 바뀌면 그 자리로 anchor를 다시 잡는다 (D-053) */
  anchorFor: (range: MinuteRange) => Rect;
}

/** 블록·링크·임시 블록 등 누를 수 있는 것을 누른 것은 빠른 추가가 아니다 */
const INTERACTIVE = 'button, a, input, select, textarea, [data-draft]';

interface UseTimetableQuickAddOptions {
  hourHeight: number;
  /** PC만: 빈 시간을 누른 채 끌어 만들기 (D-053) */
  enableDragCreate: boolean;
  onAddAt?: (slot: TimetableSlot) => void;
  /** 빠른 추가 중 임시 블록 */
  draft?: TimetableDraft | null;
  /** 임시 블록 손잡이·몸통을 끌어 바꿀 때 (D-053) */
  onDraftChange?: (range: MinuteRange) => void;
}

/**
 * 시간표(주간·일간) 날짜 칸의 빠른 추가 동작 (US-10, D-017 · D-021 · D-053)
 * - 빈 시간 누르기 → 30분 단위 시각부터 1시간
 * - PC: 누른 채 끌기 → 그 길이 (끄는 동안 점선 블록)
 * - 임시 블록 손잡이·몸통 끌기 → onDraftChange
 */
export function useTimetableQuickAdd({ hourHeight, enableDragCreate, onAddAt, draft, onDraftChange }: UseTimetableQuickAddOptions) {
  const anchorOf = (column: DOMRect, range: MinuteRange): Rect => ({
    left: column.left,
    right: column.right,
    top: column.top + (range.start / 60) * hourHeight,
    bottom: column.top + (range.end / 60) * hourHeight,
  });

  const create = useDragCreate(hourHeight, enableDragCreate && Boolean(onAddAt), (date, range, column) =>
    onAddAt?.({
      date,
      startTime: minutesToClock(range.start),
      durationMinutes: range.end - range.start,
      anchor: anchorOf(column, range),
      anchorFor: (next) => anchorOf(column, next),
    })
  );
  const { startDrag } = useDraftDrag(draft, hourHeight, onDraftChange);

  const handleClick = (date: LocalDate) => (event: MouseEvent<HTMLElement>) => {
    if (create.consumeClick() || !onAddAt || (event.target as HTMLElement).closest(INTERACTIVE)) return;
    const column = event.currentTarget.getBoundingClientRect();
    const start = clockToMinutes(slotStartTime(event.clientY - column.top, hourHeight));
    onAddAt({
      date,
      startTime: minutesToClock(start),
      anchor: anchorOf(column, { start, end: start + 60 }),
      anchorFor: (next) => anchorOf(column, next),
    });
  };

  /** 날짜 칸에 펼쳐 붙일 속성 (빈 칸 표시는 팝업 바깥 누르기가 칸을 찾을 때 쓴다) */
  const columnProps = (date: LocalDate) => ({
    'data-quick-add-slot': '',
    onClick: handleClick(date),
    onPointerDown: create.onPointerDown(date),
  });

  /** 그날 칸에 그릴 임시 블록. 끌어 만드는 중이면 그것(아직 손잡이 없음), 아니면 빠른 추가 중인 것 */
  const draftFor = (date: LocalDate): { draft: TimetableDraft; isAdjustable: boolean } | null => {
    if (create.creating?.date === date) {
      const { range } = create.creating;
      return { draft: { date, startTime: minutesToClock(range.start), endTime: minutesToClock(range.end), title: '' }, isAdjustable: false };
    }
    return draft?.date === date ? { draft, isAdjustable: Boolean(onDraftChange) } : null;
  };

  return { columnProps, draftFor, startDrag };
}

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
