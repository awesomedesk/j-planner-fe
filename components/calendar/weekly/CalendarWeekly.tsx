"use client";

import { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { CalendarGridProps, Schedule } from '../types';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday } from 'date-fns';
import { getScheduleColor, getSchedulePosition, formatHourLabel, CALENDAR_CONSTANTS } from '../utils/scheduleUtils';

export default function CalendarWeekly({ viewDate, selectedDate, schedules, onDateClick }: Omit<CalendarGridProps, 'theme'>) {
  const theme = useSelector(getThemeState);
  const [currentTime, setCurrentTime] = useState(new Date());

  const weekDays = useMemo(() => {
    const start = startOfWeek(viewDate, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(viewDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // TODO: [Medium Priority] Add auto-scroll on mount
  // - If today is in the week: scroll to current time
  // - If schedules exist: scroll to first schedule
  // - Otherwise: scroll to 8 AM (work start time)

  const getSchedulesForDay = (date: Date) => {
    return schedules.filter(schedule => {
      return isSameDay(new Date(schedule.startDateTime), date) && !schedule.isAllDay;
    });
  };

  const getAllDaySchedules = (date: Date) => {
    // TODO: [Low Priority] Optimize: Cache this result with useMemo
    // Currently called twice per day (lines 146 and 148)
    return schedules.filter(schedule => {
      const scheduleStart = new Date(schedule.startDateTime);
      const scheduleEnd = new Date(schedule.endDateTime);

      return schedule.isAllDay &&
             date >= scheduleStart &&
             date <= scheduleEnd;
    });
  };

  // Check if today is in the current week
  const isTodayInWeek = useMemo(() => {
    const today = new Date();
    return weekDays.some(day => isSameDay(day, today));
  }, [weekDays]);

  // Calculate current time position (vertical)
  const currentTimePosition = useMemo(() => {
    if (!isTodayInWeek) return null;

    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();

    return CALENDAR_CONSTANTS.HEADER_HEIGHT +
           hours * CALENDAR_CONSTANTS.HOUR_HEIGHT +
           (minutes / 60) * CALENDAR_CONSTANTS.HOUR_HEIGHT;
  }, [isTodayInWeek, currentTime]);

  // Update current time every minute
  useEffect(() => {
    if (!isTodayInWeek) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isTodayInWeek]);

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

            // Calculate schedule layers to avoid overlaps
            const calculateScheduleLayers = (schedules: Schedule[]) => {
              const sorted = [...schedules].sort((a, b) =>
                new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
              );

              const layers: Array<{ schedule: Schedule; layer: number; totalInLayer: number }> = [];

              sorted.forEach(schedule => {
                const position = getSchedulePosition(schedule, 'vertical');
                let layer = 0;

                // Find the first available layer where this schedule doesn't overlap
                while (true) {
                  const overlaps = layers.some(item => {
                    if (item.layer !== layer) return false;

                    const itemPosition = getSchedulePosition(item.schedule, 'vertical');
                    const itemEnd = itemPosition.start + itemPosition.size;
                    const scheduleEnd = position.start + position.size;

                    // Check if schedules overlap vertically
                    return !(scheduleEnd <= itemPosition.start || position.start >= itemEnd);
                  });

                  if (!overlaps) break;
                  layer++;
                }

                layers.push({ schedule, layer, totalInLayer: 1 });
              });

              // Calculate how many schedules share the same column
              const maxLayer = Math.max(...layers.map(l => l.layer), 0);
              return layers.map(item => ({
                ...item,
                totalColumns: maxLayer + 1
              }));
            };

            const schedulesWithLayers = calculateScheduleLayers(daySchedules);

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

                {/* Schedules positioned absolutely with overlap handling */}
                {/* TODO: [Low Priority] Add schedule click interaction (show details, tooltip on hover) */}
                {schedulesWithLayers.map(({ schedule, layer, totalColumns }) => {
                  const position = getSchedulePosition(schedule, 'vertical');
                  const widthPercentage = 100 / totalColumns;
                  const leftPercentage = (layer / totalColumns) * 100;

                  return (
                    <div
                      key={schedule.id}
                      className="absolute text-xs p-1 rounded overflow-hidden"
                      style={{
                        backgroundColor: getScheduleColor(schedule.color),
                        color: 'white',
                        top: `${position.start + CALENDAR_CONSTANTS.HEADER_HEIGHT}px`,
                        height: `${position.size}px`,
                        left: `${leftPercentage}%`,
                        width: `${widthPercentage}%`,
                        paddingLeft: '4px',
                        paddingRight: '4px',
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

                {/* Current time indicator - only on today's column */}
                {isTodayDate && currentTimePosition !== null && (
                  <div
                    className="absolute left-0 right-0 pointer-events-none z-10"
                    style={{
                      top: `${currentTimePosition}px`,
                      height: '2px'
                    }}
                  >
                    {/* Horizontal line */}
                    <div
                      className="absolute left-0 right-0 h-full"
                      style={{
                        backgroundColor: theme.themeColor.Theme1,
                        opacity: 0.8
                      }}
                    />
                    {/* Circle at left */}
                    <div
                      className="absolute rounded-full"
                      style={{
                        left: '2px',
                        top: '-4px',
                        width: '10px',
                        height: '10px',
                        backgroundColor: theme.themeColor.Theme1,
                      }}
                    />
                    {/* Time label */}
                    <div
                      className="absolute text-[10px] font-medium px-1.5 py-0.5 rounded shadow-sm"
                      style={{
                        left: '16px',
                        top: '-10px',
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
