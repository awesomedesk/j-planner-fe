"use client";

import Calendar from "@components/calendar/Calendar";

export default function CalendarPage() {
  const handleDateSelect = (date: Date) => {
    console.log('Selected date:', date);
  };

  return (
    <div className="min-h-screen">
        <Calendar onDateSelect={handleDateSelect} />
    </div>
  );
}
