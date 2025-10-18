"use client";

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { CalendarGridProps, Schedule } from '../types';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday } from 'date-fns';
import { getScheduleColor, getSchedulePosition, formatHourLabel, CALENDAR_CONSTANTS } from '../utils/scheduleUtils';

export default function CalendarWeekly({ viewDate, selectedDate, schedules, onDateClick }: Omit<CalendarGridProps, 'theme'>) {
  const theme = useSelector(getThemeState);

  const weekDays = useMemo(() => {
    const start = startOfWeek(viewDate, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(viewDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

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

  return (
    <div className="h-full flex flex-col">
      {/* Time grid with sticky header */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: `${CALENDAR_CONSTANTS.HOUR_HEIGHT * 24}px` }}>
          {/* Time labels */}
          <div className="w-16 flex-shrink-0 relative">
            {/* Sticky header for time column */}
            <div
              className="sticky top-0 z-[5] w-16 border-b p-2"
              style={{
                backgroundColor: theme.themeColor.Light,
                borderColor: theme.themeColor.Theme2,
                height: `${CALENDAR_CONSTANTS.HEADER_HEIGHT}px`
              }}
            />

            {hours.map(hour => (
              <div
                key={hour}
                className="text-xs p-2 text-right absolute w-full"
                style={{
                  color: theme.themeColor.Dark,
                  top: `${hour * CALENDAR_CONSTANTS.HOUR_HEIGHT + CALENDAR_CONSTANTS.HEADER_HEIGHT}px`,
                  height: `${CALENDAR_CONSTANTS.HOUR_HEIGHT}px`
                }}
              >
                {formatHourLabel(hour)}
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
                    height: `${CALENDAR_CONSTANTS.HEADER_HEIGHT}px`
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
                      top: `${hour * CALENDAR_CONSTANTS.HOUR_HEIGHT + CALENDAR_CONSTANTS.HEADER_HEIGHT}px`,
                      height: `${CALENDAR_CONSTANTS.HOUR_HEIGHT}px`
                    }}
                    onClick={() => onDateClick(day)}
                  />
                ))}

                {/* Schedules positioned absolutely */}
                {daySchedules.map(schedule => {
                  const position = getSchedulePosition(schedule, 'vertical');
                  return (
                    <div
                      key={schedule.id}
                      className="absolute left-0 right-0 mx-1 text-xs p-1 rounded overflow-hidden"
                      style={{
                        backgroundColor: getScheduleColor(schedule.color),
                        color: 'white',
                        top: `${position.start + CALENDAR_CONSTANTS.HEADER_HEIGHT}px`,
                        height: `${position.size}px`,
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
