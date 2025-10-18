import { Schedule } from '../types';

// Schedule color constants
export const SCHEDULE_COLORS = {
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  lightpurple: '#a78bfa'
} as const;

// Calendar layout constants
export const CALENDAR_CONSTANTS = {
  HOUR_HEIGHT: 60,  // Height per hour in pixels (for vertical timeline)
  HOUR_WIDTH: 128,  // Width per hour in pixels (for horizontal timeline)
  HEADER_HEIGHT: 80, // Header height in pixels
  LAYER_HEIGHT: 80,  // Height per schedule layer
  MIN_TIME_UNIT: 10, // Minimum time unit in minutes
} as const;

/**
 * Get the hex color code for a schedule color
 */
export function getScheduleColor(color: string): string {
  return SCHEDULE_COLORS[color as keyof typeof SCHEDULE_COLORS] || SCHEDULE_COLORS.blue;
}

/**
 * Get Tailwind CSS classes for a schedule color
 */
export function getScheduleColorClass(color: Schedule['color']): string {
  const colorMap = {
    blue: 'bg-blue-500 text-white',
    purple: 'bg-purple-600 text-white',
    lightpurple: 'bg-purple-300 text-purple-900',
    pink: 'bg-pink-400 text-white'
  };

  return colorMap[color] || 'bg-gray-400 text-white';
}

/**
 * Calculate schedule position for timeline views
 */
interface SchedulePosition {
  start: number;
  size: number;
}

export function getSchedulePosition(
  schedule: Schedule,
  orientation: 'horizontal' | 'vertical'
): SchedulePosition {
  const startTime = new Date(schedule.startDateTime);
  const endTime = new Date(schedule.endDateTime);

  const startHour = startTime.getHours();
  const startMinute = startTime.getMinutes();
  const endHour = endTime.getHours();
  const endMinute = endTime.getMinutes();

  const unitSize = orientation === 'horizontal'
    ? CALENDAR_CONSTANTS.HOUR_WIDTH
    : CALENDAR_CONSTANTS.HOUR_HEIGHT;

  const unitsPerHour = 60 / CALENDAR_CONSTANTS.MIN_TIME_UNIT;

  // Calculate position: round to 10-minute intervals
  const startOffset = startHour * unitSize +
    Math.floor(startMinute / CALENDAR_CONSTANTS.MIN_TIME_UNIT) * (unitSize / unitsPerHour);
  const endOffset = endHour * unitSize +
    Math.ceil(endMinute / CALENDAR_CONSTANTS.MIN_TIME_UNIT) * (unitSize / unitsPerHour);

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
