"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { CalendarHeaderProps, CalendarViewMode } from '@components/calendar/types';
import AwesomeButton, { ButtonSize, ButtonType } from '@components/button/AwesomeButton';
import { KOREAN_MONTH_NAMES, getWeekOfMonth, getKoreanDayOfWeek } from '@components/calendar/utils/scheduleUtils';

export default function CalendarHeader({ viewDate, viewMode, onToday, onPrev, onNext, onViewModeChange, theme }: CalendarHeaderProps) {
  const [showViewMenu, setShowViewMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentMonth = KOREAN_MONTH_NAMES[viewDate.getMonth()];
  const currentYear = viewDate.getFullYear();

  // Calculate additional info based on view mode
  const dateInfo = useMemo(() => {
    if (viewMode === 'week') {
      const weekNum = getWeekOfMonth(viewDate);
      return `${weekNum}주차`;
    } else if (viewMode === 'day') {
      const dayOfWeek = getKoreanDayOfWeek(viewDate);
      return `${viewDate.getDate()}일 (${dayOfWeek})`;
    }
    return '';
  }, [viewDate, viewMode]);

  const viewModeLabels: Record<CalendarViewMode, string> = {
    month: '월별보기',
    week: '주별보기',
    day: '일별보기',
  };

  const handleViewModeClick = (mode: CalendarViewMode) => {
    onViewModeChange(mode);
    setShowViewMenu(false);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowViewMenu(false);
      }
    }

    if (showViewMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showViewMenu]);

  // Handle escape key to close dropdown
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowViewMenu(false);
      }
    }

    if (showViewMenu) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showViewMenu]);

  return (
    <div className="calander-header flex items-center justify-between mb-4">
      {/* Left Navigation */}
      <div className="flex items-center space-x-4">
        <AwesomeButton
          size={ButtonSize.normal}
          type={ButtonType.light}
          text="‹"
          onClick={onPrev}
        />

        <div className="flex items-center space-x-2">
          <h2
            className="text-xl font-semibold"
            style={{
              color: theme.themeColor.Dark,
              minWidth: '200px',
              textAlign: 'left'
            }}
          >
            {currentYear}년 {currentMonth} {dateInfo}
          </h2>

          <AwesomeButton
            size={ButtonSize.normal}
            type={ButtonType.light}
            text="오늘"
            onClick={onToday}
          />
        </div>

        <AwesomeButton
          size={ButtonSize.normal}
          type={ButtonType.light}
          text="›"
          onClick={onNext}
        />
      </div>

      {/* Right Navigation - View Mode Selector */}
      <div className="flex items-center space-x-2 relative" ref={dropdownRef}>
        <AwesomeButton
          size={ButtonSize.normal}
          type={ButtonType.light}
          text={`${viewModeLabels[viewMode]} ☰`}
          onClick={() => setShowViewMenu(!showViewMenu)}
        />

        {showViewMenu && (
          <div
            className="absolute top-full right-0 mt-2 rounded-lg shadow-lg overflow-hidden z-50"
            style={{
              backgroundColor: theme.themeColor.Light,
              border: `1px solid ${theme.themeColor.Theme2}`,
              minWidth: '120px'
            }}
            role="menu"
            aria-label="View mode selector"
          >
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleViewModeClick(mode)}
                className="w-full px-4 py-2 text-left transition-colors"
                style={{
                  backgroundColor: viewMode === mode ? theme.themeColor.Theme1 : 'transparent',
                  color: viewMode === mode ? theme.themeColor.Light : theme.themeColor.Dark,
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== mode) {
                    e.currentTarget.style.backgroundColor = theme.themeColor.Theme2;
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== mode) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                role="menuitem"
                aria-current={viewMode === mode ? 'true' : 'false'}
              >
                {viewModeLabels[mode]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

