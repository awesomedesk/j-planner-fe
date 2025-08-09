"use client";

import { useState, useCallback, useMemo } from 'react';
import { CalendarProps, Schedule } from './types';
import CalendarNavigation from './CalendarNavigation';
import CalendarGrid from './CalendarGrid';
import ScheduleManager from './ScheduleManager';

export default function Calendar({ onDateSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  }, []);

  const handleViewTypeChange = useCallback(() => {
    // Future implementation for different view types (week, month, year)
    console.log('View type change requested');
  }, []);

  const handleDateClick = useCallback((day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    onDateSelect?.(newDate);
  }, [currentDate, onDateSelect]);

  const handleAddSchedule = useCallback((title: string) => {
    if (!selectedDate) return;

    const newSchedule: Schedule = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      date: new Date(selectedDate)
    };

    setSchedules(prev => [...prev, newSchedule]);
  }, [selectedDate]);

  const handleDeleteSchedule = useCallback((id: string) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
  }, []);

  const memoizedSchedules = useMemo(() => schedules, [schedules]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <CalendarNavigation
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onViewTypeChange={handleViewTypeChange}
      />
      
      <CalendarGrid
        currentDate={currentDate}
        selectedDate={selectedDate}
        schedules={memoizedSchedules}
        onDateClick={handleDateClick}
      />
      
      {selectedDate && (
        <ScheduleManager
          selectedDate={selectedDate}
          schedules={memoizedSchedules}
          onAddSchedule={handleAddSchedule}
          onDeleteSchedule={handleDeleteSchedule}
        />
      )}
    </div>
  );
} 