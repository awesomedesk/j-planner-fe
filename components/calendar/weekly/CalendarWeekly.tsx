"use client";

import { useMemo } from 'react';
import { CalendarGridProps, Schedule } from '../types';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { getSchedulePosition } from '../utils/scheduleUtils';
import { WEEKLY_DAILY_VIEW_CONSTANTS } from '../constants/calendar';
import { useCurrentTimeIndicator } from '../hooks/useCurrentTimeIndicator';
import WeeklyTimeColumn from './WeeklyTimeColumn';
import WeeklyDayColumn from './WeeklyDayColumn';

export default function CalendarWeekly({ viewDate, selectedDate, schedules, onDateClick }: Omit<CalendarGridProps, 'theme'>) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(viewDate, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(viewDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

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

  // Pre-calculate all-day schedules for each day
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

  // Pre-calculate schedule layers for each day
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
        <div className="flex" style={{ height: `${WEEKLY_DAILY_VIEW_CONSTANTS.HEADER_HEIGHT + (WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_HEIGHT * 24)}px` }}>
          {/* Time labels column */}
          <WeeklyTimeColumn />

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => (
            <WeeklyDayColumn
              key={dayIndex}
              day={day}
              selectedDate={selectedDate}
              viewDate={viewDate}
              allDaySchedules={getAllDaySchedules(day)}
              schedulesWithLayers={scheduleLayers[dayIndex]}
              currentTime={currentTime}
              currentTimePosition={currentTimePosition}
              onDateClick={onDateClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
