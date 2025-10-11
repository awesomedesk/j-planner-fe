"use client";

import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode, setThemeColor, getOriginalThemeColor, getThemeColor, getThemeDarkMode } from "@utils/store/slices/mainThemeSlice";
import { greenColorTheme, brownColorTheme, grayColorTheme } from "@components/theme/theme_color";

export default function ThemeSelector() {
  const dispatch = useDispatch();
  const currentThemeColor = useSelector(getOriginalThemeColor); // 원본 테마 색상 (설정용)
  const themeColors = useSelector(getThemeColor); // 계산된 테마 색상 (표시용)
  const isDark = useSelector(getThemeDarkMode);

  const colors = {
    primary: themeColors.Theme1,
    secondary: themeColors.Theme2,
    accent: themeColors.Theme3,
    background: themeColors.Light,
    surface: themeColors.Dark,
    text: themeColors.Dark,
    textReverse: themeColors.Light
  };

  const handleThemeChange = (themeColor: any) => {
    dispatch(setThemeColor(themeColor));
  };

  const handleDarkModeToggle = () => {
    dispatch(toggleDarkMode());
  };

  const availableThemes = [
    { name: '그린', theme: greenColorTheme },
    { name: '브라운', theme: brownColorTheme },
    { name: '그레이', theme: grayColorTheme }
  ].sort((a, b) => a.theme.ThemeCd - b.theme.ThemeCd);

  return (
    <div>
      {/* 테마 선택 */}
      <div className="mb-6">
        {/* 다크 모드 토글 */}
        <div className="flex items-center justify-between mb-3">
        
          <span className="text-sm font-medium">다크 모드</span>
          <button
            onClick={handleDarkModeToggle}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
            style={{
              backgroundColor: isDark ? colors.primary : colors.secondary
            }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {/* 테마 색상 선택 */}
        <h5 className="text-sm font-medium mb-3">테마 색상</h5>
        <div className="space-y-2">
          {availableThemes.map((item) => (
            <button
              key={item.theme.ThemeCd}
              onClick={() => handleThemeChange(item.theme)}
              className="w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:scale-102"
              style={{
                backgroundColor: currentThemeColor.ThemeCd === item.theme.ThemeCd ? colors.accent : colors.background,
                borderColor: currentThemeColor.ThemeCd === item.theme.ThemeCd ? colors.primary : colors.secondary,
                color: colors.text
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: item.theme.Theme1 }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: item.theme.Theme2 }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: item.theme.Theme3 }}
                  />
                </div>
                <span className="text-sm">{item.name}</span>
              </div>
              {currentThemeColor.ThemeCd === item.theme.ThemeCd && (
                <span className="text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>


      {/* 현재 테마 정보 */}
      <div className="mt-6 p-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
        <div className="text-xs opacity-75 mb-1" style={{ color: colors.textReverse }}>현재 테마</div>
        <div className="text-sm font-medium" style={{ color: colors.textReverse }}>
          {themeColors.ThemeName} {isDark ? '(다크)' : '(라이트)'}
        </div>
        <p className="text-xs opacity-75" style={{ color: colors.textReverse }}>
          {isDark ? '다크 모드 활성화됨' : '라이트 모드 활성화됨'}
        </p>
      </div>
    </div>
  );
}
