"use client";

import { useEffect } from 'react';

import type { LocalDate } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchSchedules, selectScheduleRange, selectScheduleStatus, selectSchedules } from '@store/slices/scheduleSlice';
import { showNotice } from '@store/slices/noticeSlice';

interface DateRange {
  from: LocalDate;
  to: LocalDate;
}

/**
 * 보이는 기간의 일정 받기 — 월간·주간·일간 공통 (08-api-design 11절)
 * - 기간이 바뀌면 다시 받고, 실패하면 짧은 안내 (US-03)
 * - schedules: 화면에 그릴 일정 (받는 동안은 앞 기간 것이 남아 있을 수 있음)
 * - isLoaded: 이 기간을 다 받았는지 (실패도 끝난 것으로 본다)
 * - loadedSchedules: 이 기간을 제대로 받았을 때의 일정 (처음 위치 계산 등, 실패·받는 중이면 빈 목록)
 *
 * range는 같은 값이면 같은 객체로 넘긴다 (useMemo) — 바뀔 때마다 다시 받는다.
 */
export function useScheduleRange(range: DateRange) {
  const dispatch = useAppDispatch();
  const schedules = useAppSelector(selectSchedules);
  const status = useAppSelector(selectScheduleStatus);
  const loadedRange = useAppSelector(selectScheduleRange);

  useEffect(() => {
    dispatch(fetchSchedules(range))
      .unwrap()
      .catch((message: string) => dispatch(showNotice(message, 'error')));
  }, [dispatch, range]);

  const isCurrent = loadedRange?.from === range.from && loadedRange?.to === range.to;
  const isLoaded = isCurrent && (status === 'succeeded' || status === 'failed');
  const loadedSchedules = isCurrent && status === 'succeeded' ? schedules : EMPTY;

  return { schedules, isLoaded, loadedSchedules };
}

const EMPTY: never[] = [];
