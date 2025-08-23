"use client";

import { useMemo } from 'react';
import { CalendarGridProps } from '@components/calendar/types';
import ScheduleItem from '@components/calendar/monthly/ScheduleItem';
import WeekNumber from '@components/calendar/monthly/WeekNumber';
import { generateCalendarDays, isDifferentMonth, isSameDate } from '@components/calendar/utils/dateUtils';
import { useResponsiveCalendar } from '@components/calendar/hooks/useResponsiveCalendar';

// Props interface moved to types/index.ts

export default function CalendarGrid({ currentDate, selectedDate, schedules, onDateClick, theme }: CalendarGridProps) {
  const { days, weekNumbers } = useMemo(() => 
    generateCalendarDays(currentDate), [currentDate]);
  
  // 반응형 캘린더 hook 사용 (실제 주 개수 전달)
  const { cellHeight, maxDisplayableSchedules, getCellStyle, getWeekStyle } = useResponsiveCalendar({}, days.length);

  const getSchedulesForDate = (date: Date) => {
    const daySchedules = schedules.filter(schedule => {
      const targetDate = date.toDateString();
      const startDate = schedule.startDate.toDateString();
      const endDate = schedule.endDate.toDateString();
      
      // Check if the schedule spans this date
      return targetDate >= startDate && targetDate <= endDate;
    });

    // Sort schedules by time: all-day first, then by start time
    return daySchedules.sort((a, b) => {
      // All-day schedules come first
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      
      // If both are all-day or both are timed, sort by start time
      return a.startDate.getTime() - b.startDate.getTime();
    });
  };


  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: theme.themeColor.Light }} data-calendar-container="true">
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
        <div className="flex flex-1 min-w-0">
          {dayNames.map((day, index) => (
            <div 
              key={index} 
              className="p-2 text-center font-medium border-l flex-1 min-w-0 text-sm"
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
        <div key={weekIndex} className="flex border-b" style={{ borderColor: theme.themeColor.Theme2, ...getWeekStyle() }}>
          {/* Week number */}
          <WeekNumber 
            weekNumber={weekNumbers[weekIndex]} 
            theme={theme} 
            height={`h-[${cellHeight}px]`}
          />
          
          {/* Days */}
          <div className="flex flex-1 min-w-0">
            {week.map((date, dayIndex) => {
            const daySchedules = getSchedulesForDate(date);
            const isOtherMonth = isDifferentMonth(date, currentDate);
            const isDateSelected = isSameDate(selectedDate, date);
            
              return (
                <div
                  key={dayIndex}
                  className="border-l p-2 cursor-pointer relative flex-1 min-w-0 overflow-hidden"
                  style={{
                    borderColor: theme.themeColor.Theme2,
                    color: isOtherMonth ? theme.themeColor.Theme2 : theme.themeColor.Dark,
                    backgroundColor: isDateSelected ? theme.themeColor.Theme2 : 'transparent',
                    ...getCellStyle()
                  }}
                  onClick={() => onDateClick(date)}
                >
                  <div className="font-medium mb-1 text-sm">
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1 min-w-0">
                    {daySchedules.slice(0, maxDisplayableSchedules).map((schedule) => (
                      <ScheduleItem key={schedule.id} schedule={schedule} />
                    ))}
                    
                    {daySchedules.length > maxDisplayableSchedules && (
                      <div className="text-xs font-medium truncate" style={{ color: theme.themeColor.Theme1 }}>
                        Show +{daySchedules.length - maxDisplayableSchedules}
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
