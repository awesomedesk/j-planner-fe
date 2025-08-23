"use client";

import { Schedule, ScheduleItemProps } from '@components/calendar/types';
import { formatTime } from '@components/calendar/utils/timeUtils';

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


  return (
    <div 
      className={`
        text-xs px-1.5 py-0.5 rounded-sm font-medium w-full min-w-0
        ${getScheduleColorClass(schedule.color)}
      `}
      title={`${schedule.title}${!schedule.isAllDay ? ` (${formatTime(schedule.startDate)})` : ''}`}
    >
      <div className="truncate">
        {!schedule.isAllDay && (
          <span className="opacity-90 mr-1">
            {formatTime(schedule.startDate)}
          </span>
        )}
        {schedule.title}
      </div>
    </div>
  );
}
