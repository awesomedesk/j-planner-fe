import { ThemeColor } from '@components/theme/theme_color';

/**
 * 다크 모드일 때 색상을 반전시키는 유틸리티
 * Dark ↔ Light, Theme1 ↔ Theme3 서로 교환
 */
export function getComputedThemeColors(originalTheme: ThemeColor, isDark: boolean): ThemeColor {
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

/**
 * 색상 역할별 접근을 위한 헬퍼 타입
 */
export type ColorRole = 
  | 'primary'      // Theme1 (주요 색상)
  | 'secondary'    // Theme2 (보조 색상)
  | 'accent'       // Theme3 (강조 색상)
  | 'background'   // Light (배경 색상)
  | 'surface'      // Dark (표면 색상)
  | 'text'         // Dark (텍스트 색상)
  | 'textReverse'; // Light (반전 텍스트 색상)

/**
 * 역할별로 색상을 가져오는 헬퍼 함수
 */
export function getColorByRole(computedTheme: ThemeColor, role: ColorRole): string {
  switch (role) {
    case 'primary':
      return computedTheme.Theme1;
    case 'secondary':
      return computedTheme.Theme2;
    case 'accent':
      return computedTheme.Theme3;
    case 'background':
      return computedTheme.Light;
    case 'surface':
      return computedTheme.Dark;
    case 'text':
      return computedTheme.Dark;
    case 'textReverse':
      return computedTheme.Light;
    default:
      return computedTheme.Theme1;
  }
}

/**
 * CSS 변수로 테마 색상을 설정하는 유틸리티
 */
export function setCSSThemeVariables(computedTheme: ThemeColor): void {
  const root = document.documentElement;
  
  root.style.setProperty('--color-primary', computedTheme.Theme1);
  root.style.setProperty('--color-secondary', computedTheme.Theme2);
  root.style.setProperty('--color-accent', computedTheme.Theme3);
  root.style.setProperty('--color-background', computedTheme.Light);
  root.style.setProperty('--color-surface', computedTheme.Dark);
  root.style.setProperty('--color-text', computedTheme.Dark);
  root.style.setProperty('--color-text-reverse', computedTheme.Light);
}