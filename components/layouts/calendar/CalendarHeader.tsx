"use client";

import { CalendarHeaderProps } from '@components/calendar/types';
import AwesomeButton, { ButtonSize, ButtonType } from '@components/button/AwesomeButton';

export default function CalendarHeader({ viewDate, onToday, onPrevMonth, onNextMonth, theme }: CalendarHeaderProps) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonth = monthNames[viewDate.getMonth()];
  const currentYear = viewDate.getFullYear();

  return (
    <div className="calander-header flex items-center justify-between mb-4">
      {/* Left Navigation */}
      <div className="flex items-center space-x-4">
        <AwesomeButton
          size={ButtonSize.normal}
          type={ButtonType.light}
          text="‹"
          onClick={onPrevMonth}
        />
        
        <div className="flex items-center space-x-2">
          <h2 
            className="text-xl font-semibold"
            style={{ 
              color: theme.themeColor.Dark,
              minWidth: '200px', // Fixed width based on "2023 September" (~200px)
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
          onClick={onNextMonth}
        />
      </div>

      {/* Right Navigation */}
      <div className="flex items-center space-x-2">
        <AwesomeButton
          size={ButtonSize.normal}
          type={ButtonType.light}
          text="월별보기"
        />
        
        <AwesomeButton
          size={ButtonSize.normal}
          type={ButtonType.light}
          text="⋮"
        />
      </div>
    </div>
  );
}

