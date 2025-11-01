import { Schedule } from '../types';
import { WEEKLY_DAILY_VIEW_CONSTANTS } from '../constants/calendar';

/**
 * Calculate schedule position for timeline views
 */
interface SchedulePosition {
  start: number;
  size: number;
}

export function getSchedulePosition(
  schedule: Schedule,
  orientation: 'horizontal' | 'vertical',
  viewDate?: Date
): SchedulePosition {
  const startTime = new Date(schedule.startDateTime);
  const endTime = new Date(schedule.endDateTime);

  let effectiveStartTime = startTime;
  let effectiveEndTime = endTime;

  // If viewDate is provided, clip the schedule to that day's boundaries
  if (viewDate) {
    const dayStart = new Date(viewDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(viewDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Clip start time to day start if schedule starts before this day
    if (startTime < dayStart) {
      effectiveStartTime = dayStart;
    }

    // Clip end time to day end if schedule ends after this day
    if (endTime > dayEnd) {
      effectiveEndTime = dayEnd;
    }
  }

  const startHour = effectiveStartTime.getHours();
  const startMinute = effectiveStartTime.getMinutes();
  const endHour = effectiveEndTime.getHours();
  const endMinute = effectiveEndTime.getMinutes();

  const unitSize = orientation === 'horizontal'
    ? WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_WIDTH
    : WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_HEIGHT;

  const unitsPerHour = 60 / WEEKLY_DAILY_VIEW_CONSTANTS.MIN_TIME_UNIT;

  // Calculate position: round to 10-minute intervals
  const startOffset = startHour * unitSize +
    Math.floor(startMinute / WEEKLY_DAILY_VIEW_CONSTANTS.MIN_TIME_UNIT) * (unitSize / unitsPerHour);
  const endOffset = endHour * unitSize +
    Math.ceil(endMinute / WEEKLY_DAILY_VIEW_CONSTANTS.MIN_TIME_UNIT) * (unitSize / unitsPerHour);

  return {
    start: startOffset,
    size: Math.max(endOffset - startOffset, unitSize / unitsPerHour) // Minimum 10 minutes
  };
}

/**
 * Format time in Korean 12-hour format
 */
export function formatTimeKorean(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? '오후' : '오전';
  const displayHours = hours % 12 || 12;

  if (minutes === 0) {
    return `${ampm} ${displayHours}시`;
  } else {
    return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
  }
}

/**
 * Format hour label for timeline
 */
export function formatHourLabel(hour: number): string {
  return hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
}

/**
 * Get Korean month names
 */
export const KOREAN_MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월'
] as const;

/**
 * Get English month names (fallback)
 */
export const ENGLISH_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

/**
 * Calculate week number of the month for a given date
 * Returns which week of the month (1-based)
 */
export function getWeekOfMonth(date: Date): number {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const dayOfMonth = date.getDate();

  // Calculate week number (1-based)
  return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
}

export function getKoreanDayOfWeek(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
}
