export type ThemeStateType = {
  themeColor:ThemeColor,
  isDark:boolean;
}

export interface ThemeColor {
  ThemeName:string;
  ThemeCd:number;
  Dark:string;
  Theme1:string;
  Theme2:string;
  Theme3:string;
  Light:string;
};

export const greenColorTheme : ThemeColor = {
  ThemeName : 'greenColorTheme',
  ThemeCd : 1,
  Dark : "#243119",
  Theme1 : "#40543B",
  Theme2 : "#CCD5AE",
  Theme3 : "#E9EDC9",
  Light : "#FEFAE0"
};

export const brownColorTheme : ThemeColor = {
  ThemeName : 'brownColorTheme',
  ThemeCd : 2,
  Dark : "#332523",
  Theme1 : "#7F534B",
  Theme2 : "#D4A373",
  Theme3 : "#FAEDCD",
  Light : "#FEFAE0"
};

export const grayColorTheme : ThemeColor = {
  ThemeName : 'grayColorTheme',
  ThemeCd : 999,
  Dark : "#000000",
  Theme1 : "#474747",
  Theme2 : "#858585",
  Theme3 : "#CCCCCC",
  Light : "#FFFFFF"
};

export const defaultTheme:ThemeStateType = {
  themeColor: greenColorTheme, isDark: false 
};

// ---------------------------------------------------------------- 설정 값과 연결 (D-024)

/** 설정의 색 테마 값 (08-api-design 9절 `colorTheme`) */
export type ColorThemeCode = 'GREEN' | 'BROWN' | 'GRAY';

export const COLOR_THEMES: Record<ColorThemeCode, ThemeColor> = {
  GREEN: greenColorTheme,
  BROWN: brownColorTheme,
  GRAY: grayColorTheme,
};

/** 기본값: 녹색 · 라이트 (D-024) */
export const DEFAULT_COLOR_THEME: ColorThemeCode = 'GREEN';
export const DEFAULT_DARK_MODE = false;

/** 화면에 실제로 쓰는 5색 */
export type ThemePalette = Pick<ThemeColor, 'Dark' | 'Theme1' | 'Theme2' | 'Theme3' | 'Light'>;

/**
 * 테마 + 다크 모드 → 화면에 쓸 5색
 * 다크 모드는 Dark↔Light, Theme1↔Theme3를 서로 바꾼다. Theme2는 그대로 (06-screens 팔레트, US-02)
 */
export const resolveThemePalette = (code: ColorThemeCode, isDark: boolean): ThemePalette => {
  const { Dark, Theme1, Theme2, Theme3, Light } = COLOR_THEMES[code];
  return isDark
    ? { Dark: Light, Theme1: Theme3, Theme2, Theme3: Theme1, Light: Dark }
    : { Dark, Theme1, Theme2, Theme3, Light };
};
