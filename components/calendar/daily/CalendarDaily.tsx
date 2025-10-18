"use client";

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { CalendarGridProps, Schedule } from '../types';
import { format, isSameDay, isToday } from 'date-fns';

export default function CalendarDaily({ viewDate, schedules }: Omit<CalendarGridProps, 'theme' | 'selectedDate' | 'onDateClick'>) {
  const theme = useSelector(getThemeState);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_WIDTH = 128; // Width per hour in pixels

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

  const getScheduleColor = (color: string) => {
    const colors = {
      blue: '#3b82f6',
      purple: '#8b5cf6',
      pink: '#ec4899',
      lightpurple: '#a78bfa'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getSchedulePosition = (schedule: Schedule) => {
    const startTime = new Date(schedule.startDateTime);
    const endTime = new Date(schedule.endDateTime);

    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();

    // Calculate position: each hour = HOUR_WIDTH, round to 10-minute intervals
    const startOffset = startHour * HOUR_WIDTH + Math.floor(startMinute / 10) * (HOUR_WIDTH / 6);
    const endOffset = endHour * HOUR_WIDTH + Math.ceil(endMinute / 10) * (HOUR_WIDTH / 6);

    return {
      left: startOffset,
      width: Math.max(endOffset - startOffset, HOUR_WIDTH / 6) // Minimum 10 minutes width
    };
  };

  // Calculate schedule layers to avoid overlaps
  const schedulesWithLayers = useMemo(() => {
    const sorted = [...timedSchedules].sort((a, b) =>
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

    const layers: Array<{ schedule: Schedule; layer: number }> = [];

    sorted.forEach(schedule => {
      const position = getSchedulePosition(schedule);
      let layer = 0;

      // Find the first available layer where this schedule doesn't overlap
      while (true) {
        const overlaps = layers.some(item => {
          if (item.layer !== layer) return false;

          const itemPosition = getSchedulePosition(item.schedule);
          const itemEnd = itemPosition.left + itemPosition.width;
          const scheduleEnd = position.left + position.width;

          // Check if schedules overlap horizontally
          return !(scheduleEnd <= itemPosition.left || position.left >= itemEnd);
        });

        if (!overlaps) break;
        layer++;
      }

      layers.push({ schedule, layer });
    });

    return layers;
  }, [timedSchedules]);

  const isTodayDate = isToday(viewDate);

  return (
    <div className="h-full flex flex-col">
      {/* Day header */}
      <div
        className="p-4 border-b flex-shrink-0"
        style={{
          borderColor: theme.themeColor.Theme2,
          backgroundColor: isTodayDate ? theme.themeColor.Theme1 : theme.themeColor.Light
        }}
      >
        <div
          className="text-2xl font-bold"
          style={{ color: isTodayDate ? 'white' : theme.themeColor.Dark }}
        >
          {format(viewDate, 'EEEE, MMMM d, yyyy')}
        </div>

        {/* All-day schedules */}
        {allDaySchedules.length > 0 && (
          <div className="mt-3">
            <div
              className="text-sm font-medium mb-2"
              style={{ color: isTodayDate ? 'white' : theme.themeColor.Dark }}
            >
              All Day
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
      </div>

      {/* Time grid - Horizontal layout */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="relative" style={{ width: `${HOUR_WIDTH * 24}px`, minHeight: '400px' }}>
          {/* Time labels row */}
          <div className="flex sticky top-0 z-10" style={{ backgroundColor: theme.themeColor.Light }}>
            {hours.map(hour => (
              <div
                key={hour}
                className="flex-shrink-0 p-2 text-center text-sm font-medium border-r border-b"
                style={{
                  color: theme.themeColor.Dark,
                  borderColor: theme.themeColor.Theme2,
                  width: `${HOUR_WIDTH}px`
                }}
              >
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
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
                  width: `${HOUR_WIDTH}px`
                }}
              />
            ))}
          </div>

          {/* Schedule timeline - positioned absolutely */}
          <div className="absolute top-12 left-0 right-0" style={{ minHeight: '300px' }}>
            {schedulesWithLayers.map(({ schedule, layer }) => {
              const position = getSchedulePosition(schedule);
              return (
                <div
                  key={schedule.id}
                  className="absolute p-2 rounded shadow-sm overflow-hidden"
                  style={{
                    backgroundColor: getScheduleColor(schedule.color),
                    color: 'white',
                    left: `${position.left}px`,
                    width: `${position.width}px`,
                    top: `${layer * 80}px`,
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
        </div>
      </div>
    </div>
  );
}
