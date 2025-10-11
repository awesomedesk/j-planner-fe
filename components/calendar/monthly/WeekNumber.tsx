"use client";

import { useSelector } from 'react-redux';
import { getThemeColor } from '@utils/store/slices/mainThemeSlice';

interface WeekNumberProps {
  weekNumber: number;
  height: string;
}

export default function WeekNumber({ weekNumber, height }: WeekNumberProps) {
  const themeColors = useSelector(getThemeColor);

  const colors = {
    accent: themeColors.Theme3,
    text: themeColors.Dark,
    secondary: themeColors.Theme2
  };
  
  return (
    <div 
      className={`text-center font-medium border-r flex items-center justify-center text-sm ${height}`}
      style={{
        backgroundColor: colors.accent,
        color: colors.text,
        borderColor: colors.secondary,
        width: '2.5rem', // Exactly 2.5rem for 2-digit numbers (40px)
        minWidth: '2.5rem',
        maxWidth: '2.5rem'
      }}
    >
      {weekNumber}
    </div>
  );
}
