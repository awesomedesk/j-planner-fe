import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { defaultTheme } from '@components/theme/theme_color';
import type { CalendarProps } from '@components/calendar/types';

// Dynamic import with SSR disabled
const CalendarWithAPIClient = dynamic(() => import('./CalendarWithAPIClient'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex items-center justify-center rounded-lg"
      style={{ backgroundColor: defaultTheme.themeColor.Light }}
    >
      <div className="text-lg">Loading calendar...</div>
    </div>
  )
});

export default function CalendarWithAPI(props: Omit<CalendarProps, 'schedules'>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="w-full h-full flex items-center justify-center rounded-lg"
        style={{ backgroundColor: defaultTheme.themeColor.Light }}
      >
        <div className="text-lg">Loading calendar...</div>
      </div>
    );
  }

  return <CalendarWithAPIClient {...props} />;
}
