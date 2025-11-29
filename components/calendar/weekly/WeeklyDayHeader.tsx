"use client";

import Link from 'next/link';
import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { Schedule } from '../types';
import { format, isToday, isSameDay } from 'date-fns';
import { getScheduleColors } from '../utils/colorUtils';
import { WEEKLY_DAILY_VIEW_CONSTANTS } from '../constants/calendar';
import { formatUrlDate } from '@/app/calendar/utils';

interface WeeklyDayHeaderProps {
  day: Date;
  selectedDate: Date | null;
  viewDate: Date;
  allDaySchedules: Schedule[];
  onDateClick: (date: Date) => void;
}

const MAX_VISIBLE_ALL_DAY = 3;

export default function WeeklyDayHeader({
  day,
  selectedDate,
  viewDate,
  allDaySchedules,
  onDateClick
}: WeeklyDayHeaderProps) {
  const theme = useSelector(getThemeState);

  const isSelected = selectedDate && isSameDay(day, selectedDate);
  const isTodayDate = isToday(day);
  const isViewDate = isSameDay(day, viewDate);

  const visibleSchedules = allDaySchedules.slice(0, MAX_VISIBLE_ALL_DAY);
  const hasMoreSchedules = allDaySchedules.length > MAX_VISIBLE_ALL_DAY;

  return (
    <div
      className="sticky top-0 z-[15] p-2 text-center border-b cursor-pointer"
      style={{
        borderColor: theme.themeColor.Theme2,
        backgroundColor: isViewDate ? theme.themeColor.Theme3 : (isSelected ? theme.themeColor.Theme1 : theme.themeColor.Light),
        height: `${WEEKLY_DAILY_VIEW_CONSTANTS.HEADER_HEIGHT}px`
      }}
      onClick={() => onDateClick(day)}
    >
      {/* Day name */}
      <div
        className="text-sm font-medium"
        style={{ color: isTodayDate ? theme.themeColor.Theme1 : theme.themeColor.Dark }}
      >
        {format(day, 'EEE')}
      </div>

      {/* Date number */}
      <div
        className={`text-lg ${isTodayDate ? 'font-bold' : ''}`}
        style={{ color: isTodayDate ? theme.themeColor.Theme1 : theme.themeColor.Dark }}
      >
        {format(day, 'd')}
      </div>

      {/* All-day schedules */}
      {allDaySchedules.length > 0 && (
        <div className="mt-1 space-y-1">
          {visibleSchedules.map(schedule => {
            const { backgroundColor, textColor } = getScheduleColors(schedule.color, theme.themeColor.Theme1);
            return (
              <div
                key={schedule.id}
                className="text-xs px-1 rounded truncate"
                style={{
                  backgroundColor,
                  color: textColor
                }}
              >
                {schedule.title}
              </div>
            );
          })}
          {hasMoreSchedules && (
            <Link
              href={`/calendar/daily/${formatUrlDate(day)}`}
              className="text-[10px] font-medium text-center cursor-pointer hover:underline block px-1"
              style={{ color: theme.themeColor.Theme1 }}
              onClick={(e) => e.stopPropagation()}
            >
              show +{allDaySchedules.length - MAX_VISIBLE_ALL_DAY}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
