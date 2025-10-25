/**
 * Calendar Hooks Index
 *
 * Centralized exports for all calendar-related custom hooks
 */

export { useScheduleSearch, useScheduleMutations } from './useSchedule';
export { useScheduleLayout } from './useScheduleLayout';
export type { ScheduleOrientation, ScheduleWithLayer, ScheduleWithLayerAndColumns } from './useScheduleLayout';
export { useCurrentTimeIndicator } from './useCurrentTimeIndicator';
export type { TimeOrientation, CurrentTimeIndicatorState } from './useCurrentTimeIndicator';
export { useAutoScroll } from './useAutoScroll';
export type { ScrollOrientation, AutoScrollOptions } from './useAutoScroll';
