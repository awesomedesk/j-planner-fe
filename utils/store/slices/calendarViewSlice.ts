import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@utils/store/store';

export type CalendarViewMode = 'month' | 'week' | 'day';

export interface CalendarViewState {
  viewMode: CalendarViewMode;
}

const initialState: CalendarViewState = {
  viewMode: 'month',
};

export const calendarViewSlice = createSlice({
  name: 'calendarView',
  initialState,
  reducers: {
    setViewMode: (state, action: PayloadAction<CalendarViewMode>) => {
      state.viewMode = action.payload;
    },
    setMonthView: (state) => {
      state.viewMode = 'month';
    },
    setWeekView: (state) => {
      state.viewMode = 'week';
    },
    setDayView: (state) => {
      state.viewMode = 'day';
    },
  },
});

export const {
  setViewMode,
  setMonthView,
  setWeekView,
  setDayView,
} = calendarViewSlice.actions;

// Selector
export const getCalendarViewMode = (state: RootState) => {
  if (!state || !state.calendarView) {
    return initialState.viewMode;
  }
  return state.calendarView.viewMode;
};

export default calendarViewSlice.reducer;
