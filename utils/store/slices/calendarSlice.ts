import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { LocalDate } from '@/types/api';

import { toLocalDate } from '@components/calendar/utils/calendarUtils';

/**
 * 달력 보기 상태 (US-06~09)
 * - viewDate: 보고 있는 날짜(달·주·일의 기준). 날짜 이동은 US-09
 * - selectedDate: 고른 날짜 (사이드바·날짜 시트 기준, 기본 오늘, D-015)
 */
export type CalendarViewMode = 'MONTH' | 'WEEK' | 'DAY';

interface CalendarState {
  viewMode: CalendarViewMode;
  viewDate: LocalDate;
  selectedDate: LocalDate;
}

const today = toLocalDate(new Date());

const initialState: CalendarState = {
  viewMode: 'MONTH', // 첫 화면 = 월간 (D-009). 설정의 처음 화면은 US-27
  viewDate: today,
  selectedDate: today,
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setViewMode(state, action: PayloadAction<CalendarViewMode>) {
      state.viewMode = action.payload;
    },
    selectDate(state, action: PayloadAction<LocalDate>) {
      state.selectedDate = action.payload;
    },
    /** 날짜를 두 번 눌렀을 때: 그날 일간으로 (D-015) */
    openDayView(state, action: PayloadAction<LocalDate>) {
      state.selectedDate = action.payload;
      state.viewDate = action.payload;
      state.viewMode = 'DAY';
    },
  },
});

export const { setViewMode, selectDate, openDayView } = calendarSlice.actions;

export const selectViewMode = (state: { calendar: CalendarState }) => state.calendar.viewMode;
export const selectViewDate = (state: { calendar: CalendarState }) => state.calendar.viewDate;
export const selectSelectedDate = (state: { calendar: CalendarState }) => state.calendar.selectedDate;

export default calendarSlice.reducer;
