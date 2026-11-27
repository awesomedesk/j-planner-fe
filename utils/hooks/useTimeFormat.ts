"use client";

import { useCallback } from 'react';

import { useAppSelector } from '@/app/hooks';
import { selectSettings } from '@store/slices/settingsSlice';
import { formatTimeOfDay } from '@utils/date/dateUtils';

/** 설정의 시간 표시(24/12시간, SET-03)를 따르는 시각 글자 바꾸기. `'14:30'` → `'오후 2:30'`, `'종일'`은 그대로 */
export function useClockText() {
  const timeFormat = useAppSelector(selectSettings).timeFormat;
  return useCallback((text: string) => formatTimeOfDay(text, timeFormat), [timeFormat]);
}

/** 설정의 시간 표시 · 시간표 칸 (눈금 글자·30분 점선) */
export function useTimetableDisplay() {
  const { timeFormat, slotMinutes } = useAppSelector(selectSettings);
  return { timeFormat, halfHourLines: slotMinutes === 30 };
}
