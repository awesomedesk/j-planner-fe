import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CalendarGridProps } from '../types';

// Dynamic import with SSR disabled
const CalendarMonthlyClient = dynamic(() => import('./CalendarMonthlyClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="text-gray-500">Loading calendar...</div>
    </div>
  )
});

export default function CalendarGrid(props: Omit<CalendarGridProps, 'theme'>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    );
  }

  return <CalendarMonthlyClient {...props} />;
}
