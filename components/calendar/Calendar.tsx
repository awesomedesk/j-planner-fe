"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { getCalendarViewMode, setViewMode } from '@utils/store/slices/calendarViewSlice';
import CalendarHeader from '@components/layouts/calendar/CalendarHeader';
import CalendarMonthly from './monthly/CalendarMonthlyWrapper';
import CalendarWeekly from './weekly/CalendarWeekly';
import CalendarDaily from './daily/CalendarDaily';
import { CalendarProps, CalendarViewMode, Schedule } from './types';
import { testSchedules } from './data/testSchedules';
import { formatUrlDate } from '@/app/calendar/utils';
import { scheduleApi } from './types/schedule';
import { convertApiScheduleToSchedule, formatToISODateTime } from './utils/apiUtils';
import { getDateRange, getAdjustedMonth } from './utils/dateUtils';

// TODO: [Low Priority] Add keyboard navigation support (arrow keys to navigate dates)
// TODO: [Low Priority] Add accessibility improvements (ARIA labels, focus management, screen reader support)
// TODO: [Low Priority] Consider timezone support for future international use

// Helper function to convert internal view mode to URL format
const viewModeToUrl = (mode: CalendarViewMode): string => {
  const mapping: Record<CalendarViewMode, string> = {
    month: 'monthly',
    week: 'weekly',
    day: 'daily',
  };
  return mapping[mode];
};

export default function Calendar({ onDateSelect, initialDate, schedules: externalSchedules }: CalendarProps) {
  // Use initialDate from URL as the single source of truth for viewDate
  const viewDate = useMemo(() => initialDate || new Date(), [initialDate]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>(externalSchedules || testSchedules);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const currentTheme = useSelector(getThemeState);
  const viewMode = useSelector(getCalendarViewMode);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  // API에서 일정 조회
  useEffect(() => {
    // externalSchedules가 제공되면 API 조회를 하지 않음
    if (externalSchedules) {
      setSchedules(externalSchedules);
      return;
    }

    const fetchSchedules = async () => {
      setIsLoadingSchedules(true);
      setApiError(null);
      try {
        // viewMode와 viewDate를 기반으로 조회 기간 계산
        const { start, end } = getDateRange(viewDate, viewMode);

        // API 호출
        const response = await scheduleApi.getList({
          startDateTime: formatToISODateTime(start),
          endDateTime: formatToISODateTime(end),
        });

        // API 데이터를 Schedule 타입으로 변환
        const convertedSchedules = response.data.map(convertApiScheduleToSchedule);
        setSchedules(convertedSchedules);
      } catch (error) {
        // API 오류 발생시 테스트 스케줄 사용
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch schedules from API';
        console.error(errorMessage, error);
        setApiError('일정을 불러오는데 실패했습니다. 테스트 데이터를 표시합니다.');
        setSchedules(testSchedules);
      } finally {
        setIsLoadingSchedules(false);
      }
    };

    fetchSchedules();
  }, [viewDate, viewMode, externalSchedules]);

  const handlePrev = () => {
    const newDate = (() => {
      if (viewMode === 'month') {
        return getAdjustedMonth(viewDate, -1);
      } else if (viewMode === 'week') {
        const date = new Date(viewDate);
        date.setDate(viewDate.getDate() - 7);
        return date;
      } else { // day
        const date = new Date(viewDate);
        date.setDate(viewDate.getDate() - 1);
        return date;
      }
    })();

    setSelectedDate(null);

    // Update URL - viewDate will be updated from initialDate prop
    const dateStr = formatUrlDate(newDate);
    const urlView = viewModeToUrl(viewMode);
    router.push(`/calendar/${urlView}/${dateStr}`, { scroll: false });
  };

  const handleNext = () => {
    const newDate = (() => {
      if (viewMode === 'month') {
        return getAdjustedMonth(viewDate, 1);
      } else if (viewMode === 'week') {
        const date = new Date(viewDate);
        date.setDate(viewDate.getDate() + 7);
        return date;
      } else { // day
        const date = new Date(viewDate);
        date.setDate(viewDate.getDate() + 1);
        return date;
      }
    })();

    setSelectedDate(null);

    // Update URL - viewDate will be updated from initialDate prop
    const dateStr = formatUrlDate(newDate);
    const urlView = viewModeToUrl(viewMode);
    router.push(`/calendar/${urlView}/${dateStr}`, { scroll: false });
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(null);

    // Update URL - viewDate will be updated from initialDate prop
    const dateStr = formatUrlDate(today);
    const urlView = viewModeToUrl(viewMode);
    router.push(`/calendar/${urlView}/${dateStr}`, { scroll: false });
  };

  const handleViewModeChange = (mode: CalendarViewMode) => {
    dispatch(setViewMode(mode));

    // Update URL if we're in a calendar route
    if (pathname?.includes('/calendar/')) {
      const dateStr = formatUrlDate(viewDate);
      const urlView = viewModeToUrl(mode);
      router.push(`/calendar/${urlView}/${dateStr}`, { scroll: false });
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
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

      {/* Error notification banner */}
      {apiError && (
        <div
          className="mb-2 p-3 rounded-lg flex items-center justify-between"
          style={{
            backgroundColor: '#FEF3C7',
            borderLeft: `4px solid ${currentTheme.themeColor.Theme1}`
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="text-sm" style={{ color: '#92400E' }}>
              {apiError}
            </span>
          </div>
          <button
            onClick={() => setApiError(null)}
            className="text-sm px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
            style={{ color: '#92400E' }}
          >
            닫기
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {isLoadingSchedules && (
        <div className="mb-2 p-3 rounded-lg text-center" style={{ backgroundColor: currentTheme.themeColor.Light }}>
          <span className="text-sm" style={{ color: currentTheme.themeColor.Dark }}>
            일정을 불러오는 중...
          </span>
        </div>
      )}

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

