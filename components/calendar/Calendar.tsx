"use client";

import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { getCalendarViewMode, setViewMode } from '@utils/store/slices/calendarViewSlice';
import CalendarHeader from '@components/layouts/calendar/CalendarHeader';
import CalendarMonthly from './monthly/CalendarMonthly';
import CalendarWeekly from './weekly/CalendarWeekly';
import CalendarDaily from './daily/CalendarDaily';
import { Schedule, CalendarProps, CalendarViewMode } from './types';

export default function Calendar({ onDateSelect, initialDate, schedules: externalSchedules }: CalendarProps) {
  const [viewDate, setViewDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const currentTheme = useSelector(getThemeState);
  const viewMode = useSelector(getCalendarViewMode);
  const dispatch = useDispatch();

  // Default sample schedules if none provided
  const testSchedules: Schedule[] = useMemo(() => [
    {
      id: '1',
      title: '프로젝트 기획 회의',
      isAllDay: false,
      startDateTime: new Date(2025, 9, 1, 10, 0),
      endDateTime: new Date(2025, 9, 1, 12, 0),
      description: '새 프로젝트 기획안 논의',
      location: '회의실 A',
      color: 'blue'
    },
    {
      id: '2',
      title: '점심 약속',
      isAllDay: false,
      startDateTime: new Date(2025, 9, 1, 12, 30),
      endDateTime: new Date(2025, 9, 1, 14, 0),
      description: '김과장님과 점심식사',
      location: '강남역 맛집',
      color: 'purple'
    },
    {
      id: '3',
      title: '개발팀 스프린트 리뷰',
      isAllDay: false,
      startDateTime: new Date(2025, 9, 1, 14, 0),
      endDateTime: new Date(2025, 9, 1, 16, 0),
      description: '이번 스프린트 성과 검토',
      location: '개발팀 회의실',
      color: 'lightpurple'
    },
    {
      id: '4',
      title: '의사 예약',
      isAllDay: false,
      startDateTime: new Date(2025, 9, 1, 15, 30),
      endDateTime: new Date(2025, 9, 1, 16, 30),
      description: '정기 건강검진',
      location: '서울대병원',
      color: 'pink'
    },
    {
      id: '5',
      title: '휴가',
      isAllDay: true,
      startDateTime: new Date(2025, 9, 1, 0, 0),
      endDateTime: new Date(2025, 9, 3, 23, 59),
      description: '가족여행 - 제주도',
      color: 'blue'
    },
    {
      id: '6',
      title: '헬스장 PT',
      isAllDay: false,
      startDateTime: new Date(2025, 9, 1, 19, 0),
      endDateTime: new Date(2025, 9, 1, 20, 0),
      description: '개인 트레이닝 세션',
      location: '피트니스센터',
      color: 'purple'
    }
  ], []);

  const schedules = externalSchedules || testSchedules;

  const handlePrev = () => {
    setViewDate(prev => {
      if (viewMode === 'month') {
        return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      } else if (viewMode === 'week') {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() - 7);
        return newDate;
      } else { // day
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() - 1);
        return newDate;
      }
    });
    setSelectedDate(null);
  };

  const handleNext = () => {
    setViewDate(prev => {
      if (viewMode === 'month') {
        return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      } else if (viewMode === 'week') {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() + 7);
        return newDate;
      } else { // day
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() + 1);
        return newDate;
      }
    });
    setSelectedDate(null);
  };

  const handleToday = () => {
    setViewDate(new Date());
    setSelectedDate(null);
  };

  const handleViewModeChange = (mode: CalendarViewMode) => {
    dispatch(setViewMode(mode));
  };

  const handleDateClick = (date: Date) => {
    const clickedMonth = date.getMonth();
    const currentMonth = viewDate.getMonth();

    // If clicked date is from previous month
    if (clickedMonth < currentMonth ||
        (currentMonth === 0 && clickedMonth === 11)) { // Handle year boundary (Jan -> Dec)
      setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
      setSelectedDate(date);
      onDateSelect?.(date);
    }
    // If clicked date is from next month
    else if (clickedMonth > currentMonth ||
             (currentMonth === 11 && clickedMonth === 0)) { // Handle year boundary (Dec -> Jan)
      setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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
      className="w-full h-full flex flex-col p-4 rounded-lg"
    >
      <CalendarHeader
        viewDate={viewDate}
        viewMode={viewMode}
        onToday={handleToday}
        onPrev={handlePrev}
        onNext={handleNext}
        onViewModeChange={handleViewModeChange}
        theme={currentTheme}
      />

      <div className="flex-1 overflow-hidden min-w-0 h-full">
        {viewMode === 'month' && (
          <CalendarMonthly
            viewDate={viewDate}
            selectedDate={selectedDate}
            schedules={schedules}
            onDateClick={handleDateClick}
          />
        )}
        {viewMode === 'week' && (
          <CalendarWeekly
            viewDate={viewDate}
            selectedDate={selectedDate}
            schedules={schedules}
            onDateClick={handleDateClick}
          />
        )}
        {viewMode === 'day' && (
          <CalendarDaily
            viewDate={viewDate}
            schedules={schedules}
          />
        )}
      </div>
    </div>
  );
}

