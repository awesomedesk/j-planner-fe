"use client";

import { createContext, useContext } from 'react';

import type { Todo } from '@/types/api';

/**
 * Todo 박스가 화면 틀(AppShell)에 부탁하는 일 (US-13)
 * 박스는 사이드바·모바일 탭 어디서든 그려지므로, 수정 창은 AppShell이 한 곳에서 연다
 */
export interface TodoActions {
  /** Todo 수정 창 열기 (US-12) */
  openTodo: (todo: Todo) => void;
}

export const TodoActionsContext = createContext<TodoActions>({ openTodo: () => undefined });
export const useTodoActions = () => useContext(TodoActionsContext);
