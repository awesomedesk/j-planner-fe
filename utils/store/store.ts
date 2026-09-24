import { configureStore } from '@reduxjs/toolkit'

// 슬라이스를 만들면 여기에 추가한다. 예: calendarView: calendarViewReducer
export const store = configureStore({
  reducer: {},
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
