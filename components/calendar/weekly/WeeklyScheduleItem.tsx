"use client";

import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { Schedule } from '../types';
import { format } from 'date-fns';
import { getScheduleColors } from '../utils/colorUtils';
import { WEEKLY_DAILY_VIEW_CONSTANTS } from '../constants/calendar';

interface WeeklyScheduleItemProps {
  schedule: Schedule;
  position: { start: number; size: number };
  layer: number;
  totalColumns: number;
}

export default function WeeklyScheduleItem({
  schedule,
  position,
  layer,
  totalColumns
}: WeeklyScheduleItemProps) {
  const theme = useSelector(getThemeState);

  const widthPercentage = 100 / totalColumns;
  const leftPercentage = (layer / totalColumns) * 100;
  const { backgroundColor, textColor } = getScheduleColors(schedule.color, theme.themeColor.Theme1);

  return (
    <div
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
}
