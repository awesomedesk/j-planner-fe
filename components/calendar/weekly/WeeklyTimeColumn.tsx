"use client";

import { useSelector } from 'react-redux';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { formatHourLabel } from '../utils/scheduleUtils';
import { WEEKLY_DAILY_VIEW_CONSTANTS } from '../constants/calendar';

export default function WeeklyTimeColumn() {
  const theme = useSelector(getThemeState);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="w-16 flex-shrink-0 relative">
      {/* Sticky header for time column */}
      <div
        className="sticky top-0 z-[15] w-16 border-b p-2"
        style={{
          backgroundColor: theme.themeColor.Light,
          borderColor: theme.themeColor.Theme2,
          height: `${WEEKLY_DAILY_VIEW_CONSTANTS.HEADER_HEIGHT}px`
        }}
      />

      {/* Time labels */}
      {hours.map(hour => (
        <div
          key={hour}
          className="text-xs p-2 text-right absolute w-full"
          style={{
            color: theme.themeColor.Dark,
            top: `${hour * WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_HEIGHT + WEEKLY_DAILY_VIEW_CONSTANTS.HEADER_HEIGHT}px`,
            height: `${WEEKLY_DAILY_VIEW_CONSTANTS.HOUR_HEIGHT}px`
          }}
        >
          {formatHourLabel(hour)}
        </div>
      ))}
    </div>
  );
}
