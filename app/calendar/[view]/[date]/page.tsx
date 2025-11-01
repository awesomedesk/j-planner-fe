"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Calendar from "@components/calendar/Calendar";
import { LAYOUT_CONSTANTS } from '@components/layouts/main/constants/layout';
import { setViewMode } from '@utils/store/slices/calendarViewSlice';
import { urlViewToMode, parseUrlDate, formatUrlDate } from '@/app/calendar/utils';
import { useCalendarNavigation } from '@components/calendar/hooks/useCalendarNavigation';

/**
 * Calendar page with specific date
 * URL pattern: /calendar/[view]/[date]
 * Example: /calendar/monthly/2025-10-25
 */
export default function CalendarDatePage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { navigateInCurrentView } = useCalendarNavigation();

  const urlView = params.view as string;
  const dateStr = params.date as string;

  // Convert URL view to internal view mode
  const viewMode = urlViewToMode(urlView);

  // Parse date from URL
  const initialDate = parseUrlDate(dateStr);

  useEffect(() => {
    // Redirect if view mode is invalid
    if (!viewMode) {
      const today = formatUrlDate(new Date());
      router.replace(`/calendar/monthly/${today}`);
      return;
    }

    // Redirect if date is invalid
    if (!initialDate) {
      const today = formatUrlDate(new Date());
      router.replace(`/calendar/${urlView}/${today}`);
      return;
    }

    // Set view mode in Redux
    dispatch(setViewMode(viewMode));
  }, [viewMode, initialDate, urlView, dispatch, router]);

  const handleDateSelect = (date: Date) => {
    if (viewMode) {
      navigateInCurrentView(date, viewMode);
    }
  };

  // Show nothing while validating/redirecting
  if (!viewMode || !initialDate) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden" style={{ height: `calc(100vh - ${LAYOUT_CONSTANTS.HEADER_HEIGHT_PX}px)` }}>
      <Calendar
        onDateSelect={handleDateSelect}
        initialDate={initialDate}
      />
    </div>
  );
}
