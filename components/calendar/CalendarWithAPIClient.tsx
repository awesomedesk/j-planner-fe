"use client";

import { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { getCalendarViewMode, setViewMode } from '@utils/store/slices/calendarViewSlice';
import { useMonthlySchedules, useScheduleMutations } from '@utils/api';
import CalendarHeader from '@components/layouts/calendar/CalendarHeader';
import CalendarMonthly from '@components/calendar/monthly/CalendarMonthly';
import CalendarWeekly from '@components/calendar/weekly/CalendarWeekly';
import CalendarDaily from '@components/calendar/daily/CalendarDaily';
import type { Schedule, CalendarProps, CalendarViewMode } from '@components/calendar/types';
import type { ScheduleAPI } from '@components/calendar/types/types';

// API 데이터를 기존 Schedule 타입으로 변환하는 함수
const convertApiScheduleToSchedule = (apiSchedule: ScheduleAPI): Schedule => ({
  id: apiSchedule.id,
  title: apiSchedule.title,
  startDateTime: new Date(apiSchedule.startDate || Date.now()),
  endDateTime: new Date(apiSchedule.endDate || Date.now()),
  isAllDay: apiSchedule.isAllDay ?? false,
  description: apiSchedule.description,
  color: apiSchedule.color,
});

export default function CalendarWithAPIClient({ onDateSelect, initialDate }: Omit<CalendarProps, 'schedules'>) {
  const [viewDate, setViewDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const currentTheme = useSelector(getThemeState);
  const viewMode = useSelector(getCalendarViewMode);
  const dispatch = useDispatch();

  // API에서 월별 일정 조회
  const { data: apiSchedules, loading, error, refetch } = useMonthlySchedules({
    year: viewDate.getFullYear(),
    month: viewDate.getMonth() + 1, // JavaScript Date는 0부터 시작하므로 +1
  });

  // 일정 생성/수정/삭제 함수들 (향후 확장을 위해 준비)
  const { loading: mutationLoading } = useScheduleMutations();

  // API 데이터를 기존 Schedule 형식으로 변환
  const schedules: Schedule[] = useMemo(() => {
    if (!apiSchedules) return [];
    return apiSchedules.map(convertApiScheduleToSchedule);
  }, [apiSchedules]);

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
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  if (loading) {
    return (
      <div
        className="w-full h-full flex items-center justify-center rounded-lg"
        style={{ backgroundColor: currentTheme.themeColor.Light }}
      >
        <div className="text-lg">일정을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center rounded-lg"
        style={{ backgroundColor: currentTheme.themeColor.Light }}
      >
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col p-4 rounded-lg"
      style={{ backgroundColor: currentTheme.themeColor.Light }}
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

      {/* 일정 생성 로딩 표시 */}
      {mutationLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
          <div className="bg-white px-4 py-2 rounded shadow-lg">
            처리 중...
          </div>
        </div>
      )}
    </div>
  );
}