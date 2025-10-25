"use client";

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { urlViewToMode, formatUrlDate } from '@/app/calendar/utils';

/**
 * Calendar page without specific date - redirects to today's date
 * URL pattern: /calendar/[view]
 * Example: /calendar/monthly → redirects to /calendar/monthly/2025-10-25
 *
 * Also handles legacy query parameter format for backward compatibility
 * Example: /calendar/monthly?date=2025-10-25 → redirects to /calendar/monthly/2025-10-25
 */
export default function CalendarViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlView = params.view as string;
  const dateParam = searchParams.get('date');

  useEffect(() => {
    const viewMode = urlViewToMode(urlView);

    // If view mode is invalid, redirect to monthly view
    if (!viewMode) {
      const today = formatUrlDate(new Date());
      router.replace(`/calendar/monthly/${today}`);
      return;
    }

    // If there's a date query parameter (legacy format), redirect to new format
    if (dateParam) {
      router.replace(`/calendar/${urlView}/${dateParam}`);
      return;
    }

    // Otherwise, redirect to today's date
    const today = formatUrlDate(new Date());
    router.replace(`/calendar/${urlView}/${today}`);
  }, [urlView, dateParam, router]);

  return null;
}
