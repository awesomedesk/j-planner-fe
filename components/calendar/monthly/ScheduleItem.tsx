"use client";

import { ScheduleItemProps } from '../types';
import { formatTimeKorean } from '../utils/scheduleUtils';
import { getScheduleColors } from '../utils/colorUtils';

export default function ScheduleItem({ schedule }: ScheduleItemProps) {
  const getDisplayText = () => {
    if (schedule.allDay) {
      return schedule.title;
    }
    return `${formatTimeKorean(schedule.startDateTime)} ${schedule.title}`;
  };

  const { backgroundColor, textColor } = getScheduleColors(schedule.color);

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
