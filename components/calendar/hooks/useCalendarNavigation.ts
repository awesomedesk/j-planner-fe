import { useDispatch } from 'react-redux';
import { setViewMode } from '@utils/store/slices/calendarViewSlice';
import { formatUrlDate } from '@/app/calendar/utils';
import { useNavigation } from '@utils/hooks/useNavigation';
import { CalendarViewMode } from '../types';

/**
 * Calendar-specific navigation hook
 * Extends the generic useNavigation hook with calendar-specific logic
 */
export const useCalendarNavigation = () => {
  const dispatch = useDispatch();

  // Use the generic navigation hook with calendar-specific configuration
  const { navigateToDate: baseNavigateToDate } = useNavigation<CalendarViewMode>({
    basePath: '/calendar',
    viewModeMap: {
      day: 'daily',
      week: 'weekly',
      month: 'monthly',
    },
    formatDate: formatUrlDate,
  });

  /**
   * Navigate to a specific date with a specific view mode
   * Updates both Redux state and URL
   */
  const navigateToDate = (date: Date, viewMode: CalendarViewMode) => {
    // Update Redux state (calendar-specific)
    dispatch(setViewMode(viewMode));

    // Navigate using the base navigation logic
    baseNavigateToDate(date, viewMode);
  };

  /**
   * Navigate to daily view for a specific date
   * Convenience method for the most common use case
   */
  const navigateToDailyView = (date: Date) => {
    navigateToDate(date, 'day');
  };

  /**
   * Navigate to weekly view for a specific date
   */
  const navigateToWeeklyView = (date: Date) => {
    navigateToDate(date, 'week');
  };

  /**
   * Navigate to monthly view for a specific date
   */
  const navigateToMonthlyView = (date: Date) => {
    navigateToDate(date, 'month');
  };

  /**
   * Navigate to a date in the current view mode
   * Useful for prev/next/today navigation where view mode stays the same
   */
  const navigateInCurrentView = (date: Date, currentViewMode: CalendarViewMode) => {
    // Only update URL without changing view mode state
    // (view mode is already set in Redux)
    baseNavigateToDate(date, currentViewMode);
  };

  /**
   * Change view mode while staying on the same date
   * Used when switching between month/week/day views
   */
  const changeViewMode = (newViewMode: CalendarViewMode, currentDate: Date) => {
    navigateToDate(currentDate, newViewMode);
  };

  return {
    navigateToDate,
    navigateToDailyView,
    navigateToWeeklyView,
    navigateToMonthlyView,
    navigateInCurrentView,
    changeViewMode,
  };
};
