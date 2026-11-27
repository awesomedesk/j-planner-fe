import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { applySettings, fetchSettings } from './settingsSlice';
import {
  DEFAULT_COLOR_THEME,
  DEFAULT_DARK_MODE,
  type ColorThemeCode,
} from '@utils/theme/theme_color';

/**
 * 색 테마·다크 모드 상태 (THEME-01·02, D-024)
 * 서버 설정(`/settings`)의 darkMode·colorTheme를 따른다: 받았을 때와 바꿀 때(되돌릴 때 포함) 바로 반영 (US-26, SET-05)
 */
export interface ThemeState {
  colorTheme: ColorThemeCode;
  darkMode: boolean;
}

const initialState: ThemeState = {
  colorTheme: DEFAULT_COLOR_THEME,
  darkMode: DEFAULT_DARK_MODE,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setColorTheme(state, action: PayloadAction<ColorThemeCode>) {
      state.colorTheme = action.payload;
    },
    setDarkMode(state, action: PayloadAction<boolean>) {
      state.darkMode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.colorTheme = action.payload.colorTheme ?? state.colorTheme;
        state.darkMode = action.payload.darkMode ?? state.darkMode;
      })
      .addCase(applySettings, (state, action) => {
        if (action.payload.colorTheme !== undefined) state.colorTheme = action.payload.colorTheme;
        if (action.payload.darkMode !== undefined) state.darkMode = action.payload.darkMode;
      });
  },
});

export const { setColorTheme, setDarkMode } = themeSlice.actions;

export const selectColorTheme = (state: { theme: ThemeState }) => state.theme.colorTheme;
export const selectDarkMode = (state: { theme: ThemeState }) => state.theme.darkMode;

export default themeSlice.reducer;
