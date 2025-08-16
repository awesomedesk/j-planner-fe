"use client";

import { CalendarHeaderProps } from './types';

export default function CalendarHeader({ currentDate, onPrevMonth, onNextMonth, theme }: CalendarHeaderProps) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  return (
    <div className="flex items-center justify-between mb-4 px-2">
      {/* Left Navigation */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={onPrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md"
          style={{
            backgroundColor: theme.themeColor.Theme3,
            color: theme.themeColor.Dark
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
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
          
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-md"
            style={{
              backgroundColor: theme.themeColor.Theme3,
              color: theme.themeColor.Dark
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        <button 
          onClick={onNextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md"
          style={{
            backgroundColor: theme.themeColor.Theme3,
            color: theme.themeColor.Dark
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Right Navigation */}
      <div className="flex items-center space-x-2">
        <button 
          className="px-3 py-1.5 rounded-md text-sm flex items-center space-x-1"
          style={{
            backgroundColor: theme.themeColor.Theme3,
            color: theme.themeColor.Dark
          }}
        >
          <span>월별보기</span>
        </button>
        
        <button 
          className="w-8 h-8 flex items-center justify-center rounded-md"
          style={{
            backgroundColor: theme.themeColor.Theme3,
            color: theme.themeColor.Dark
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

