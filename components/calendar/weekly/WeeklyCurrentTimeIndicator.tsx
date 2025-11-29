"use client";

import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { format } from 'date-fns';

interface WeeklyCurrentTimeIndicatorProps {
  currentTime: Date;
  position: number;
}

export default function WeeklyCurrentTimeIndicator({
  currentTime,
  position
}: WeeklyCurrentTimeIndicatorProps) {
  const theme = useSelector(getThemeState);

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-10"
      style={{
        top: `${position}px`,
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
  );
}
