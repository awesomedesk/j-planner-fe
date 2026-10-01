import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { Id, LocalDate, Schedule } from '@/types/api';

import { scheduleApi, toErrorMessage } from '@utils/api';

/**
 * 달력에 보이는 기간의 일정 (US-06)
 * 보이는 기간·카테고리 필터가 바뀌거나 일정을 추가·수정·삭제하면 다시 받는다 (08-api-design 11절)
 */
export interface ScheduleRange {
  from: LocalDate;
  to: LocalDate;
  /** 카테고리 필터 (US-11). 없으면 전체, 빈 목록이면 요청 없이 빈 결과 */
  categoryId?: Id[];
}

interface ScheduleState {
  items: Schedule[];
  range: ScheduleRange | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

/** 같은 조회인가 (기간 + 카테고리 필터) */
const queryKey = ({ from, to, categoryId }: ScheduleRange) => `${from}~${to}|${categoryId?.join(',') ?? '*'}`;
export const isSameScheduleQuery = (a: ScheduleRange | null, b: ScheduleRange) => a !== null && queryKey(a) === queryKey(b);

const isCurrentRange = (state: ScheduleState, range: ScheduleRange) => isSameScheduleQuery(state.range, range);

const initialState: ScheduleState = { items: [], range: null, status: 'idle' };

export const fetchSchedules = createAsyncThunk<Schedule[], ScheduleRange, { rejectValue: string }>(
  'schedule/fetchSchedules',
  async (range, { rejectWithValue }) => {
    // 카테고리를 하나도 안 골랐으면 받을 것이 없다
    if (range.categoryId?.length === 0) return [];
    try {
      return await scheduleApi.getList(range);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

/** 지금 보이는 기간을 다시 받는다 (저장·삭제 뒤) */
export const refreshSchedules = createAsyncThunk<void, void, { state: { schedule: ScheduleState } }>(
  'schedule/refreshSchedules',
  async (_, { getState, dispatch }) => {
    const { range } = getState().schedule;
    if (range) await dispatch(fetchSchedules(range));
  }
);

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchedules.pending, (state, action) => {
        state.status = 'loading';
        state.range = action.meta.arg;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        // 늦게 도착한 옛 기간의 응답은 버린다
        if (!isCurrentRange(state, action.meta.arg)) return;
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        // 옛 기간의 실패도 지금 기간을 '실패'로 바꾸지 않는다
        if (!isCurrentRange(state, action.meta.arg)) return;
        state.status = 'failed';
      });
  },
});

export const selectSchedules = (state: { schedule: ScheduleState }) => state.schedule.items;
export const selectScheduleStatus = (state: { schedule: ScheduleState }) => state.schedule.status;
/** 지금 받았거나 받는 중인 기간 */
export const selectScheduleRange = (state: { schedule: ScheduleState }) => state.schedule.range;

export default scheduleSlice.reducer;
