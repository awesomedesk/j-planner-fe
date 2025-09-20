"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMainMenuState } from "@utils/store/slices/mainMenuSlice";
import AwesomeButton, { ButtonSize, ButtonType } from "@components/button/AwesomeButton";
import { toggleMenu } from "@utils/store/slices/mainMenuSlice";
import { useTheme, useThemeColors } from "@utils/hooks/useTheme";
import ThemeSelector from "@components/theme/ThemeSelector";

export default function MainMenu() {
  const menuState = useSelector(getMainMenuState);
  const dispatch = useDispatch();
  const theme = useTheme();
  const colors = useThemeColors();
  const [isThemeSectionOpen, setIsThemeSectionOpen] = useState(false);
  
  console.log("MainMenu isOpen : ", menuState);
  if (!menuState.isOpen) return null;

  const handleMenuClick = () => {
    console.log("handleMenuClick");
    dispatch(toggleMenu());
  };

  const toggleThemeSection = () => {
    setIsThemeSectionOpen(!isThemeSectionOpen);
  };

  return (
    <div 
      className="fixed top-0 right-0 h-full w-64 shadow-lg transform transition-transform duration-300 ease-in-out z-50"
      style={{ 
        backgroundColor: colors.background,
        color: colors.text,
        borderLeft: `1px solid ${colors.secondary}`
      }}
    >
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">메뉴</h3>
          <AwesomeButton
            size={ButtonSize.mini}
            type={ButtonType.light}
            text="×"
            onClick={handleMenuClick}
          />
        </div>

        {/* 네비게이션 */}
        <nav className="space-y-4 mb-8">
          <a 
            href="#" 
            className="block py-2 px-3 rounded transition-colors hover:opacity-80"
            style={{ 
              color: colors.text,
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = colors.secondary}
            onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
          >
            대시보드
          </a>
          <a 
            href="#" 
            className="block py-2 px-3 rounded transition-colors hover:opacity-80"
            style={{ color: colors.text }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = colors.secondary}
            onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
          >
            프로필
          </a>
          <a 
            href="#" 
            className="block py-2 px-3 rounded transition-colors hover:opacity-80"
            style={{ color: colors.text }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = colors.secondary}
            onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
          >
            설정
          </a>
        </nav>

        {/* 테마 설정 섹션 */}
        <div className="border-t pt-4" style={{ borderColor: colors.secondary }}>
          <button
            onClick={toggleThemeSection}
            className="w-full flex items-center justify-between p-3 rounded-lg transition-colors hover:opacity-80"
            style={{
              backgroundColor: isThemeSectionOpen ? colors.accent : 'transparent',
              color: colors.text
            }}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">🎨</span>
              <span className="font-medium">테마 설정</span>
            </div>
            <span 
              className={`transition-transform duration-200 ${
                isThemeSectionOpen ? 'rotate-180' : 'rotate-0'
              }`}
            >
              ▼
            </span>
          </button>

          {/* 접을 수 있는 테마 설정 영역 */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isThemeSectionOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="pt-4">
              <ThemeSelector />
            </div>
          </div>

          {/* 간단한 현재 테마 표시 (항상 보임) */}
          {!isThemeSectionOpen && (
            <div className="mt-2 px-3">
              <div className="flex items-center space-x-2 text-xs opacity-75">
                <div className="flex space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: theme.themeColor.Theme1 }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: theme.themeColor.Theme2 }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: theme.themeColor.Theme3 }}
                  />
                </div>
                <span>
                  {theme.themeColor.ThemeName} {theme.dark ? '(다크)' : '(라이트)'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
