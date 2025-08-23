"use client";

import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import CalendarHeader from '@components/calendar/CalendarHeader';
import CalendarMonthly from '@components/calendar/monthly/CalendarMonthly';
import { Schedule, CalendarProps } from '@components/calendar/types';

export default function Calendar({ onDateSelect, initialDate, schedules: externalSchedules }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const currentTheme = useSelector(getThemeState);

  // Default sample schedules if none provided
  const defaultSchedules: Schedule[] = useMemo(() => [
    {
      id: '1',
      title: '보고계획 제작',
      startDate: new Date(2025, 7, 1),
      endDate: new Date(2025, 7, 1),
      isAllDay: true,
      color: 'blue'
    },
    {
      id: '2', 
      title: '추열계획 작업',
      startDate: new Date(2025, 7, 1, 11, 0),
      endDate: new Date(2025, 7, 1, 13, 0),
      isAllDay: false,
      color: 'purple'
    },
    {
      id: '3',
      title: '지역아학',
      startDate: new Date(2025, 7, 1, 18, 0),
      endDate: new Date(2025, 7, 1, 19, 30),
      isAllDay: false,
      color: 'lightpurple'
    },
    {
      id: '4',
      title: '충구 침술 한국어...',
      startDate: new Date(2025, 7, 1, 22, 0),
      endDate: new Date(2025, 7, 1, 23, 0),
      isAllDay: false,
      color: 'pink'
    },
    {
      id: '5',
      title: '어국 침술 한국어...',
      startDate: new Date(2025, 7, 1, 22, 15),
      endDate: new Date(2025, 7, 1, 23, 30),
      isAllDay: false,
      color: 'pink'
    }
  ], []);

  const schedules = externalSchedules || defaultSchedules;

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    const clickedMonth = date.getMonth();
    const currentMonth = currentDate.getMonth();
    
    // If clicked date is from previous month
    if (clickedMonth < currentMonth || 
        (currentMonth === 0 && clickedMonth === 11)) { // Handle year boundary (Jan -> Dec)
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
      setSelectedDate(date);
      onDateSelect?.(date);
    }
    // If clicked date is from next month  
    else if (clickedMonth > currentMonth || 
             (currentMonth === 11 && clickedMonth === 0)) { // Handle year boundary (Dec -> Jan)
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
      setSelectedDate(date);
      onDateSelect?.(date);
    }
    // If clicked date is from current month
    else {
      setSelectedDate(date);
      onDateSelect?.(date);
    }
  };

  return (
    <div 
      className="w-full h-full flex flex-col p-2 rounded-lg min-w-0"
      style={{ backgroundColor: currentTheme.themeColor.Light }}
    >
      <CalendarHeader 
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        theme={currentTheme}
      />
      
      <div className="flex-1 overflow-hidden min-w-0 h-full">
        <CalendarMonthly 
          currentDate={currentDate}
          selectedDate={selectedDate}
          schedules={schedules}
          onDateClick={handleDateClick}
          theme={currentTheme}
        />
      </div>
    </div>
  );
}

