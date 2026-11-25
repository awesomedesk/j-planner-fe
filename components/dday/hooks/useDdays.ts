"use client";

import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDdays, selectDdayStatus, selectDdays } from '@store/slices/ddaySlice';
import { showNotice } from '@store/slices/noticeSlice';

/**
 * D-Day 전체 목록 (사용자 순서, D-029)
 * 그릴 때마다 다시 받는다 — 오늘 기준 표시(today.label)가 날짜에 따라 바뀌므로. 실패하면 짧은 안내 (US-03)
 */
export const useDdays = () => {
  const dispatch = useAppDispatch();
  const ddays = useAppSelector(selectDdays);
  const status = useAppSelector(selectDdayStatus);

  useEffect(() => {
    dispatch(fetchDdays())
      .unwrap()
      .catch((message: string) => dispatch(showNotice(message, 'error')));
  }, [dispatch]);

  return { ddays, isLoaded: status === 'succeeded' || status === 'failed' };
};
