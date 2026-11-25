"use client";

import { useEffect, useMemo } from 'react';

import type { LocalDate } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDdayMarks, fetchDdays, selectDdayMarks, selectDdayStatus, selectDdays } from '@store/slices/ddaySlice';
import { showNotice } from '@store/slices/noticeSlice';

import { ddayChipsByDate } from '../utils/ddayMarkUtils';

/**
 * 보이는 기간의 D-Day 표시 받기 — 월간·주간·일간 공통 (US-23, 08 6절 /dday-marks)
 * - 기간이 바뀌면 다시 받고, 실패하면 짧은 안내. D-Day를 저장·삭제하면 refreshDdays가 다시 받는다
 * - 칩 제목은 D-Day 목록에서 찾는다 (사이드바가 없는 화면에서도 보이게 목록을 아직 안 받았으면 받는다)
 * range는 같은 값이면 같은 객체로 넘긴다 (useMemo)
 */
export function useDdayMarks(range: { from: LocalDate; to: LocalDate }) {
  const dispatch = useAppDispatch();
  const marks = useAppSelector(selectDdayMarks);
  const ddays = useAppSelector(selectDdays);
  const listStatus = useAppSelector(selectDdayStatus);

  useEffect(() => {
    dispatch(fetchDdayMarks(range))
      .unwrap()
      .catch((message: string) => dispatch(showNotice(message, 'error')));
  }, [dispatch, range]);

  useEffect(() => {
    if (listStatus === 'idle') void dispatch(fetchDdays());
  }, [dispatch, listStatus]);

  return useMemo(() => ddayChipsByDate(marks, ddays), [marks, ddays]);
}
