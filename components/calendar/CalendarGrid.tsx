"use client";

import { useMemo } from 'react';
import { CalendarGridProps } from './types';
import ScheduleItem from './ScheduleItem';
import WeekNumber from './WeekNumber';
import { generateCalendarDays, isDifferentMonth, isSameDate } from './utils/dateUtils';

// Props interface moved to types/index.ts

export default function CalendarGrid({ currentDate, selectedDate, schedules, onDateClick, theme }: CalendarGridProps) {
  const { days, weekNumbers } = useMemo(() => 
    generateCalendarDays(currentDate), [currentDate]);

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(schedule => 
      schedule.date.toDateString() === date.toDateString()
    );
  };

  // Dynamic height based on available space and number of weeks
  const getFlexHeight = () => {
    const weekCount = days.length;
    return `flex-1`; // Each row takes equal portion of available space
  };

  const getCellFlexHeight = () => {
    return 'h-full'; // Cell takes full height of its row
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: theme.themeColor.Light }}>
      {/* Week number column + Day headers */}
      <div className="flex border-b" style={{ borderColor: theme.themeColor.Theme2 }}>
        {/* Empty space for week number column */}
        <div 
          className="p-2 text-center font-medium"
          style={{
            backgroundColor: theme.themeColor.Theme3,
            color: theme.themeColor.Dark,
            borderColor: theme.themeColor.Theme2,
            width: '2.5rem',
            minWidth: '2.5rem',
            maxWidth: '2.5rem'
          }}
        ></div>
        {/* Day headers with flexible width */}
        <div className="flex flex-1">
          {dayNames.map((day, index) => (
            <div 
              key={index} 
              className="p-2 text-center font-medium border-l flex-1"
              style={{
                backgroundColor: theme.themeColor.Theme3,
                color: theme.themeColor.Dark,
                borderColor: theme.themeColor.Theme2
              }}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      {days.map((week, weekIndex) => (
        <div key={weekIndex} className={`flex border-b ${getFlexHeight()}`} style={{ borderColor: theme.themeColor.Theme2 }}>
          {/* Week number */}
          <WeekNumber 
            weekNumber={weekNumbers[weekIndex]} 
            theme={theme} 
            height="h-full"
          />
          
          {/* Days */}
          <div className="flex flex-1">
            {week.map((date, dayIndex) => {
            const daySchedules = getSchedulesForDate(date);
            const isOtherMonth = isDifferentMonth(date, currentDate);
            const isDateSelected = isSameDate(selectedDate, date);
            
              return (
                <div
                  key={dayIndex}
                  className={`border-l p-2 cursor-pointer relative flex-1 ${getCellFlexHeight()}`}
                  style={{
                    borderColor: theme.themeColor.Theme2,
                    color: isOtherMonth ? theme.themeColor.Theme2 : theme.themeColor.Dark,
                    backgroundColor: isDateSelected ? theme.themeColor.Theme2 : 'transparent'
                  }}
                  onClick={() => onDateClick(date)}
                >
                  <div className="font-medium mb-1">
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {daySchedules.slice(0, 4).map((schedule) => (
                      <ScheduleItem key={schedule.id} schedule={schedule} />
                    ))}
                    
                    {daySchedules.length > 4 && (
                      <div className="text-xs font-medium" style={{ color: theme.themeColor.Theme1 }}>
                        Show +{daySchedules.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

