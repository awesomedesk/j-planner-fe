import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { Id, LocalDate, Todo } from '@/types/api';

import { todoApi, toErrorMessage } from '@utils/api';

import { showNotice } from './noticeSlice';

/**
 * 그날의 Todo 박스 (US-13, D-013)
 * 사이드바·모바일 일간 Todo 탭이 같은 박스를 본다. 날짜·카테고리 필터가 바뀌거나 Todo를 저장·삭제하면 다시 받는다
 */
export interface DayTodoQuery {
  date: LocalDate;
  /** 카테고리 필터 (US-11). 없으면 전체, 빈 목록이면 요청 없이 빈 박스 */
  categoryId?: Id[];
}

interface TodoState {
  items: Todo[];
  query: DayTodoQuery | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const queryKey = ({ date, categoryId }: DayTodoQuery) => `${date}|${categoryId?.join(',') ?? '*'}`;
export const isSameTodoQuery = (a: DayTodoQuery | null, b: DayTodoQuery) => a !== null && queryKey(a) === queryKey(b);

const initialState: TodoState = { items: [], query: null, status: 'idle' };

export const fetchDayTodos = createAsyncThunk<Todo[], DayTodoQuery, { rejectValue: string }>(
  'todo/fetchDayTodos',
  async ({ date, categoryId }, { rejectWithValue }) => {
    if (categoryId?.length === 0) return [];
    try {
      return await todoApi.getList(categoryId ? { date, categoryId } : { date });
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

/** 지금 박스를 다시 받는다 (Todo 저장·삭제 뒤) */
export const refreshDayTodos = createAsyncThunk<void, void, { state: { todo: TodoState } }>(
  'todo/refreshDayTodos',
  async (_, { getState, dispatch }) => {
    const { query } = getState().todo;
    if (query) await dispatch(fetchDayTodos(query));
  }
);

/**
 * 완료·완료 취소 (TODO-02). 누르는 즉시 박스에서 옮기고, 실패하면 되돌리고 짧은 안내
 * 기간·주간·월간도 한 번이면 전체 완료 (D-027)
 */
export const setTodoCompleted = createAsyncThunk<Todo, { id: Id; completed: boolean }, { rejectValue: null }>(
  'todo/setTodoCompleted',
  async ({ id, completed }, { dispatch, rejectWithValue }) => {
    try {
      return await todoApi.setCompleted(id, completed);
    } catch (error) {
      dispatch(showNotice(toErrorMessage(error), 'error'));
      return rejectWithValue(null);
    }
  }
);

const todoSlice = createSlice({
  name: 'todo',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDayTodos.pending, (state, action) => {
        state.status = 'loading';
        state.query = action.meta.arg;
      })
      .addCase(fetchDayTodos.fulfilled, (state, action) => {
        // 늦게 도착한 옛 날짜의 응답은 버린다
        if (!isSameTodoQuery(state.query, action.meta.arg)) return;
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchDayTodos.rejected, (state, action) => {
        if (!isSameTodoQuery(state.query, action.meta.arg)) return;
        state.status = 'failed';
      })
      .addCase(setTodoCompleted.pending, (state, action) => {
        const item = state.items.find((t) => t.id === action.meta.arg.id);
        if (item) item.completed = action.meta.arg.completed;
      })
      .addCase(setTodoCompleted.fulfilled, (state, action) => {
        const index = state.items.findIndex((t) => t.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(setTodoCompleted.rejected, (state, action) => {
        const item = state.items.find((t) => t.id === action.meta.arg.id);
        if (item) item.completed = !action.meta.arg.completed;
      });
  },
});

export const selectDayTodos = (state: { todo: TodoState }) => state.todo.items;
export const selectDayTodoQuery = (state: { todo: TodoState }) => state.todo.query;
export const selectDayTodoStatus = (state: { todo: TodoState }) => state.todo.status;

export default todoSlice.reducer;
