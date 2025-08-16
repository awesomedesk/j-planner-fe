"use client";

import Calendar from "@components/calendar/Calendar";

export default function CalendarPage() {
  const handleDateSelect = (date: Date) => {
    console.log('Selected date:', date);
  };

  return (
    <div className="w-full overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
      <Calendar onDateSelect={handleDateSelect} />
    </div>
  );
}
