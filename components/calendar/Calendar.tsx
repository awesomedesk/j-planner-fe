"use client";

import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import { Schedule, CalendarProps } from './types';

export default function Calendar({ onDateSelect, initialDate, schedules: externalSchedules }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const currentTheme = useSelector(getThemeState);

  // Default sample schedules if none provided
  const defaultSchedules: Schedule[] = useMemo(() => [
    {
      id: '1',
      title: '보고계획 제작',
      date: new Date(2023, 4, 1),
      color: 'blue'
    },
    {
      id: '2', 
      title: '오전 11시 추열계획 작업',
      date: new Date(2023, 4, 1),
      color: 'purple'
    },
    {
      id: '3',
      title: '오후 6시 지역아학',
      date: new Date(2023, 4, 1),
      color: 'lightpurple'
    },
    {
      id: '4',
      title: '오후 10시 충구 침술 한국어...',
      date: new Date(2023, 4, 1),
      color: 'pink'
    },
    {
      id: '5',
      title: '오후 10:15 어국 침술 한국어...',
      date: new Date(2023, 4, 1),
      color: 'pink'
    }
  ], []);

  const schedules = externalSchedules || defaultSchedules;

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  return (
    <div 
      className="w-full h-full flex flex-col p-4 rounded-lg"
      style={{ backgroundColor: currentTheme.themeColor.Light }}
    >
      <CalendarHeader 
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        theme={currentTheme}
      />
      
      <div className="flex-1 overflow-hidden">
        <CalendarGrid 
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

