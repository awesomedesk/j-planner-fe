import type { ThemePalette } from './theme_color';

/**
 * 테마 5색 → CSS 변수 (`--tp-*`)
 *
 * 화면 코드는 색값을 직접 쓰지 않고 Tailwind의 `tp-*` 색(tailwind.config.ts)을 쓴다.
 * 테마·다크 모드를 바꾸면 변수만 바뀌고 화면 전체가 따라 바뀐다.
 * 기본값(녹색·라이트)은 app/globals.css의 :root에도 적어 두어 첫 화면부터 색이 맞게 한다.
 */
export const THEME_CSS_VARIABLE = {
  dark: '--tp-dark',
  theme1: '--tp-theme1',
  theme2: '--tp-theme2',
  theme3: '--tp-theme3',
  light: '--tp-light',
} as const;

export const toThemeCssVariables = (palette: ThemePalette): Record<string, string> => ({
  [THEME_CSS_VARIABLE.dark]: palette.Dark,
  [THEME_CSS_VARIABLE.theme1]: palette.Theme1,
  [THEME_CSS_VARIABLE.theme2]: palette.Theme2,
  [THEME_CSS_VARIABLE.theme3]: palette.Theme3,
  [THEME_CSS_VARIABLE.light]: palette.Light,
});

/** 문서 전체(html)에 테마 변수를 적용한다 */
export const applyThemeToDocument = (palette: ThemePalette, isDark: boolean) => {
  const root = document.documentElement;
  Object.entries(toThemeCssVariables(palette)).forEach(([name, value]) => root.style.setProperty(name, value));
  root.dataset.theme = isDark ? 'dark' : 'light';
  root.style.colorScheme = isDark ? 'dark' : 'light';
};
