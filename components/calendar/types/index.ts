import { ThemeStateType } from '@components/theme/theme_color';

export type ScheduleColor = 'blue' | 'purple' | 'pink' | 'lightpurple';
export type CalendarViewMode = 'month' | 'week' | 'day';

export interface Schedule {
  id: string;
  title: string;
  isAllDay: boolean;
  startDateTime: Date;
  endDateTime: Date;
  description?: string;
  location?: string;
  color: ScheduleColor;
}

export interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  initialDate?: Date;
  schedules?: Schedule[];
}

export interface CalendarGridProps {
  viewDate: Date;
  selectedDate: Date | null;
  schedules: Schedule[];
  onDateClick: (date: Date) => void;
  theme: ThemeStateType;
}

export interface CalendarHeaderProps {
  viewDate: Date;
  viewMode: CalendarViewMode;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  theme: ThemeStateType;
}

export interface ScheduleItemProps {
  schedule: Schedule;
}

export interface WeekNumberProps {
  weekNumber: number;
  theme: ThemeStateType;
  height: string;
}
