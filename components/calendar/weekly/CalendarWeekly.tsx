"use client";

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { CalendarGridProps, Schedule } from '../types';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday } from 'date-fns';

export default function CalendarWeekly({ viewDate, selectedDate, schedules, onDateClick }: Omit<CalendarGridProps, 'theme'>) {
  const theme = useSelector(getThemeState);

  const weekDays = useMemo(() => {
    const start = startOfWeek(viewDate, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(viewDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_HEIGHT = 60; // Height per hour in pixels

  const getSchedulesForDay = (date: Date) => {
    return schedules.filter(schedule => {
      return isSameDay(new Date(schedule.startDateTime), date) && !schedule.isAllDay;
    });
  };

  const getAllDaySchedules = (date: Date) => {
    return schedules.filter(schedule => {
      const scheduleStart = new Date(schedule.startDateTime);
      const scheduleEnd = new Date(schedule.endDateTime);

      return schedule.isAllDay &&
             date >= scheduleStart &&
             date <= scheduleEnd;
    });
  };

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

    // Calculate position: each hour = HOUR_HEIGHT, round to 10-minute intervals
    const startOffset = startHour * HOUR_HEIGHT + Math.floor(startMinute / 10) * (HOUR_HEIGHT / 6);
    const endOffset = endHour * HOUR_HEIGHT + Math.ceil(endMinute / 10) * (HOUR_HEIGHT / 6);

    return {
      top: startOffset,
      height: Math.max(endOffset - startOffset, HOUR_HEIGHT / 6) // Minimum 10 minutes height
    };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Time grid with sticky header */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: `${HOUR_HEIGHT * 24}px` }}>
          {/* Time labels */}
          <div className="w-16 flex-shrink-0 relative">
            {/* Sticky header for time column */}
            <div
              className="sticky top-0 z-[5] w-16 border-b p-2"
              style={{
                backgroundColor: theme.themeColor.Light,
                borderColor: theme.themeColor.Theme2,
                height: '80px'
              }}
            />

            {hours.map(hour => (
              <div
                key={hour}
                className="text-xs p-2 text-right absolute w-full"
                style={{
                  color: theme.themeColor.Dark,
                  top: `${hour * HOUR_HEIGHT + 80}px`,
                  height: `${HOUR_HEIGHT}px`
                }}
              >
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Day columns with absolute positioned schedules */}
          {weekDays.map((day, dayIndex) => {
            const daySchedules = getSchedulesForDay(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={dayIndex}
                className="flex-1 border-l relative"
                style={{
                  borderColor: theme.themeColor.Theme2,
                }}
              >
                {/* Sticky header for each day */}
                <div
                  className="sticky top-0 z-[5] p-2 text-center border-b cursor-pointer"
                  style={{
                    borderColor: theme.themeColor.Theme2,
                    backgroundColor: isSelected ? theme.themeColor.Theme1 : theme.themeColor.Light,
                    height: '80px'
                  }}
                  onClick={() => onDateClick(day)}
                >
                  <div
                    className="text-sm font-medium"
                    style={{ color: isTodayDate ? theme.themeColor.Theme1 : theme.themeColor.Dark }}
                  >
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={`text-lg ${isTodayDate ? 'font-bold' : ''}`}
                    style={{ color: isTodayDate ? theme.themeColor.Theme1 : theme.themeColor.Dark }}
                  >
                    {format(day, 'd')}
                  </div>

                  {/* All-day schedules */}
                  {getAllDaySchedules(day).length > 0 && (
                    <div className="mt-1 space-y-1">
                      {getAllDaySchedules(day).map(schedule => (
                        <div
                          key={schedule.id}
                          className="text-xs px-1 rounded truncate"
                          style={{
                            backgroundColor: getScheduleColor(schedule.color),
                            color: 'white'
                          }}
                        >
                          {schedule.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hour lines */}
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="absolute w-full border-b cursor-pointer"
                    style={{
                      borderColor: theme.themeColor.Theme2,
                      top: `${hour * HOUR_HEIGHT + 80}px`,
                      height: `${HOUR_HEIGHT}px`
                    }}
                    onClick={() => onDateClick(day)}
                  />
                ))}

                {/* Schedules positioned absolutely */}
                {daySchedules.map(schedule => {
                  const position = getSchedulePosition(schedule);
                  return (
                    <div
                      key={schedule.id}
                      className="absolute left-0 right-0 mx-1 text-xs p-1 rounded overflow-hidden"
                      style={{
                        backgroundColor: getScheduleColor(schedule.color),
                        color: 'white',
                        top: `${position.top + 80}px`,
                        height: `${position.height}px`,
                        zIndex: 1
                      }}
                    >
                      <div className="font-medium truncate text-[10px]">{schedule.title}</div>
                      <div className="text-[9px]">
                        {format(schedule.startDateTime, 'HH:mm')} - {format(schedule.endDateTime, 'HH:mm')}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
