"use client";

import { useMemo } from 'react';
import { CalendarGridProps } from '../types';
import ScheduleItem from './ScheduleItem';
import WeekNumber from './WeekNumber';
import { generateCalendarDays, isDifferentMonth, isSameDate } from '../utils/dateUtils';
import { useThemeColors } from '@utils/hooks/useTheme';

// Props interface moved to types/index.ts

export default function CalendarGrid({ currentDate, selectedDate, schedules, onDateClick }: Omit<CalendarGridProps, 'theme'>) {
  const { days, weekNumbers } = useMemo(() =>
    generateCalendarDays(currentDate), [currentDate]);
  const colors = useThemeColors();

  const getSchedulesForDate = (date: Date) => {
    return schedules
      .filter(schedule => {
        const startDate = new Date(schedule.startDateTime.getFullYear(), schedule.startDateTime.getMonth(), schedule.startDateTime.getDate());
        const endDate = new Date(schedule.endDateTime.getFullYear(), schedule.endDateTime.getMonth(), schedule.endDateTime.getDate());
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // Check if the target date falls between start and end dates (inclusive)
        return targetDate >= startDate && targetDate <= endDate;
      })
      .sort((a, b) => {
        // Sort by isAllDay first (all-day events first), then by start time
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;

        // If both are all-day or both are timed, sort by start time
        return a.startDateTime.getTime() - b.startDateTime.getTime();
      });
  };

  // Calculate maximum schedules based on dynamic cell height
  const getMaxSchedulesCount = (cellHeight: number) => {
    // Date number height: ~20px (text-sm + mb-1)
    // Each schedule item height: ~22px (text-xs + py-1 + space-y-1)
    // Cell padding: 16px (p-2 top/bottom)
    const dateHeight = 20;
    const padding = 16;
    const scheduleItemHeight = 22;
    const availableHeight = cellHeight - dateHeight - padding;
    return Math.max(1, Math.floor(availableHeight / scheduleItemHeight) - 1);
  };

  // Calculate cell height based on available container height
  const getCellHeight = () => {
    const weekCount = days.length;
    const calendarHeaderHeight = 40; // Day headers height
    const mainHeaderHeight = 60; // MainHeader height
    const footerHeight = 60; // Estimated footer height
    const padding = 32; // Additional padding/margins
    const availableHeight = `calc((100vh - ${mainHeaderHeight}px - ${footerHeight}px - ${calendarHeaderHeight}px - ${padding}px) / ${weekCount})`;
    return availableHeight;
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: colors.background }}>
      {/* Week number column + Day headers */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: colors.secondary, height: '40px' }}>
        {/* Empty space for week number column */}
        <div
          className="p-2 text-center font-medium flex-shrink-0"
          style={{
            backgroundColor: colors.accent,
            color: colors.text,
            borderColor: colors.secondary,
            width: '2.5rem'
          }}
        ></div>
        {/* Day headers with flexible width */}
        <div className="flex flex-1 min-w-0">
          {dayNames.map((day, index) => (
            <div
              key={index}
              className="p-2 text-center font-medium border-l flex-1 min-w-0"
              style={{
                backgroundColor: colors.accent,
                color: colors.text,
                borderColor: colors.secondary
              }}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 flex flex-col min-h-0">
        {days.map((week, weekIndex) => {
          const cellHeight = getCellHeight();
          return (
            <div
              key={weekIndex}
              className="flex border-b flex-1"
              style={{
                borderColor: colors.secondary,
                height: cellHeight,
                minHeight: '80px'
              }}
            >
              {/* Week number */}
              <WeekNumber
                weekNumber={weekNumbers[weekIndex]}
                height="h-full"
              />

              {/* Days */}
              <div className="flex flex-1 min-w-0">
                {week.map((date, dayIndex) => {
                const daySchedules = getSchedulesForDate(date);
                const isOtherMonth = isDifferentMonth(date, currentDate);
                const isDateSelected = isSameDate(selectedDate, date);
                const isToday = isSameDate(new Date(), date);
                // Calculate dynamic height for this cell
                const estimatedCellHeight = 80; // minimum height as fallback
                const maxSchedules = getMaxSchedulesCount(estimatedCellHeight);
                const visibleSchedules = daySchedules.slice(0, maxSchedules);
                const hasMoreSchedules = daySchedules.length > maxSchedules;

                  return (
                    <div
                      key={dayIndex}
                      className="border-l p-2 cursor-pointer relative flex-1 min-w-0 h-full flex flex-col"
                      style={{
                        borderColor: colors.secondary,
                        color: isOtherMonth ? colors.secondary : colors.text,
                        backgroundColor: isDateSelected ? colors.secondary : 'transparent'
                      }}
                      onClick={() => onDateClick(date)}
                    >
                      <div className="font-medium mb-1 text-sm flex-shrink-0 relative">
                        {isToday ? (
                          <div
                            className="text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            style={{ backgroundColor: colors.primary }}
                          >
                            {date.getDate()}
                          </div>
                        ) : (
                          <span>{date.getDate()}</span>
                        )}
                      </div>

                      <div className="space-y-1 flex-1 overflow-hidden">
                        {visibleSchedules.map((schedule) => (
                          <ScheduleItem key={schedule.id} schedule={schedule} />
                        ))}

                        {hasMoreSchedules && (
                          <div className="text-xs font-medium text-center"
                            style={{ color: colors.primary }}>
                            show +{daySchedules.length - maxSchedules}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
