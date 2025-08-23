import { ThemeStateType } from '@components/theme/theme_color';

export type ScheduleColor = 'blue' | 'purple' | 'pink' | 'lightpurple';

export interface Schedule {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  color: ScheduleColor;
}

export interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  initialDate?: Date;
  schedules?: Schedule[];
}

export interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  schedules: Schedule[];
  onDateClick: (date: Date) => void;
  theme: ThemeStateType;
}

export interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
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
