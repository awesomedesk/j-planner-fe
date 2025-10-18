import { configureStore } from '@reduxjs/toolkit'
import mainThemeReducer from '@utils/store/slices/mainThemeSlice'
import mainMenuReducer from '@utils/store/slices/mainMenuSlice'
import calendarViewReducer from '@utils/store/slices/calendarViewSlice'

export const store = configureStore({
  reducer: {
    mainTheme:mainThemeReducer,
    mainMenu:mainMenuReducer,
    calendarView:calendarViewReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
