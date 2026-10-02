import { configureStore } from '@reduxjs/toolkit'

import themeReducer from './slices/themeSlice'
import noticeReducer from './slices/noticeSlice'
import categoryReducer from './slices/categorySlice'
import calendarReducer from './slices/calendarSlice'
import scheduleReducer from './slices/scheduleSlice'
import todoReducer from './slices/todoSlice'

const reducer = {
  theme: themeReducer,
  notice: noticeReducer,
  category: categoryReducer,
  calendar: calendarReducer,
  schedule: scheduleReducer,
  todo: todoReducer,
};

/** 새 store를 만든다. 앱은 아래 `store` 하나를 쓰고, 테스트는 매번 새로 만든다 */
export const makeStore = () => configureStore({ reducer });

export const store = makeStore();

// Infer the `RootState` and `AppDispatch` types from the store itself
export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
