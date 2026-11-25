"use client";

import { useEffect, useState } from 'react';

import type { LocalDate, Todo } from '@/types/api';

import { todoApi } from '@utils/api';
import { useErrorNotice } from '@utils/hooks/useErrorNotice';

/** 이날 완료한 Todo (DIARY-04): GET /todos?completedOn=날짜 */
export const useCompletedTodos = (date: LocalDate) => {
  const notifyError = useErrorNotice();
  const [result, setResult] = useState<{ date: LocalDate; todos: Todo[] } | null>(null);

  useEffect(() => {
    let isActive = true;
    todoApi
      .getList({ completedOn: date })
      .then((todos) => isActive && setResult({ date, todos }))
      .catch((error: unknown) => isActive && notifyError(error));
    return () => {
      isActive = false;
    };
  }, [date, notifyError]);

  return result?.date === date ? { todos: result.todos, isLoaded: true } : { todos: [] as Todo[], isLoaded: false };
};
