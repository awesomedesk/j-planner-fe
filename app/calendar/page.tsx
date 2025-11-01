"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatUrlDate } from './utils';

/**
 * Root calendar page - redirects to today's monthly view
 * URL: /calendar → /calendar/monthly/2025-10-25
 */
export default function CalendarPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to today's monthly view
    const today = formatUrlDate(new Date());
    router.replace(`/calendar/monthly/${today}`);
  }, [router]);

  return null;
}
