import { useSelector } from 'react-redux';
import { getComputedThemeState } from '@utils/store/slices/mainThemeSlice';
import { getColorByRole, ColorRole } from '@utils/theme/themeUtils';

/**
 * 계산된 테마 상태를 가져오는 훅 (다크 모드 자동 적용)
 */
export function useTheme() {
  return useSelector(getComputedThemeState);
}

/**
 * 역할별 색상을 쉽게 가져오는 훅
 */
export function useThemeColors() {
  const theme = useTheme();
  
  return {
    // 직접 색상 접근
    primary: theme.themeColor.Theme1,
    secondary: theme.themeColor.Theme2,
    accent: theme.themeColor.Theme3,
    background: theme.themeColor.Light,
    surface: theme.themeColor.Dark,
    text: theme.themeColor.Dark,
    textReverse: theme.themeColor.Light,
    
    // 역할별 색상 가져오기 함수
    getColor: (role: ColorRole) => getColorByRole(theme.themeColor, role),
    
    // 전체 테마 정보
    isDark: theme.dark,
    themeName: theme.themeColor.ThemeName,
    
    // 원본 색상 (계산 전)
    originalColors: theme.themeColor
  };
}

/**
 * 특정 색상 역할만 가져오는 훅
 */
export function useThemeColor(role: ColorRole) {
  const theme = useTheme();
  return getColorByRole(theme.themeColor, role);
}

/**
 * 스타일 객체를 쉽게 만들 수 있는 훅
 */
export function useThemeStyles() {
  const colors = useThemeColors();
  
  return {
    // 자주 사용하는 스타일 조합
    primaryButton: {
      backgroundColor: colors.primary,
      color: colors.textReverse
    },
    secondaryButton: {
      backgroundColor: colors.secondary,
      color: colors.text
    },
    card: {
      backgroundColor: colors.background,
      color: colors.text,
      borderColor: colors.secondary
    },
    surface: {
      backgroundColor: colors.surface,
      color: colors.textReverse
    },
    
    // 커스텀 스타일 생성 헬퍼
    createStyle: (bgRole: ColorRole, textRole: ColorRole = 'text') => ({
      backgroundColor: colors.getColor(bgRole),
      color: colors.getColor(textRole)
    })
  };
}