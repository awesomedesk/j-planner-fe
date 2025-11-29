"use client";

import { useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { CalendarGridProps } from '../types';
import { format, isSameDay, isToday } from 'date-fns';
import { getSchedulePosition, formatHourLabel } from '../utils/scheduleUtils';
import { WEEKLY_DAILY_VIEW_CONSTANTS } from '../constants/calendar';
import { getScheduleColors } from '../utils/colorUtils';
import { useScheduleLayout } from '../hooks/useScheduleLayout';
import { useCurrentTimeIndicator } from '../hooks/useCurrentTimeIndicator';
import { useAutoScroll } from '../hooks/useAutoScroll';

export default function CalendarDaily({ viewDate, schedules }: Omit<CalendarGridProps, 'theme' | 'selectedDate' | 'onDateClick'>) {
  const theme = useSelector(getThemeState);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Calculate dynamic height for a schedule based on its content
  const calculateScheduleHeight = (schedule: typeof timedSchedules[0]) => {
    let contentLines = 2; // title + time
    if (schedule.description) contentLines++;
    if (schedule.location) contentLines++;

    const calculatedHeight =
      WEEKLY_DAILY_VIEW_CONSTANTS.SCHEDULE_PADDING * 2 +
      contentLines * WEEKLY_DAILY_VIEW_CONSTANTS.SCHEDULE_LINE_HEIGHT;

    return Math.max(WEEKLY_DAILY_VIEW_CONSTANTS.SCHEDULE_MIN_HEIGHT, calculatedHeight);
  };

  const daySchedules = useMemo(() => {
    return schedules.filter(schedule => {
      const scheduleStart = new Date(schedule.startDateTime);
      const scheduleEnd = new Date(schedule.endDateTime);

      // Get day boundaries (00:00:00 to 23:59:59)
      const dayStart = new Date(viewDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(viewDate);
      dayEnd.setHours(23, 59, 59, 999);

      return scheduleStart <= dayEnd && scheduleEnd >= dayStart;
    });
  }, [schedules, viewDate]);

  const allDaySchedules = useMemo(() => {
    return daySchedules.filter(s => s.allDay);
  }, [daySchedules]);

  const timedSchedules = useMemo(() => {
    return daySchedules.filter(s => !s.allDay);
  }, [daySchedules]);

  const isTodayDate = isToday(viewDate);

  // Use schedule layout hook for overlapping schedules
  const schedulesWithLayers = useScheduleLayout(timedSchedules, 'horizontal', false);

  // Use current time indicator hook
  const { currentTime, position: currentTimePosition } = useCurrentTimeIndicator(
    isTodayDate,
    'horizontal'
  );

  // Use auto-scroll hook
  useAutoScroll({
    containerRef: scrollContainerRef,
    isToday: isTodayDate,
    currentTimePosition,
    schedules: timedSchedules,
    orientation: 'horizontal',
    defaultPosition: 0
  });

  return (
    <div className="h-full flex flex-col">
      {/* All-day schedules section */}
      {allDaySchedules.length > 0 && (
        <div
          className="p-4 border-b flex-shrink-0"
          style={{
            borderColor: theme.themeColor.Theme2,
            backgroundColor: theme.themeColor.Light
          }}
        >
          <div
            className="text-sm font-medium mb-2"
            style={{ color: theme.themeColor.Dark }}
          >
            종일
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allDaySchedules.map(schedule => {
              const { backgroundColor, textColor } = getScheduleColors(schedule.color, theme.themeColor.Theme1);
              return (
                <div
                  key={schedule.id}
                  className="p-2 rounded min-w-[200px] flex-shrink-0"
                  style={{
                    backgroundColor,
                    color: textColor
                  }}
                >
                  <div className="font-medium">{schedule.title}</div>
                  {schedule.description && (
                    <div className="text-sm opacity-90 mt-1">{schedule.description}</div>
                  )}
                  {schedule.location && (
                    <div className="text-sm opacity-90 mt-1">📍 {schedule.location}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time grid - Horizontal layout */}
      <div className="flex-1 overflow-x-auto overflow-y-auto" ref={scrollContainerRef}>
        <div className="relative" style={{ width: `${WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_WIDTH * 24}px`, minHeight: '450px' }}>
          {/* Time labels row */}
          <div className="flex sticky top-0 z-10" style={{ backgroundColor: theme.themeColor.Light }}>
            {hours.map(hour => (
              <div
                key={hour}
                className="flex-shrink-0 p-2 text-center text-sm font-medium border-r border-b"
                style={{
                  color: theme.themeColor.Dark,
                  borderColor: theme.themeColor.Theme2,
                  width: `${WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_WIDTH}px`
                }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Hour grid lines */}
          <div className="absolute top-0 left-0 right-0 bottom-0 flex">
            {hours.map(hour => (
              <div
                key={hour}
                className="flex-shrink-0 border-r"
                style={{
                  borderColor: theme.themeColor.Theme2,
                  width: `${WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_WIDTH}px`
                }}
              />
            ))}
          </div>

          {/* Schedule timeline - positioned absolutely */}
          {/* TODO: [Low Priority] Add schedule click interaction (show details modal) */}
          <div className="absolute top-12 left-0 right-0" style={{ minHeight: '400px' }}>
            {schedulesWithLayers.map(({ schedule, layer }) => {
              const position = getSchedulePosition(schedule, 'horizontal', viewDate);
              const { backgroundColor, textColor } = getScheduleColors(schedule.color, theme.themeColor.Theme1);
              const scheduleHeight = calculateScheduleHeight(schedule);
              return (
                <div
                  key={schedule.id}
                  className="absolute p-2 rounded shadow-sm overflow-hidden"
                  style={{
                    backgroundColor,
                    color: textColor,
                    left: `${position.start}px`,
                    width: `${position.size}px`,
                    top: `${layer * WEEKLY_DAILY_VIEW_CONSTANTS.LAYER_HEIGHT}px`,
                    height: `${scheduleHeight}px`,
                    zIndex: 1
                  }}
                >
                  <div className="font-bold text-xs mb-1 truncate">{schedule.title}</div>
                  <div className="text-[10px] opacity-90">
                    {format(schedule.startDateTime, 'HH:mm')} - {format(schedule.endDateTime, 'HH:mm')}
                  </div>
                  {schedule.description && (
                    <div className="text-[10px] opacity-90 mt-1 truncate">{schedule.description}</div>
                  )}
                  {schedule.location && (
                    <div className="text-[10px] opacity-90 mt-1 truncate">📍 {schedule.location}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current time indicator */}
          {isTodayDate && currentTimePosition !== null && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-20"
              style={{
                left: `${currentTimePosition}px`,
                width: '2px'
              }}
            >
              {/* Vertical line */}
              <div
                className="absolute top-0 bottom-0 w-full"
                style={{
                  backgroundColor: theme.themeColor.Theme1,
                  opacity: 0.8
                }}
              />
              {/* Circle at top */}
              <div
                className="absolute top-12 rounded-full"
                style={{
                  left: '-4px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: theme.themeColor.Theme1,
                }}
              />
              {/* Time label - positioned below grid time labels */}
              <div
                className="absolute text-xs font-medium px-2 py-1 rounded shadow-sm"
                style={{
                  top: `${WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_HEIGHT + 10}px`, // Below the grid time labels
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: theme.themeColor.Theme1,
                  color: theme.themeColor.Light,
                  whiteSpace: 'nowrap'
                }}
              >
                {format(currentTime, 'HH:mm')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
