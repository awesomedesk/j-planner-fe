import type { CalendarViewMode } from '@components/calendar/types';

// URL view names (user-facing, plural forms)
export type URLViewName = 'monthly' | 'weekly' | 'daily';

// Mapping between URL view names and internal view modes
export const URL_TO_VIEW_MODE: Record<URLViewName, CalendarViewMode> = {
  monthly: 'month',
  weekly: 'week',
  daily: 'day',
};

export const VIEW_MODE_TO_URL: Record<CalendarViewMode, URLViewName> = {
  month: 'monthly',
  week: 'weekly',
  day: 'daily',
};

export const VALID_URL_VIEWS: URLViewName[] = ['monthly', 'weekly', 'daily'];

/**
 * Convert URL view name to internal view mode
 * @param urlView - URL view name (monthly, weekly, daily)
 * @returns Internal view mode (month, week, day) or null if invalid
 */
export function urlViewToMode(urlView: string): CalendarViewMode | null {
  if (!VALID_URL_VIEWS.includes(urlView as URLViewName)) {
    return null;
  }
  return URL_TO_VIEW_MODE[urlView as URLViewName];
}

/**
 * Convert internal view mode to URL view name
 * @param mode - Internal view mode (month, week, day)
 * @returns URL view name (monthly, weekly, daily)
 */
export function viewModeToUrl(mode: CalendarViewMode): URLViewName {
  return VIEW_MODE_TO_URL[mode];
}

/**
 * Validate and parse date string
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object or null if invalid
 */
export function parseUrlDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;

  try {
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  } catch (e) {
    console.error('Invalid date parameter:', dateStr);
  }

  return null;
}

/**
 * Format date to URL-friendly string (YYYY-MM-DD) using local timezone
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export function formatUrlDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
