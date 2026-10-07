"use client";

import { useEffect, useMemo } from 'react';

import type { LocalDate } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectCategoryFilter } from '@store/slices/calendarSlice';
import { showNotice } from '@store/slices/noticeSlice';
import { fetchScheduledTodos, isSameScheduledTodoQuery, selectScheduledTodoQuery, selectScheduledTodos } from '@store/slices/todoSlice';

/**
 * 보이는 기간의 시간 지정 Todo 받기 — 주간·일간 시간표 블록 (US-15, 08-api-design 11절)
 * `GET /todos?from&to&scheduled=true` (+카테고리 필터). 기간·필터가 바뀌면 다시 받고, 실패하면 짧은 안내.
 * 받는 동안은 앞 기간 것이 잠깐 남을 수 있다 (블록은 Todo 날짜 범위 안에서만 그려지므로 다른 날에 잘못 나오지 않음)
 * range는 같은 값이면 같은 객체로 넘긴다 (useMemo).
 */
export function useTimetableTodos(range: { from: LocalDate; to: LocalDate }) {
  const dispatch = useAppDispatch();
  const todos = useAppSelector(selectScheduledTodos);
  const loadedQuery = useAppSelector(selectScheduledTodoQuery);
  const categoryFilter = useAppSelector(selectCategoryFilter);
  const query = useMemo(() => (categoryFilter ? { ...range, categoryId: categoryFilter } : range), [range, categoryFilter]);

  useEffect(() => {
    dispatch(fetchScheduledTodos(query))
      .unwrap()
      .catch((message: string) => dispatch(showNotice(message, 'error')));
  }, [dispatch, query]);

  return isSameScheduledTodoQuery(loadedQuery, query) ? todos : EMPTY;
}

/** 처음 받기 전(다른 조건) */
const EMPTY: never[] = [];
