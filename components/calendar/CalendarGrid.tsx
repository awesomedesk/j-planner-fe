"use client";

import { memo, useMemo } from 'react';
import { CalendarGridProps, Schedule } from './types';
import { WEEKDAYS_KR, CALENDAR_CLASSES } from './constants';
import { getWeekNumber, isSameDate, isToday, getWeekdayClass } from './utils';
import CalendarDay from './CalendarDay';

const CalendarGrid = memo(({ 
  currentDate, 
  selectedDate, 
  schedules, 
  onDateClick 
}: CalendarGridProps) => {
  const { daysInMonth, firstDayOfMonth, calendarDays } = useMemo(() => {
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();

    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    ).getDay();

    const days = [];
    let currentWeek = getWeekNumber(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    
    // Week label header
    days.push(
      <div key="week-label" className={CALENDAR_CLASSES.WEEK_HEADER}>
        주차
      </div>
    );

    // Weekday headers
    WEEKDAYS_KR.forEach((day, i) => {
      days.push(
        <div
          key={`day-${i}`}
          className={`${CALENDAR_CLASSES.WEEKDAY_HEADER} ${getWeekdayClass(i)}`}
        >
          {day}
        </div>
      );
    });

    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const daySchedules = schedules.filter(schedule => 
        isSameDate(schedule.date, date)
      );

      // Add week number for first day or Sundays
      if (day === 1 || date.getDay() === 0) {
        currentWeek = getWeekNumber(date);
        days.push(
          <div key={`week-${day}`} className={CALENDAR_CLASSES.WEEK_HEADER}>
            {currentWeek}
          </div>
        );
      }

      days.push(
        <CalendarDay
          key={day}
          day={day}
          date={date}
          isSelected={isSameDate(selectedDate, date)}
          isToday={isToday(date)}
          schedules={daySchedules}
          onClick={() => onDateClick(day)}
        />
      );
    }

    return { daysInMonth, firstDayOfMonth, calendarDays: days };
  }, [currentDate, selectedDate, schedules, onDateClick]);

  return (
    <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1 mb-2">
      {calendarDays}
    </div>
  );
});

CalendarGrid.displayName = 'CalendarGrid';

export default CalendarGrid;