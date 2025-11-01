/**
 * useCurrentTimeIndicator Hook
 *
 * Manages current time state and calculates position for time indicators
 * in calendar views. Updates every minute when today is visible.
 */

import { useState, useEffect, useMemo } from 'react';
import { CALENDAR_CONSTANTS } from '../utils/scheduleUtils';

export type TimeOrientation = 'vertical' | 'horizontal';

export interface CurrentTimeIndicatorState {
  currentTime: Date;
  position: number | null;
  isToday: boolean;
}

/**
 * Hook to manage current time indicator
 *
 * @param isToday - Whether the current view is showing today
 * @param orientation - 'vertical' for weekly view (time flows down), 'horizontal' for daily view (time flows right)
 * @param headerOffset - Optional offset for header height (used in weekly view)
 * @returns Current time state and position in pixels
 */
export function useCurrentTimeIndicator(
  isToday: boolean,
  orientation: TimeOrientation,
  headerOffset: number = 0
): CurrentTimeIndicatorState {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    if (!isToday) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isToday]);

  // Calculate current time position
  const position = useMemo(() => {
    if (!isToday) return null;

    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    if (orientation === 'vertical') {
      // Weekly view: time flows vertically
      return (
        headerOffset +
        hours * CALENDAR_CONSTANTS.HOUR_HEIGHT +
        (minutes / 60) * CALENDAR_CONSTANTS.HOUR_HEIGHT
      );
    } else {
      // Daily view: time flows horizontally
      return (
        hours * CALENDAR_CONSTANTS.HOUR_WIDTH +
        (minutes / 60) * CALENDAR_CONSTANTS.HOUR_WIDTH
      );
    }
  }, [isToday, currentTime, orientation, headerOffset]);

  return {
    currentTime,
    position,
    isToday
  };
}
