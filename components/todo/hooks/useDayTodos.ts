"use client";

import { useEffect, useMemo } from 'react';

import type { LocalDate } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectCategoryFilter } from '@store/slices/calendarSlice';
import { showNotice } from '@store/slices/noticeSlice';
import { fetchDayTodos, isSameTodoQuery, selectDayTodoQuery, selectDayTodoStatus, selectDayTodos } from '@store/slices/todoSlice';

/**
 * 그날의 Todo 박스 받기 (US-13, 08-api-design 5절 `GET /todos?date=`)
 * - 날짜나 카테고리 필터(US-11)가 바뀌면 다시 받고, 실패하면 짧은 안내
 * - 오늘이면 지난 미완료 Todo도 함께 온다 (D-029, 표시는 US-16)
 */
export function useDayTodos(date: LocalDate) {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectDayTodos);
  const status = useAppSelector(selectDayTodoStatus);
  const loadedQuery = useAppSelector(selectDayTodoQuery);
  const categoryFilter = useAppSelector(selectCategoryFilter);
  const query = useMemo(() => (categoryFilter ? { date, categoryId: categoryFilter } : { date }), [date, categoryFilter]);

  useEffect(() => {
    dispatch(fetchDayTodos(query))
      .unwrap()
      .catch((message: string) => dispatch(showNotice(message, 'error')));
  }, [dispatch, query]);

  const isCurrent = isSameTodoQuery(loadedQuery, query);
  return { todos: isCurrent ? items : EMPTY, isLoaded: isCurrent && status !== 'loading' };
}

const EMPTY: never[] = [];
