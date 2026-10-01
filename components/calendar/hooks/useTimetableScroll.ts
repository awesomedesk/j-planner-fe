"use client";

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { useStore } from 'react-redux';

import type { Schedule } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { RootState } from '@store/store';
import { selectTimetableScrollReset, setTimetableTopMinutes } from '@store/slices/calendarSlice';

import type { CalendarDay } from '../utils/calendarUtils';
import { initialScrollTarget } from '../utils/timetableUtils';

/** 시간표 위 여백 (pt-2) */
export const TIMETABLE_TOP_PADDING = 8;
/** 위쪽 맞춤일 때 눈금 글자(선보다 8px 위)가 잘리지 않게 남기는 여유 */
const LABEL_ROOM = 8;

interface UseTimetableScrollOptions {
  scrollRef: RefObject<HTMLDivElement | null>;
  /** 보이는 날짜 (주간 7일, 일간 1일) */
  days: CalendarDay[];
  schedules: Schedule[];
  /** 보이는 기간 일정을 다 받았는지 (실패도 끝난 것으로 본다) */
  isLoaded: boolean;
  hourHeight: number;
  /** 그리는 시간 수 (24) */
  hourCount: number;
  now: Date;
}

/**
 * 시간표 세로 위치 (D-046) — 주간·일간 공통
 * - 시간표 화면끼리 바꿀 때(주↔일), ‹ ›·스와이프로 옮길 때: 보던 시간(맨 위 시각)을 그대로 → store의 timetableTopMinutes
 * - '오늘'을 누르면 처음 위치 규칙으로 다시 (timetableScrollReset)
 * - 월간에서 들어오거나 처음 열 때: 오늘 있으면 현재 시각 가운데 / 없으면 가장 이른 일정 위쪽 / 그것도 없으면 현재 시각 가운데
 * - 스크롤하면 보던 시간을 분으로 기억한다 (주간 46px, 일간 48px처럼 1시간 높이가 달라도 같은 시각)
 */
export function useTimetableScroll({ scrollRef, days, schedules, isLoaded, hourHeight, hourCount, now }: UseTimetableScrollOptions) {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const isPlaced = useRef(false);

  // '오늘'을 누르면 처음 위치 규칙으로 다시 자리 잡는다
  const scrollReset = useAppSelector(selectTimetableScrollReset);
  const lastReset = useRef(scrollReset);
  if (lastReset.current !== scrollReset) {
    lastReset.current = scrollReset;
    isPlaced.current = false;
  }

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element || isPlaced.current) return;

    const saved = store.getState().calendar.timetableTopMinutes;
    if (saved !== null) {
      element.scrollTop = (saved / 60) * hourHeight;
      isPlaced.current = true;
      return;
    }

    // 오늘이 없으면 일정을 받은 뒤에 정한다
    const hasToday = days.some((day) => day.isToday);
    if (!hasToday && !isLoaded) return;
    const target = initialScrollTarget(days, schedules, now);
    const linePx = TIMETABLE_TOP_PADDING + (target.minutes / 60) * hourHeight;
    const maxScroll = Math.max(hourCount * hourHeight + TIMETABLE_TOP_PADDING - element.clientHeight, 0);
    const wanted = target.align === 'center' ? linePx - element.clientHeight / 2 : linePx - LABEL_ROOM;
    element.scrollTop = Math.min(Math.max(wanted, 0), maxScroll);
    isPlaced.current = true;
  });

  /** 스크롤할 때마다 보던 시간(분)을 기억 */
  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element || !isPlaced.current) return;
    dispatch(setTimetableTopMinutes(Math.round((element.scrollTop / hourHeight) * 60)));
  };

  return { handleScroll };
}
