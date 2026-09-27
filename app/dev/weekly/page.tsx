"use client";

import { useEffect } from 'react';

import { useAppDispatch } from '@/app/hooks';
import AppShell from '@components/layouts/app/AppShell';
import { setViewMode } from '@store/slices/calendarSlice';

/**
 * 개발용: 주간 보기로 바로 연다 (US-07 확인용)
 * 모바일은 화면 선택 드롭다운(US-09) 전이라 주간으로 갈 방법이 없어서 둔다. US-09가 끝나면 지운다.
 */
export default function DevWeeklyPage() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(setViewMode('WEEK'));
  }, [dispatch]);
  return <AppShell />;
}
