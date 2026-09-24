"use client";

import { useEffect } from 'react';

import { useAppSelector } from '@/app/hooks';
import { selectColorTheme, selectDarkMode } from '@store/slices/themeSlice';

import { resolveThemePalette } from './theme_color';
import { applyThemeToDocument } from './themeCssVariables';

/**
 * ThemeProvider - Redux의 테마 상태를 CSS 변수로 문서에 적용한다 (US-02)
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorTheme = useAppSelector(selectColorTheme);
  const darkMode = useAppSelector(selectDarkMode);

  useEffect(() => {
    applyThemeToDocument(resolveThemePalette(colorTheme, darkMode), darkMode);
  }, [colorTheme, darkMode]);

  return <>{children}</>;
}
