import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { LocalDate, Schedule } from '@/types/api';

import { scheduleApi, toErrorMessage } from '@utils/api';

/**
 * 달력에 보이는 기간의 일정 (US-06)
 * 보이는 기간이 바뀌거나 일정을 추가·수정·삭제하면 다시 받는다 (08-api-design 11절)
 */
interface ScheduleRange {
  from: LocalDate;
  to: LocalDate;
}

interface ScheduleState {
  items: Schedule[];
  range: ScheduleRange | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: ScheduleState = { items: [], range: null, status: 'idle' };

export const fetchSchedules = createAsyncThunk<Schedule[], ScheduleRange, { rejectValue: string }>(
  'schedule/fetchSchedules',
  async (range, { rejectWithValue }) => {
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
        if (state.range?.from !== action.meta.arg.from || state.range?.to !== action.meta.arg.to) return;
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export const selectSchedules = (state: { schedule: ScheduleState }) => state.schedule.items;
export const selectScheduleStatus = (state: { schedule: ScheduleState }) => state.schedule.status;

export default scheduleSlice.reducer;
