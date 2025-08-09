export interface Schedule {
  id: string;
  title: string;
  date: Date;
}

export interface CalendarProps {
  onDateSelect?: (date: Date) => void;
}

export interface CalendarNavigationProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onViewTypeChange: () => void;
}

export interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  schedules: Schedule[];
  onDateClick: (day: number) => void;
}

export interface ScheduleManagerProps {
  selectedDate: Date;
  schedules: Schedule[];
  onAddSchedule: (title: string) => void;
  onDeleteSchedule: (id: string) => void;
}

export interface CalendarDayProps {
  day: number;
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  schedules: Schedule[];
  onClick: () => void;
}