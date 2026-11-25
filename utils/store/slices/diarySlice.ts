import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { LocalDate } from '@/types/api';

import { diaryApi, toErrorMessage } from '@utils/api';

/**
 * 일기 (US-24)
 * - dates: 달력에 보이는 기간에서 일기를 쓴 날 (월간 펜 아이콘, D-021). 내용은 들고 있지 않는다
 * - revision: 일기를 저장·삭제할 때마다 1씩 — 사이드바 일기 섹션 등이 그날 일기를 다시 받는 신호
 */
export interface DiaryRange {
  from: LocalDate;
  to: LocalDate;
}

interface DiaryState {
  dates: LocalDate[];
  range: DiaryRange | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  revision: number;
}

const isSameRange = (a: DiaryRange | null, b: DiaryRange) => a !== null && a.from === b.from && a.to === b.to;

const initialState: DiaryState = { dates: [], range: null, status: 'idle', revision: 0 };

export const fetchDiaryMarks = createAsyncThunk<LocalDate[], DiaryRange, { rejectValue: string }>(
  'diary/fetchDiaryMarks',
  async ({ from, to }, { rejectWithValue }) => {
    try {
      return (await diaryApi.getRange(from, to)).map((diary) => diary.date);
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

/** 일기를 저장·삭제한 뒤 지금 기간의 펜 표시를 다시 받는다 (06 월간 펜 아이콘) */
export const refreshDiaryMarks = createAsyncThunk<void, void, { state: { diary: DiaryState } }>('diary/refreshDiaryMarks', async (_, { getState, dispatch }) => {
  const { range } = getState().diary;
  if (range) await dispatch(fetchDiaryMarks(range));
});

const diarySlice = createSlice({
  name: 'diary',
  initialState,
  reducers: {
    /** 저장(exists: true)·삭제(false) 직후: 펜 표시를 바로 고치고 revision을 올린다 */
    diaryChanged: (state, action: PayloadAction<{ date: LocalDate; exists: boolean }>) => {
      const { date, exists } = action.payload;
      state.dates = state.dates.filter((d) => d !== date);
      if (exists) state.dates.push(date);
      state.revision += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiaryMarks.pending, (state, action) => {
        state.status = 'loading';
        state.range = action.meta.arg;
      })
      .addCase(fetchDiaryMarks.fulfilled, (state, action) => {
        // 늦게 도착한 옛 기간의 응답은 버린다
        if (!isSameRange(state.range, action.meta.arg)) return;
        state.status = 'succeeded';
        state.dates = action.payload;
      })
      .addCase(fetchDiaryMarks.rejected, (state, action) => {
        if (!isSameRange(state.range, action.meta.arg)) return;
        state.status = 'failed';
      });
  },
});

export const { diaryChanged } = diarySlice.actions;

const selectDateList = (state: { diary: DiaryState }) => state.diary.dates;
export const selectDiaryDates = createSelector(selectDateList, (dates) => new Set(dates));
export const selectDiaryRevision = (state: { diary: DiaryState }) => state.diary.revision;

export default diarySlice.reducer;
