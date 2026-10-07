import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { Id, LocalDate, Todo } from '@/types/api';

import { todoApi, toErrorMessage } from '@utils/api';

import { moveAfter } from '@utils/list/reorder';

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

/** 시간표(주간·일간) Todo 블록 조회 조건 (US-15, 08-api-design 11절) */
export interface ScheduledTodoQuery {
  from: LocalDate;
  to: LocalDate;
  categoryId?: Id[];
}

interface TodoState {
  items: Todo[];
  query: DayTodoQuery | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  /** 시간표 블록: 보이는 기간과 겹치고 시간이 있는 Todo */
  scheduled: { items: Todo[]; query: ScheduledTodoQuery | null; status: 'idle' | 'loading' | 'succeeded' | 'failed' };
}

const queryKey = ({ date, categoryId }: DayTodoQuery) => `${date}|${categoryId?.join(',') ?? '*'}`;
export const isSameTodoQuery = (a: DayTodoQuery | null, b: DayTodoQuery) => a !== null && queryKey(a) === queryKey(b);

const scheduledKey = ({ from, to, categoryId }: ScheduledTodoQuery) => `${from}~${to}|${categoryId?.join(',') ?? '*'}`;
export const isSameScheduledTodoQuery = (a: ScheduledTodoQuery | null, b: ScheduledTodoQuery) => a !== null && scheduledKey(a) === scheduledKey(b);

const initialState: TodoState = { items: [], query: null, status: 'idle', scheduled: { items: [], query: null, status: 'idle' } };

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

/** 시간표 Todo 블록 받기 (US-15). 카테고리를 하나도 안 고르면 요청 없이 빈 목록 (US-11) */
export const fetchScheduledTodos = createAsyncThunk<Todo[], ScheduledTodoQuery, { rejectValue: string }>(
  'todo/fetchScheduledTodos',
  async ({ from, to, categoryId }, { rejectWithValue }) => {
    if (categoryId?.length === 0) return [];
    try {
      return await todoApi.getList(categoryId ? { from, to, scheduled: true, categoryId } : { from, to, scheduled: true });
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

/** Todo를 저장·삭제한 뒤: 박스와 시간표 블록을 둘 다 다시 받는다 (US-15) */
export const refreshTodos = createAsyncThunk<void, void, { state: { todo: TodoState } }>(
  'todo/refreshTodos',
  async (_, { getState, dispatch }) => {
    const { query, scheduled } = getState().todo;
    await Promise.all([
      query ? dispatch(fetchDayTodos(query)) : null,
      scheduled.query ? dispatch(fetchScheduledTodos(scheduled.query)) : null,
    ]);
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
    moved: (state, action: PayloadAction<{ id: Id; afterId: Id | null }>) => {
      state.items = moveAfter(state.items, action.payload.id, action.payload.afterId);
    },
    restoreOrder: (state, action: PayloadAction<Id[]>) => {
      const rank = new Map(action.payload.map((id, i) => [id, i]));
      state.items.sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity));
    },
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
      // 완료 체크는 박스와 시간표 블록에 같이 (US-15)
      .addCase(setTodoCompleted.pending, (state, action) => {
        [state.items, state.scheduled.items].forEach((list) => {
          const item = list.find((t) => t.id === action.meta.arg.id);
          if (item) item.completed = action.meta.arg.completed;
        });
      })
      .addCase(setTodoCompleted.fulfilled, (state, action) => {
        [state.items, state.scheduled.items].forEach((list) => {
          const index = list.findIndex((t) => t.id === action.payload.id);
          if (index >= 0) list[index] = action.payload;
        });
      })
      .addCase(setTodoCompleted.rejected, (state, action) => {
        [state.items, state.scheduled.items].forEach((list) => {
          const item = list.find((t) => t.id === action.meta.arg.id);
          if (item) item.completed = !action.meta.arg.completed;
        });
      })
      .addCase(fetchScheduledTodos.pending, (state, action) => {
        state.scheduled.status = 'loading';
        state.scheduled.query = action.meta.arg;
      })
      .addCase(fetchScheduledTodos.fulfilled, (state, action) => {
        if (!isSameScheduledTodoQuery(state.scheduled.query, action.meta.arg)) return;
        state.scheduled.status = 'succeeded';
        state.scheduled.items = action.payload;
      })
      .addCase(fetchScheduledTodos.rejected, (state, action) => {
        if (!isSameScheduledTodoQuery(state.scheduled.query, action.meta.arg)) return;
        state.scheduled.status = 'failed';
      });
  },
});

/**
 * 순서 바꾸기 (US-14, TODO-09). 놓는 즉시 박스 순서를 바꾸고 PUT /todos/{id}/position
 * 성공하면 화면 순서를 그대로 쓰고(다시 받지 않음, 08-api-design), 실패하면 원래 순서로 되돌리고 짧은 안내
 */
export const moveTodo = createAsyncThunk<void, { id: Id; afterId: Id | null }, { state: { todo: TodoState }; rejectValue: null }>(
  'todo/moveTodo',
  async ({ id, afterId }, { dispatch, getState, rejectWithValue }) => {
    const before = getState().todo.items.map((t) => t.id);
    dispatch(todoSlice.actions.moved({ id, afterId }));
    try {
      await todoApi.move(id, { afterId });
    } catch (error) {
      dispatch(todoSlice.actions.restoreOrder(before));
      dispatch(showNotice(toErrorMessage(error), 'error'));
      return rejectWithValue(null);
    }
  }
);

export const selectDayTodos = (state: { todo: TodoState }) => state.todo.items;
export const selectDayTodoQuery = (state: { todo: TodoState }) => state.todo.query;
export const selectScheduledTodos = (state: { todo: TodoState }) => state.todo.scheduled.items;
export const selectScheduledTodoQuery = (state: { todo: TodoState }) => state.todo.scheduled.query;
export const selectDayTodoStatus = (state: { todo: TodoState }) => state.todo.status;

export default todoSlice.reducer;
