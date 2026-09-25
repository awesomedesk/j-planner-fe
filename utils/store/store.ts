import { configureStore } from '@reduxjs/toolkit'

import themeReducer from './slices/themeSlice'
import noticeReducer from './slices/noticeSlice'
import categoryReducer from './slices/categorySlice'
import calendarReducer from './slices/calendarSlice'
import scheduleReducer from './slices/scheduleSlice'

// 슬라이스를 만들면 여기에 추가한다
export const store = configureStore({
  reducer: {
    theme: themeReducer,
    notice: noticeReducer,
    category: categoryReducer,
    calendar: calendarReducer,
    schedule: scheduleReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
