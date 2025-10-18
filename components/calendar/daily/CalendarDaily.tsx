"use client";

import { useMemo, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { CalendarGridProps, Schedule } from '../types';
import { format, isSameDay, isToday } from 'date-fns';
import { getScheduleColor, getSchedulePosition, formatHourLabel, CALENDAR_CONSTANTS } from '../utils/scheduleUtils';

export default function CalendarDaily({ viewDate, schedules }: Omit<CalendarGridProps, 'theme' | 'selectedDate' | 'onDateClick'>) {
  const theme = useSelector(getThemeState);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const daySchedules = useMemo(() => {
    return schedules.filter(schedule => {
      const scheduleStart = new Date(schedule.startDateTime);
      const scheduleEnd = new Date(schedule.endDateTime);

      return isSameDay(scheduleStart, viewDate) ||
             isSameDay(scheduleEnd, viewDate) ||
             (schedule.isAllDay && viewDate >= scheduleStart && viewDate <= scheduleEnd);
    });
  }, [schedules, viewDate]);

  const allDaySchedules = useMemo(() => {
    return daySchedules.filter(s => s.isAllDay);
  }, [daySchedules]);

  const timedSchedules = useMemo(() => {
    return daySchedules.filter(s => !s.isAllDay);
  }, [daySchedules]);

  // Calculate schedule layers to avoid overlaps
  const schedulesWithLayers = useMemo(() => {
    const sorted = [...timedSchedules].sort((a, b) =>
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

    const layers: Array<{ schedule: Schedule; layer: number }> = [];

    sorted.forEach(schedule => {
      const position = getSchedulePosition(schedule, 'horizontal');
      let layer = 0;

      // Find the first available layer where this schedule doesn't overlap
      while (true) {
        const overlaps = layers.some(item => {
          if (item.layer !== layer) return false;

          const itemPosition = getSchedulePosition(item.schedule, 'horizontal');
          const itemEnd = itemPosition.start + itemPosition.size;
          const scheduleEnd = position.start + position.size;

          // Check if schedules overlap horizontally
          return !(scheduleEnd <= itemPosition.start || position.start >= itemEnd);
        });

        if (!overlaps) break;
        layer++;
      }

      layers.push({ schedule, layer });
    });

    return layers;
  }, [timedSchedules]);

  const isTodayDate = isToday(viewDate);

  // Calculate current time position
  const currentTimePosition = useMemo(() => {
    if (!isTodayDate) return null;

    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();

    return hours * CALENDAR_CONSTANTS.HOUR_WIDTH +
           (minutes / 60) * CALENDAR_CONSTANTS.HOUR_WIDTH;
  }, [isTodayDate, currentTime]);

  // Update current time every minute
  useEffect(() => {
    if (!isTodayDate) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isTodayDate]);

  // Auto-scroll on mount
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!scrollContainerRef.current) return;

      let scrollTarget = 0;

      if (isTodayDate && currentTimePosition !== null) {
        // 오늘: 현재 시간을 중앙에
        scrollTarget = currentTimePosition - (scrollContainerRef.current.clientWidth / 2);
      } else if (timedSchedules.length > 0) {
        // 일정이 있는 경우: 첫 일정을 중앙에
        const firstSchedule = timedSchedules[0];
        const position = getSchedulePosition(firstSchedule, 'horizontal');
        scrollTarget = position.start - (scrollContainerRef.current.clientWidth / 2);
      } else {
        // 일정이 없는 경우: 00시 (시작)
        scrollTarget = 0;
      }

      scrollContainerRef.current.scrollLeft = Math.max(0, scrollTarget);
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

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
            {allDaySchedules.map(schedule => (
              <div
                key={schedule.id}
                className="p-2 rounded min-w-[200px] flex-shrink-0"
                style={{
                  backgroundColor: getScheduleColor(schedule.color),
                  color: 'white'
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
            ))}
          </div>
        </div>
      )}

      {/* Time grid - Horizontal layout */}
      <div className="flex-1 overflow-x-auto overflow-y-auto" ref={scrollContainerRef}>
        <div className="relative" style={{ width: `${CALENDAR_CONSTANTS.HOUR_WIDTH * 24}px`, minHeight: '400px' }}>
          {/* Time labels row */}
          <div className="flex sticky top-0 z-10" style={{ backgroundColor: theme.themeColor.Light }}>
            {hours.map(hour => (
              <div
                key={hour}
                className="flex-shrink-0 p-2 text-center text-sm font-medium border-r border-b"
                style={{
                  color: theme.themeColor.Dark,
                  borderColor: theme.themeColor.Theme2,
                  width: `${CALENDAR_CONSTANTS.HOUR_WIDTH}px`
                }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Hour grid lines */}
          <div className="absolute top-12 left-0 right-0 bottom-0 flex">
            {hours.map(hour => (
              <div
                key={hour}
                className="flex-shrink-0 border-r"
                style={{
                  borderColor: theme.themeColor.Theme2,
                  width: `${CALENDAR_CONSTANTS.HOUR_WIDTH}px`
                }}
              />
            ))}
          </div>

          {/* Schedule timeline - positioned absolutely */}
          <div className="absolute top-12 left-0 right-0" style={{ minHeight: '300px' }}>
            {schedulesWithLayers.map(({ schedule, layer }) => {
              const position = getSchedulePosition(schedule, 'horizontal');
              return (
                <div
                  key={schedule.id}
                  className="absolute p-2 rounded shadow-sm overflow-hidden"
                  style={{
                    backgroundColor: getScheduleColor(schedule.color),
                    color: 'white',
                    left: `${position.start}px`,
                    width: `${position.size}px`,
                    top: `${layer * CALENDAR_CONSTANTS.LAYER_HEIGHT}px`,
                    height: '70px', 
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
                  top: '70px', // Below the grid time labels (which are at ~48px)
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
