"use client";

import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { ScheduleItemProps } from '@components/calendar/types';
import { formatTimeKorean } from '@components/calendar/utils/scheduleUtils';
import { getScheduleColors } from '@components/calendar/utils/colorUtils';

export default function ScheduleItem({ schedule }: ScheduleItemProps) {
  const theme = useSelector(getThemeState);

  const getDisplayText = () => {
    if (schedule.allDay) {
      return schedule.title;
    }
    return `${formatTimeKorean(schedule.startDateTime)} ${schedule.title}`;
  };

  const { backgroundColor, textColor } = getScheduleColors(schedule.color, theme.themeColor.Theme1);

  return (
    <div
      className="text-xs px-2 py-1 rounded-sm font-medium overflow-hidden w-full max-w-full"
      style={{
        backgroundColor,
        color: textColor
      }}
      title={getDisplayText()}
    >
      <div className="truncate w-full whitespace-nowrap">
        {getDisplayText()}
      </div>
    </div>
  );
}
