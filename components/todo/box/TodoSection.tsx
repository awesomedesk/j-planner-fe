"use client";

import type { ReactNode } from 'react';

import { useAppSelector } from '@/app/hooks';
import { selectSelectedDate } from '@store/slices/calendarSlice';

import TodoBox from './TodoBox';

/** PC 사이드바·폴드 패널은 미완료 5개까지 + 더 보기 (D-067). 모바일 Todo 탭은 전부 */
const SIDEBAR_TODO_LIMIT = 5;

/** TodoSection - PC 사이드바·폴드 오른쪽 패널의 Todo 섹션 (사이드바 C, 고른 날짜 기준 D-015) */
export default function TodoSection({ header }: { header: (actions?: ReactNode) => ReactNode }) {
  const selectedDate = useAppSelector(selectSelectedDate);
  return <TodoBox date={selectedDate} header={header} collapseAfter={SIDEBAR_TODO_LIMIT} />;
}
