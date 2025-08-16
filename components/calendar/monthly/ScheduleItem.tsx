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

  return (
    <div 
      className={`
        text-xs px-2 py-1 rounded-sm font-medium truncate
        ${getScheduleColorClass(schedule.color)}
      `}
      title={schedule.title}
    >
      {schedule.title}
    </div>
  );
}
