"use client";

import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { Schedule } from '../types';
import { isToday } from 'date-fns';
import { getSchedulePosition } from '../utils/scheduleUtils';
import { WEEKLY_DAILY_VIEW_CONSTANTS } from '../constants/calendar';
import WeeklyDayHeader from './WeeklyDayHeader';
import WeeklyScheduleItem from './WeeklyScheduleItem';
import WeeklyCurrentTimeIndicator from './WeeklyCurrentTimeIndicator';

interface WeeklyDayColumnProps {
  day: Date;
  selectedDate: Date | null;
  viewDate: Date;
  allDaySchedules: Schedule[];
  schedulesWithLayers: Array<{
    schedule: Schedule;
    layer: number;
    totalColumns: number;
  }>;
  currentTime: Date;
  currentTimePosition: number | null;
  onDateClick: (date: Date) => void;
}

export default function WeeklyDayColumn({
  day,
  selectedDate,
  viewDate,
  allDaySchedules,
  schedulesWithLayers,
  currentTime,
  currentTimePosition,
  onDateClick
}: WeeklyDayColumnProps) {
  const theme = useSelector(getThemeState);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const isTodayDate = isToday(day);

  return (
    <div
      className="flex-1 border-l relative"
      style={{
        borderColor: theme.themeColor.Theme2,
      }}
    >
      {/* Day Header */}
      <WeeklyDayHeader
        day={day}
        selectedDate={selectedDate}
        viewDate={viewDate}
        allDaySchedules={allDaySchedules}
        onDateClick={onDateClick}
      />

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
      {schedulesWithLayers.map(({ schedule, layer, totalColumns }) => {
        const position = getSchedulePosition(schedule, 'vertical');
        return (
          <WeeklyScheduleItem
            key={schedule.id}
            schedule={schedule}
            position={position}
            layer={layer}
            totalColumns={totalColumns}
          />
        );
      })}

      {/* Current time indicator - only on today's column */}
      {isTodayDate && currentTimePosition !== null && (
        <WeeklyCurrentTimeIndicator
          currentTime={currentTime}
          position={currentTimePosition}
        />
      )}
    </div>
  );
}
