/**
 * useAutoScroll Hook
 *
 * Automatically scrolls calendar view to a relevant position on mount:
 * - If today: scroll to current time
 * - If schedules exist: scroll to first schedule
 * - Otherwise: scroll to default position (0 or 8 AM)
 */

import { useEffect, RefObject } from 'react';
import { Schedule } from '../types';
import { getSchedulePosition } from '../utils/scheduleUtils';

export type ScrollOrientation = 'vertical' | 'horizontal';

export interface AutoScrollOptions {
  containerRef: RefObject<HTMLDivElement>;
  isToday: boolean;
  currentTimePosition: number | null;
  schedules: Schedule[];
  orientation: ScrollOrientation;
  defaultPosition?: number;
}

/**
 * Hook to automatically scroll calendar view to a relevant position
 *
 * @param options - Configuration for auto-scroll behavior
 */
export function useAutoScroll({
  containerRef,
  isToday,
  currentTimePosition,
  schedules,
  orientation,
  defaultPosition = 0
}: AutoScrollOptions): void {
  useEffect(() => {
    if (!containerRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      let scrollTarget = 0;

      if (isToday && currentTimePosition !== null) {
        // Today: center on current time
        if (orientation === 'horizontal') {
          // Daily view: horizontal scroll
          scrollTarget = currentTimePosition - (containerRef.current.clientWidth / 2);
        } else {
          // Weekly view: vertical scroll
          scrollTarget = currentTimePosition - (containerRef.current.clientHeight / 2);
        }
      } else if (schedules.length > 0) {
        // Has schedules: center on first schedule
        const firstSchedule = schedules[0];
        const position = getSchedulePosition(firstSchedule, orientation);

        if (orientation === 'horizontal') {
          scrollTarget = position.start - (containerRef.current.clientWidth / 2);
        } else {
          scrollTarget = position.start - (containerRef.current.clientHeight / 2);
        }
      } else {
        // No schedules: use default position
        scrollTarget = defaultPosition;
      }

      // Apply scroll
      if (orientation === 'horizontal') {
        containerRef.current.scrollLeft = Math.max(0, scrollTarget);
      } else {
        containerRef.current.scrollTop = Math.max(0, scrollTarget);
      }
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount
}
