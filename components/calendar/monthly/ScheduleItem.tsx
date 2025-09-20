"use client";

import { Schedule, ScheduleItemProps } from '../types';

export default function ScheduleItem({ schedule }: ScheduleItemProps) {
  const getScheduleColorClass = (color: Schedule['color']) => {
    const colorMap = {
      blue: 'bg-blue-500 text-white',
      purple: 'bg-purple-600 text-white',
      lightpurple: 'bg-purple-300 text-purple-900',
      pink: 'bg-pink-400 text-white'
    };

    return colorMap[color] || 'bg-gray-400 text-white';
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;

    if (minutes === 0) {
      return `${ampm} ${displayHours}시`;
    } else {
      return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
    }
  };

  const getDisplayText = () => {
    if (schedule.isAllDay) {
      return schedule.title;
    }
    return `${formatTime(schedule.startDateTime)} ${schedule.title}`;
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
