"use client";

import { ScheduleItemProps } from '../types';
import { getScheduleColorClass, formatTimeKorean } from '../utils/scheduleUtils';

export default function ScheduleItem({ schedule }: ScheduleItemProps) {

  const getDisplayText = () => {
    if (schedule.isAllDay) {
      return schedule.title;
    }
    return `${formatTimeKorean(schedule.startDateTime)} ${schedule.title}`;
  };

  return (
    <div
      className={`
        text-xs px-2 py-1 rounded-sm font-medium
        ${getScheduleColorClass(schedule.color)}
        overflow-hidden w-full max-w-full
      `}
      title={getDisplayText()}
    >
      <div className="truncate w-full whitespace-nowrap">
        {getDisplayText()}
      </div>
    </div>
  );
}
