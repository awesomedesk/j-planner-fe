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
  /**
   * 시간표(주간·일간)에서 보던 시간 = 맨 위에 보이는 시각 (00:00부터의 분)
   * 시간표 화면끼리 바꿀 때는 그대로, 월간으로 가거나 월간에서 들어오면 null → 처음 위치 규칙 (D-046)
   */
  timetableTopMinutes: number | null;
}

/** store를 만들 때의 오늘로 시작한다 (테스트에서 시각을 고정할 수 있게 함수로) */
const initialState = (): CalendarState => {
  const today = toLocalDate(new Date());
  return {
    viewMode: 'MONTH', // 첫 화면 = 월간 (D-009). 설정의 처음 화면은 US-27
    viewDate: today,
    selectedDate: today,
    timetableTopMinutes: null,
  };
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    /** 보기 전환: 고른 날짜가 들어 있는 달·주·날을 본다 (US-07) */
    setViewMode(state, action: PayloadAction<CalendarViewMode>) {
      if (state.viewMode === 'MONTH' || action.payload === 'MONTH') state.timetableTopMinutes = null;
      state.viewMode = action.payload;
      state.viewDate = state.selectedDate;
    },
    selectDate(state, action: PayloadAction<LocalDate>) {
      state.selectedDate = action.payload;
    },
    /** 날짜를 두 번 눌렀을 때: 그날 일간으로 (D-015) */
    openDayView(state, action: PayloadAction<LocalDate>) {
      if (state.viewMode === 'MONTH') state.timetableTopMinutes = null;
      state.selectedDate = action.payload;
      state.viewDate = action.payload;
      state.viewMode = 'DAY';
    },
    /** 시간표를 스크롤할 때 보던 시간을 기억 (D-046 ②) */
    setTimetableTopMinutes(state, action: PayloadAction<number>) {
      state.timetableTopMinutes = action.payload;
    },
  },
});

export const { setViewMode, selectDate, openDayView, setTimetableTopMinutes } = calendarSlice.actions;

export const selectViewMode = (state: { calendar: CalendarState }) => state.calendar.viewMode;
export const selectViewDate = (state: { calendar: CalendarState }) => state.calendar.viewDate;
export const selectSelectedDate = (state: { calendar: CalendarState }) => state.calendar.selectedDate;

export default calendarSlice.reducer;
