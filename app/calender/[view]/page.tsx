"use client";

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

/**
 * Legacy redirect page for backward compatibility
 * /calender/[view] → /calendar/[view]/[date]
 * Handles both old query parameter format and path-based date
 */
export default function CalenderViewRedirect() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const view = params.view as string;
    const dateParam = searchParams.get('date');

    // Use date from query param if available, otherwise use today
    const dateStr = dateParam || new Date().toISOString().split('T')[0];

    // Redirect to correct spelling with new URL structure
    router.replace(`/calendar/${view}/${dateStr}`);
  }, [params, searchParams, router]);

  return null;
}
