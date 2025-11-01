/**
 * Calendar Component Types
 *
 * This file contains all UI component-related types for the calendar system.
 * - Schedule: Internal representation of calendar events
 * - Component Props: Props for calendar UI components
 *
 * For API-related types, see ./types.ts
 * For API client functions, see ./schedule.ts
 */

import { ThemeStateType } from '@components/theme/theme_color';

/**
 * Calendar view mode
 */
export type CalendarViewMode = 'month' | 'week' | 'day';

/**
 * Internal schedule representation used by UI components
 * Note: This differs from ScheduleAPI which is the API response format
 */
export interface Schedule {
  id: string;
  title: string;
  allDay: boolean;
  startDateTime: Date;
  endDateTime: Date;
  description?: string;
  location?: string;
  color: string; // HEX color code (e.g., '#3b82f6')
}

/**
 * Main calendar component props
 */
export interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  initialDate?: Date;
  schedules?: Schedule[];
}

/**
 * Calendar grid view props (Monthly, Weekly, Daily)
 */
export interface CalendarGridProps {
  viewDate: Date;
  selectedDate: Date | null;
  schedules: Schedule[];
  onDateClick: (date: Date) => void;
  theme: ThemeStateType;
}

/**
 * Calendar header component props
 */
export interface CalendarHeaderProps {
  viewDate: Date;
  viewMode: CalendarViewMode;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  theme: ThemeStateType;
}

/**
 * Schedule item component props
 */
export interface ScheduleItemProps {
  schedule: Schedule;
}

/**
 * Week number component props
 */
export interface WeekNumberProps {
  weekNumber: number;
  theme: ThemeStateType;
  height: string;
}

// Re-export API types for convenience
export type {
  ScheduleAPI,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GetScheduleListParams,
  CalendarSettings
} from './types';
