"use client";

import { WeekNumberProps } from '@components/calendar/types';

export default function WeekNumber({ weekNumber, theme, height }: WeekNumberProps) {
  return (
    <div 
      className={`text-center font-medium border-r flex items-center justify-center text-sm ${height}`}
      style={{
        backgroundColor: theme.themeColor.Theme3,
        color: theme.themeColor.Dark,
        borderColor: theme.themeColor.Theme2,
        width: '2.5rem', // Exactly 2.5rem for 2-digit numbers (40px)
        minWidth: '2.5rem',
        maxWidth: '2.5rem'
      }}
    >
      {weekNumber}
    </div>
  );
}
