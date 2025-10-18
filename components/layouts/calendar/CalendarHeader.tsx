"use client";

import { useState } from 'react';
import { CalendarHeaderProps, CalendarViewMode } from '@components/calendar/types';
import AwesomeButton, { ButtonSize, ButtonType } from '@components/button/AwesomeButton';

export default function CalendarHeader({ viewDate, viewMode, onToday, onPrev, onNext, onViewModeChange, theme }: CalendarHeaderProps) {
  const [showViewMenu, setShowViewMenu] = useState(false);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonth = monthNames[viewDate.getMonth()];
  const currentYear = viewDate.getFullYear();

  const viewModeLabels: Record<CalendarViewMode, string> = {
    month: '월별보기',
    week: '주별보기',
    day: '일별보기',
  };

  const handleViewModeClick = (mode: CalendarViewMode) => {
    onViewModeChange(mode);
    setShowViewMenu(false);
  };

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
            {currentYear} {currentMonth}
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
      <div className="flex items-center space-x-2 relative">
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

