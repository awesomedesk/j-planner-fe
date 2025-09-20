"use client";

import Calendar from "@components/calendar/Calendar";
import { LAYOUT_CONSTANTS } from '@components/layouts/main/constants/layout';

export default function CalendarPage() {
  
  const handleDateSelect = (date: Date) => {
    console.log('Selected date:', date);
  };

  return (
    <div className="w-full overflow-hidden" style={{ height: `calc(100vh - ${LAYOUT_CONSTANTS.HEADER_HEIGHT_PX}px)` }}>
      <Calendar onDateSelect={handleDateSelect} />
    </div>
  );
}
