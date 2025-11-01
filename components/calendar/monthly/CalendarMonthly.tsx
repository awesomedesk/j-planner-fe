"use client";

import { useMemo, useState, useEffect } from 'react';
import { CalendarGridProps } from '../types';
import ScheduleItem from './ScheduleItem';
import WeekNumber from './WeekNumber';
import { generateCalendarDays, isDifferentMonth, isSameDate } from '../utils/dateUtils';
import { useSelector } from 'react-redux';
import { getThemeColor } from '@utils/store/slices/mainThemeSlice';
import { startOfDay, endOfDay, isWithinInterval, isSameDay } from 'date-fns';
import { CALENDAR_LAYOUT_CONSTANTS } from '../constants/calendar';

/**
 * CalendarMonthly - Client-side monthly calendar view component
 * This component uses Redux and browser APIs, so it must be rendered client-side only
 * Wrapped by CalendarMonthlyWrapper to handle SSR/hydration
 */
export default function CalendarMonthly({ viewDate, selectedDate, schedules, onDateClick }: Omit<CalendarGridProps, 'theme'>) {
  const { days, weekNumbers } = useMemo(() =>
    generateCalendarDays(viewDate), [viewDate]);
  const themeColors = useSelector(getThemeColor);

  const colors = {
    background: themeColors.Light,
    secondary: themeColors.Theme2,
    accent: themeColors.Theme3,
    text: themeColors.Dark,
    primary: themeColors.Theme1,
    textReverse: themeColors.Light
  };
  // Fix hydration mismatch by using null as initial state
  const [windowHeight, setWindowHeight] = useState<number | null>(null);

  useEffect(() => {
    // Set initial height after client-side render
    setWindowHeight(window.innerHeight);

    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getSchedulesForDate = (date: Date) => {
    return schedules
      .filter(schedule => {
        // date-fns를 사용하여 정확한 날짜 비교
        const scheduleStart = startOfDay(schedule.startDateTime);
        const scheduleEnd = endOfDay(schedule.endDateTime);
        const targetDate = startOfDay(date);

        // 대상 날짜가 일정 기간에 포함되는지 확인
        return isWithinInterval(targetDate, { start: scheduleStart, end: scheduleEnd }) ||
               isSameDay(targetDate, scheduleStart) ||
               isSameDay(targetDate, scheduleEnd);
      })
      .sort((a, b) => {
        // Sort by allDay first (all-day events first), then by start time
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;

        // If both are all-day or both are timed, sort by start time
        return a.startDateTime.getTime() - b.startDateTime.getTime();
      });
  };

  // Calculate cell height based on available container height - memoized
  const cellHeight = useMemo(() => {
    const weekCount = days.length;
    const availableHeight = (windowHeight || 800)
      - CALENDAR_LAYOUT_CONSTANTS.MAIN_HEADER_HEIGHT
      - CALENDAR_LAYOUT_CONSTANTS.FOOTER_HEIGHT
      - CALENDAR_LAYOUT_CONSTANTS.CALENDAR_HEADER_HEIGHT
      - CALENDAR_LAYOUT_CONSTANTS.PADDING;
    return Math.max(CALENDAR_LAYOUT_CONSTANTS.MIN_CELL_HEIGHT, availableHeight / weekCount);
  }, [days.length, windowHeight]);

  // Calculate maximum schedules based on dynamic cell height - memoized
  const maxSchedulesCount = useMemo(() => {
    const availableHeight = cellHeight
      - CALENDAR_LAYOUT_CONSTANTS.DATE_HEIGHT
      - CALENDAR_LAYOUT_CONSTANTS.CELL_PADDING
      - CALENDAR_LAYOUT_CONSTANTS.SHOW_MORE_HEIGHT;
    return Math.max(1, Math.floor(availableHeight / CALENDAR_LAYOUT_CONSTANTS.SCHEDULE_ITEM_HEIGHT));
  }, [cellHeight]);

  // Show loading state during SSR or before windowHeight is set
  if (windowHeight === null) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-lg" style={{ color: colors.text }}>Loading calendar...</div>
      </div>
    );
  }

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
                const isOtherMonth = isDifferentMonth(date, viewDate);
                const isDateSelected = isSameDate(selectedDate, date);
                const isToday = isSameDate(new Date(), date);
                const isViewDate = isSameDate(viewDate, date); // URL 날짜와 일치
                // Use the memoized max schedules count
                const visibleSchedules = daySchedules.slice(0, maxSchedulesCount);
                const hasMoreSchedules = daySchedules.length > maxSchedulesCount;

                  return (
                    <div
                      key={dayIndex}
                      className="border-l p-2 cursor-pointer relative flex-1 min-w-0 h-full flex flex-col"
                      style={{
                        borderColor: colors.secondary,
                        color: isOtherMonth ? colors.secondary : colors.text,
                        backgroundColor: isViewDate ? colors.accent : (isDateSelected ? colors.secondary : 'transparent')
                      }}
                      onClick={() => onDateClick(date)}
                    >
                      <div className="font-medium mb-1 text-sm flex-shrink-0 relative">
                        {isToday ? (
                          <div
                            className="rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            style={{ backgroundColor: colors.primary, color: colors.textReverse }}
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
                            show +{daySchedules.length - maxSchedulesCount}
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