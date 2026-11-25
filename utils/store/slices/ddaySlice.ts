import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { Dday, DdayMark, Id, LocalDate } from '@/types/api';

import { ddayApi, toErrorMessage } from '@utils/api';
import { allowWrite } from '@utils/api/demo/demoBackend';
import { moveAfter } from '@utils/list/reorder';

import { showNotice } from './noticeSlice';

/**
 * D-Day (US-22·23, 08 6절)
 * - items: 전체 목록 (사용자 순서, D-029). 사이드바 섹션·모바일 D-Day 탭·달력 칩 제목이 같이 본다
 * - marks: 달력에 보이는 기간의 표시 (서버 계산, D-043). FE는 날짜를 다시 계산하지 않는다
 */
export interface DdayRange {
  from: LocalDate;
  to: LocalDate;
}

type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

interface DdayState {
  items: Dday[];
  status: Status;
  marks: { items: DdayMark[]; range: DdayRange | null; status: Status };
}

const isSameRange = (a: DdayRange | null, b: DdayRange) => a !== null && a.from === b.from && a.to === b.to;

const initialState: DdayState = { items: [], status: 'idle', marks: { items: [], range: null, status: 'idle' } };

export const fetchDdays = createAsyncThunk<Dday[], void, { rejectValue: string }>('dday/fetchDdays', async (_, { rejectWithValue }) => {
  try {
    return await ddayApi.getList();
  } catch (error) {
    return rejectWithValue(toErrorMessage(error));
  }
});

export const fetchDdayMarks = createAsyncThunk<DdayMark[], DdayRange, { rejectValue: string }>(
  'dday/fetchDdayMarks',
  async ({ from, to }, { rejectWithValue }) => {
    try {
      return await ddayApi.getMarks(from, to);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

/** 추가·수정·삭제 뒤: 목록과 지금 기간의 달력 표시를 다시 받는다 (06 달력 표시) */
export const refreshDdays = createAsyncThunk<void, void, { state: { dday: DdayState } }>('dday/refreshDdays', async (_, { getState, dispatch }) => {
  const { range } = getState().dday.marks;
  await Promise.all([dispatch(fetchDdays()), range ? dispatch(fetchDdayMarks(range)) : null]);
});

const ddaySlice = createSlice({
  name: 'dday',
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
      .addCase(fetchDdays.pending, (state) => {
        if (state.status === 'idle') state.status = 'loading';
      })
      .addCase(fetchDdays.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchDdays.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(fetchDdayMarks.pending, (state, action) => {
        state.marks.status = 'loading';
        state.marks.range = action.meta.arg;
      })
      .addCase(fetchDdayMarks.fulfilled, (state, action) => {
        // 늦게 도착한 옛 기간의 응답은 버린다
        if (!isSameRange(state.marks.range, action.meta.arg)) return;
        state.marks.status = 'succeeded';
        state.marks.items = action.payload;
      })
      .addCase(fetchDdayMarks.rejected, (state, action) => {
        if (!isSameRange(state.marks.range, action.meta.arg)) return;
        state.marks.status = 'failed';
      });
  },
});

/**
 * 순서 바꾸기 (D-029). 바로 목록 순서를 바꾸고 PUT /ddays/{id}/position.
 * 성공하면 같은 날 여러 D-Day의 달력 표시 순서도 바뀌므로 표시를 다시 받는다. 실패하면 되돌리고 짧은 안내
 */
export const moveDday = createAsyncThunk<void, { id: Id; afterId: Id | null }, { state: { dday: DdayState }; rejectValue: null }>(
  'dday/moveDday',
  async ({ id, afterId }, { dispatch, getState, rejectWithValue }) => {
    const before = getState().dday.items.map((d) => d.id);
    dispatch(ddaySlice.actions.moved({ id, afterId }));
    try {
      await ddayApi.move(id, { afterId });
    } catch (error) {
      dispatch(ddaySlice.actions.restoreOrder(before));
      dispatch(showNotice(toErrorMessage(error), 'error'));
      return rejectWithValue(null);
    }
    const { range } = getState().dday.marks;
    if (range) void dispatch(fetchDdayMarks(range));
  },
  // 둘러보기(D-093): 순서를 바꾸기 전에 '가입하면 저장돼요' — 목록 그대로, 요청 없음
  { condition: () => allowWrite() }
);

export const selectDdays = (state: { dday: DdayState }) => state.dday.items;
export const selectDdayStatus = (state: { dday: DdayState }) => state.dday.status;
export const selectDdayMarks = (state: { dday: DdayState }) => state.dday.marks.items;
export const selectDdaysById = createSelector(selectDdays, (items) => new Map(items.map((d) => [d.id, d])));

export default ddaySlice.reducer;
