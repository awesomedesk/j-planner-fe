/**
 * useScheduleLayout Hook
 *
 * Calculates schedule layers to prevent visual overlaps in calendar views.
 * Used by both weekly and daily views to position overlapping schedules
 * in separate layers/columns.
 */

import { useMemo } from 'react';
import { Schedule } from '../types';
import { getSchedulePosition } from '../utils/scheduleUtils';

export type ScheduleOrientation = 'vertical' | 'horizontal';

export interface ScheduleWithLayer {
  schedule: Schedule;
  layer: number;
}

export interface ScheduleWithLayerAndColumns extends ScheduleWithLayer {
  totalColumns: number;
}

/**
 * Calculate schedule layers for a given orientation to avoid overlaps
 *
 * @param schedules - Array of schedules to layout
 * @param orientation - 'vertical' for weekly view (time flows down), 'horizontal' for daily view (time flows right)
 * @param includeColumns - Whether to calculate total columns (needed for weekly view width calculation)
 * @returns Array of schedules with layer information
 */
export function useScheduleLayout(
  schedules: Schedule[],
  orientation: ScheduleOrientation,
  includeColumns: boolean = false
): ScheduleWithLayer[] | ScheduleWithLayerAndColumns[] {
  return useMemo(() => {
    // Sort schedules by start time
    const sorted = [...schedules].sort((a, b) =>
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

    const layers: ScheduleWithLayer[] = [];

    sorted.forEach(schedule => {
      const position = getSchedulePosition(schedule, orientation);
      let layer = 0;

      // Find the first available layer where this schedule doesn't overlap
      while (true) {
        const overlaps = layers.some(item => {
          if (item.layer !== layer) return false;

          const itemPosition = getSchedulePosition(item.schedule, orientation);
          const itemEnd = itemPosition.start + itemPosition.size;
          const scheduleEnd = position.start + position.size;

          // Check if schedules overlap in the given orientation
          return !(scheduleEnd <= itemPosition.start || position.start >= itemEnd);
        });

        if (!overlaps) break;
        layer++;
      }

      layers.push({ schedule, layer });
    });

    // If columns calculation is needed (for weekly view)
    if (includeColumns) {
      const maxLayer = Math.max(...layers.map(l => l.layer), 0);
      const totalColumns = maxLayer + 1;

      return layers.map(item => ({
        ...item,
        totalColumns
      })) as ScheduleWithLayerAndColumns[];
    }

    return layers;
  }, [schedules, orientation, includeColumns]);
}
