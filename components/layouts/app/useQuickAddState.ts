"use client";

import { useCallback, useRef, useState } from 'react';

import type { TimetableSlot } from '@components/calendar/hooks/useQuickAddSlot';
import { rangeToTimes, type MinuteRange, type TimetableDraft } from '@components/calendar/utils/timetableUtils';
import type { QuickAddPreview, QuickAddScheduleProps } from '@components/schedule/quick/QuickAddSchedule';

type QuickAddTimes = NonNullable<QuickAddScheduleProps['times']>;

/**
 * 빠른 추가(US-10) 상태 — 시간표와 팝업·시트를 잇는다 (D-017 · D-053)
 * - slot: 연 자리. preview: 입력 중인 제목·시간 → 시간표의 점선 임시 블록
 * - 임시 블록을 끌면 times로 팝업 시간 칸에 넣는다
 * - 열린 채 다른 빈 시간을 누르면: 입력 없으면 바로 옮기고, 있으면 pendingSlot에 두고 '작성을 취소할까요?' (Q7)
 */
export function useQuickAddState() {
  const [slot, setSlot] = useState<TimetableSlot | null>(null);
  /** 열 때마다 1씩 → 팝업을 새로 그린다 (같은 자리를 다시 열어도 입력이 비워지게) */
  const [openCount, setOpenCount] = useState(0);
  const [preview, setPreview] = useState<QuickAddPreview | null>(null);
  const [times, setTimes] = useState<QuickAddTimes | null>(null);
  const [pendingSlot, setPendingSlot] = useState<TimetableSlot | null>(null);
  const isDirty = useRef(false);

  const open = (next: TimetableSlot) => {
    setSlot(next);
    setPreview(null);
    setTimes(null);
    setPendingSlot(null);
    setOpenCount((count) => count + 1);
    isDirty.current = false;
  };

  const close = () => {
    setSlot(null);
    setPreview(null);
    setTimes(null);
    setPendingSlot(null);
  };

  const addAt = (next: TimetableSlot) => {
    if (slot && isDirty.current) setPendingSlot(next);
    else open(next);
  };

  /** 임시 블록을 끌면: 시간 칸에 넣고, 팝업도 블록을 가리지 않는 자리로 다시 */
  const changeDraftRange = (range: MinuteRange) => {
    if (!slot) return;
    setTimes(rangeToTimes(slot.date, range));
    setSlot({ ...slot, anchor: slot.anchorFor(range) });
  };

  const setDirty = useCallback((dirty: boolean) => {
    isDirty.current = dirty;
  }, []);

  const draft: TimetableDraft | null = slot && preview ? { date: slot.date, ...preview } : null;

  return {
    slot,
    key: openCount,
    draft,
    times,
    pendingSlot,
    addAt,
    close,
    changeDraftRange,
    setPreview,
    setDirty,
    /** 확인 창 '작성 취소' → 새 자리로 */
    discardAndMove: () => {
      if (pendingSlot) open(pendingSlot);
    },
    /** 확인 창 '계속 작성' */
    keepEditing: () => setPendingSlot(null),
  };
}
