"use client";

import { useEffect } from 'react';

import type { LocalDate } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDiaryMarks, selectDiaryDates } from '@store/slices/diarySlice';
import { showNotice } from '@store/slices/noticeSlice';

/**
 * 보이는 기간에서 일기를 쓴 날 (월간 펜 아이콘, US-24 · D-021). GET /diaries?from&to (최대 62일)
 * 일기를 저장·삭제하면 diaryChanged·refreshDiaryMarks가 고친다. range는 useMemo로 같은 객체
 */
export function useDiaryMarks(range: { from: LocalDate; to: LocalDate }) {
  const dispatch = useAppDispatch();
  const dates = useAppSelector(selectDiaryDates);

  useEffect(() => {
    dispatch(fetchDiaryMarks(range))
      .unwrap()
      .catch((message: string) => dispatch(showNotice(message, 'error')));
  }, [dispatch, range]);

  return dates;
}
