"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy redirect page for backward compatibility
 * /calender → /calendar/monthly/[today]
 */
export default function CalenderRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to correct spelling with today's date
    const today = new Date().toISOString().split('T')[0];
    router.replace(`/calendar/monthly/${today}`);
  }, [router]);

  return null;
}
