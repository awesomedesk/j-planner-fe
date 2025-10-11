import { ThemeColor, defaultTheme } from "@components/theme/theme_color";
import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@utils/store/store';


// 원본 테마 상태 셀렉터 (내부용)
const getRawThemeState = (state: RootState) => {
  if (!state || !state.mainTheme) {
    return defaultTheme;
  }
  return state.mainTheme;
};

/**
 * 다크 모드 적용 함수
 * Dark ↔ Light, Theme1 ↔ Theme3 서로 교환
 */
function getComputedThemeColors(originalTheme: ThemeColor, isDark: boolean): ThemeColor {
  if (!isDark) {
    // 라이트 모드일 때는 원본 색상 그대로 반환
    return originalTheme;
  }

  // 다크 모드일 때 색상 교환
  return {
    ...originalTheme,
    Dark: originalTheme.Light,      // Dark → Light
    Theme1: originalTheme.Theme3,   // Theme1 → Theme3
    Theme2: originalTheme.Theme2,   // Theme2는 그대로
    Theme3: originalTheme.Theme1,   // Theme3 → Theme1
    Light: originalTheme.Dark       // Light → Dark
  };
}

export const mainThemeSlice = createSlice({
  name: 'mainTheme',
  initialState:defaultTheme,
  reducers: {
    setThemeColor:(state, action:PayloadAction<ThemeColor>) => {
      state.themeColor = action.payload;
    },
    setDarkThemeState:(state) => {
      state.isDark = true;
    },
    setLightThemeState:(state) => {
      state.isDark = false;
    },
    toggleDarkMode:(state) => {
      state.isDark = !state.isDark;
    },
  },
})

export const {
  setThemeColor, 
  setDarkThemeState, 
  setLightThemeState, 
  toggleDarkMode
} = mainThemeSlice.actions

// 원본 테마 색상 셀렉터 - 설정용 (다크모드 적용 안됨)
export const getOriginalThemeColor = (state: RootState) => {
  if (!state || !state.mainTheme || !state.mainTheme.themeColor) {
    return defaultTheme.themeColor;
  }
  return state.mainTheme.themeColor;
};

// 다크모드 상태 셀렉터
export const getThemeDarkMode = (state: RootState) => {
  if (!state || !state.mainTheme) {
    return defaultTheme.isDark;
  }
  return state.mainTheme.isDark;
};

// 계산된 테마 색상 셀렉터 - 다크모드가 적용된 최종 색상
export const getThemeColor = createSelector(
  [getOriginalThemeColor, getThemeDarkMode],
  (themeColor, isDark) => {
    try {
      return getComputedThemeColors(themeColor, isDark);
    } catch (error) {
      console.warn('Theme color computation error, using default:', error);
      return getComputedThemeColors(defaultTheme.themeColor, defaultTheme.isDark);
    }
  }
);

// 전체 테마 상태 셀렉터 - 계산된 색상이 포함된 상태
export const getThemeState = createSelector(
  [getRawThemeState, getThemeColor],
  (themeState, computedColors) => ({
    ...themeState,
    themeColor: computedColors
  })
);

export default mainThemeSlice.reducer;
