import { greenColorTheme, ThemeStateType, ThemeColor } from "@components/theme/theme_color";
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@utils/store/store';
import { getComputedThemeColors } from '@utils/theme/themeUtils';

export const defaultTheme:ThemeStateType = {
  themeColor: greenColorTheme, dark: false 
};

export const mainThemeSlice = createSlice({
  name: 'mainTheme',
  initialState:defaultTheme,
  reducers: {
    setDarkThemeState:(state) => {
      state.dark = true;
    },
    setLightThemeState:(state) => {
      state.dark = false;
    },
    setThemeColor:(state, action:PayloadAction<ThemeColor>) => {
      state.themeColor = action.payload;
    },
    toggleDarkMode:(state) => {
      state.dark = !state.dark;
    },
  },
})

export const {setDarkThemeState, setLightThemeState, setThemeColor, toggleDarkMode} = mainThemeSlice.actions

// 기본 테마 상태 셀렉터
export const getThemeState = (state:RootState) => state.mainTheme;

// 계산된 테마 색상을 반환하는 셀렉터 (다크 모드 고려)
export const getComputedThemeState = (state:RootState) => {
  const themeState = state.mainTheme;
  const computedColors = getComputedThemeColors(themeState.themeColor, themeState.dark);
  
  return {
    ...themeState,
    themeColor: computedColors
  };
};

export default mainThemeSlice.reducer;
