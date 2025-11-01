"use client";

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { CalendarGridProps, Schedule } from '../types';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday } from 'date-fns';
import { getSchedulePosition, formatHourLabel } from '../utils/scheduleUtils';
import { WEEKLY_DAILY_VIEW_CONSTANTS } from '../constants/calendar';
import { getScheduleColors } from '../utils/colorUtils';
import { useCurrentTimeIndicator } from '../hooks/useCurrentTimeIndicator';

export default function CalendarWeekly({ viewDate, selectedDate, schedules, onDateClick }: Omit<CalendarGridProps, 'theme'>) {
  const theme = useSelector(getThemeState);

  const weekDays = useMemo(() => {
    const start = startOfWeek(viewDate, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(viewDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Check if today is in the current week
  const isTodayInWeek = useMemo(() => {
    const today = new Date();
    return weekDays.some(day => isSameDay(day, today));
  }, [weekDays]);

  // Use current time indicator hook
  const { currentTime, position: currentTimePosition } = useCurrentTimeIndicator(
    isTodayInWeek,
    'vertical',
    WEEKLY_DAILY_VIEW_CONSTANTS.HEADER_HEIGHT
  );

  // 전체 날짜에 대한 종일 일정을 미리 계산하여 캐싱
  const allDaySchedulesByDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    weekDays.forEach(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const daySchedules = schedules.filter(schedule => {
        const scheduleStart = new Date(schedule.startDateTime);
        const scheduleEnd = new Date(schedule.endDateTime);

        return schedule.allDay &&
               date >= scheduleStart &&
               date <= scheduleEnd;
      });
      map.set(dateKey, daySchedules);
    });
    return map;
  }, [weekDays, schedules]);

  const getAllDaySchedules = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return allDaySchedulesByDate.get(dateKey) || [];
  };

  // Pre-calculate schedule layers for each day to use hooks properly
  const scheduleLayers = useMemo(() => {
    return weekDays.map(day => {
      const daySchedules = schedules.filter(schedule => {
        return isSameDay(new Date(schedule.startDateTime), day) && !schedule.allDay;
      });

      // Calculate layers
      const sorted = [...daySchedules].sort((a, b) =>
        new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      );

      const layers: Array<{ schedule: Schedule; layer: number }> = [];

      sorted.forEach(schedule => {
        const position = getSchedulePosition(schedule, 'vertical');
        let layer = 0;

        while (true) {
          const overlaps = layers.some(item => {
            if (item.layer !== layer) return false;

            const itemPosition = getSchedulePosition(item.schedule, 'vertical');
            const itemEnd = itemPosition.start + itemPosition.size;
            const scheduleEnd = position.start + position.size;

            return !(scheduleEnd <= itemPosition.start || position.start >= itemEnd);
          });

          if (!overlaps) break;
          layer++;
        }

        layers.push({ schedule, layer });
      });

      const maxLayer = Math.max(...layers.map(l => l.layer), -1);
      const totalColumns = maxLayer + 1;

      return layers.map(item => ({
        ...item,
        totalColumns
      }));
    });
  }, [weekDays, schedules]);

  return (
    <div className="h-full flex flex-col">
      {/* Time grid with sticky header */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: `${WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_HEIGHT * 24}px` }}>
          {/* Time labels */}
          <div className="w-16 flex-shrink-0 relative">
            {/* Sticky header for time column */}
            <div
              className="sticky top-0 z-[5] w-16 border-b p-2"
              style={{
                backgroundColor: theme.themeColor.Light,
                borderColor: theme.themeColor.Theme2,
                height: `${WEEKLY_DAILY_VIEW_CONSTANTS.HEADER_HEIGHT}px`
              }}
            />

            {hours.map(hour => (
              <div
                key={hour}
                className="text-xs p-2 text-right absolute w-full"
                style={{
                  color: theme.themeColor.Dark,
                  top: `${hour * WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_HEIGHT + WEEKLY_DAILY_VIEW_CONSTANTS.HEADER_HEIGHT}px`,
                  height: `${WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_HEIGHT}px`
                }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {/* Day columns with absolute positioned schedules */}
          {weekDays.map((day, dayIndex) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const isViewDate = isSameDay(day, viewDate); // URL 날짜와 일치

            // Get pre-calculated schedule layers for this day
            const schedulesWithLayers = scheduleLayers[dayIndex];

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
                    backgroundColor: isViewDate ? theme.themeColor.Theme3 : (isSelected ? theme.themeColor.Theme1 : theme.themeColor.Light),
                    height: `${WEEKLY_DAILY_VIEW_CONSTANTS.HEADER_HEIGHT}px`
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
                  {(() => {
                    const allDaySchedules = getAllDaySchedules(day);
                    return allDaySchedules.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {allDaySchedules.map(schedule => {
                          const { backgroundColor, textColor } = getScheduleColors(schedule.color, theme.themeColor.Theme1);
                          return (
                            <div
                              key={schedule.id}
                              className="text-xs px-1 rounded truncate"
                              style={{
                                backgroundColor,
                                color: textColor
                              }}
                            >
                              {schedule.title}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Hour lines */}
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="absolute w-full border-b cursor-pointer"
                    style={{
                      borderColor: theme.themeColor.Theme2,
                      top: `${hour * WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_HEIGHT + WEEKLY_DAILY_VIEW_CONSTANTS.HEADER_HEIGHT}px`,
                      height: `${WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_HEIGHT}px`
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
                  const { backgroundColor, textColor } = getScheduleColors(schedule.color, theme.themeColor.Theme1);

                  return (
                    <div
                      key={schedule.id}
                      className="absolute text-xs p-1 rounded overflow-hidden"
                      style={{
                        backgroundColor,
                        color: textColor,
                        top: `${position.start + WEEKLY_DAILY_VIEW_CONSTANTS.HEADER_HEIGHT}px`,
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
