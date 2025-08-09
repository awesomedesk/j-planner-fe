"use client";

import { memo } from 'react';
import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { CalendarDayProps } from './types';
import { CALENDAR_CLASSES } from './constants';
import { getWeekdayClass } from './utils';

const CalendarDay = memo(({ 
  day, 
  date, 
  isSelected, 
  isToday, 
  schedules, 
  onClick 
}: CalendarDayProps) => {
  const theme = useSelector(getThemeState);
  const weekdayClass = getWeekdayClass(date.getDay());
  
  const getDayStyles = () => {
    if (isSelected) {
      return {
        backgroundColor: theme.themeColor.Theme1,
        color: theme.themeColor.Light
      };
    }
    return {};
  };

  const getScheduleStyles = () => ({
    backgroundColor: theme.themeColor.Theme3,
    color: theme.themeColor.Dark
  });

  return (
    <div
      onClick={onClick}
      style={getDayStyles()}
      className={`
        ${CALENDAR_CLASSES.DAY_CELL}
        ${isSelected ? '' : weekdayClass}
        ${isToday ? CALENDAR_CLASSES.TODAY : ''}
      `}
    >
      <span>{day}</span>
      {schedules.length > 0 && (
        <div className="text-xs mt-1 w-full">
          {schedules.slice(0, 2).map(schedule => (
            <div 
              key={schedule.id} 
              style={getScheduleStyles()}
              className="rounded px-1 mb-1 truncate text-xs"
            >
              {schedule.title}
            </div>
          ))}
          {schedules.length > 2 && (
            <div className="text-xs text-gray-500">
              +{schedules.length - 2}개 더
            </div>
          )}
        </div>
      )}
    </div>
  );
});

CalendarDay.displayName = 'CalendarDay';

export default CalendarDay;