import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  DEFAULT_COLOR_THEME,
  DEFAULT_DARK_MODE,
  type ColorThemeCode,
} from '@components/theme/theme_color';

/**
 * 색 테마·다크 모드 상태 (THEME-01·02, D-024)
 * M0(US-02)은 기본값으로 표시만 한다. 설정 화면(US-26)에서 서버 설정(`/settings`)과 연결한다.
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
});

export const { setColorTheme, setDarkMode } = themeSlice.actions;

export const selectColorTheme = (state: { theme: ThemeState }) => state.theme.colorTheme;
export const selectDarkMode = (state: { theme: ThemeState }) => state.theme.darkMode;

export default themeSlice.reducer;
