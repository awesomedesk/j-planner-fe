/**
 * Calendar component constants
 * Centralized magic numbers for consistent sizing and layout across all calendar views
 */

/**
 * Layout constants for Monthly view
 */
export const MONTHLY_VIEW_CONSTANTS = {
  // Main application header height in pixels
  MAIN_HEADER_HEIGHT: 60,

  // Estimated footer height in pixels
  FOOTER_HEIGHT: 60,

  // Day names row (S M T W T F S) height in pixels
  DAY_NAMES_ROW_HEIGHT: 40,

  // Additional padding and margins in pixels
  PADDING: 32,

  // Minimum cell height for monthly view in pixels
  MIN_CELL_HEIGHT: 80,

  // Schedule item and cell spacing
  DATE_HEIGHT: 24,           // Date number display height
  CELL_PADDING: 16,          // Top/bottom padding for cells
  SCHEDULE_ITEM_HEIGHT: 20,  // Individual schedule item height
  SHOW_MORE_HEIGHT: 16,      // "+X more" text height
} as const;

/**
 * Layout constants for Weekly and Daily views
 */
export const WEEKLY_DAILY_VIEW_CONSTANTS = {
  // Height per hour in vertical timeline (pixels)
  HOUR_HEIGHT: 60,

  // Width per hour in horizontal timeline (pixels)
  HOUR_WIDTH: 128,

  // Header height for weekly/daily view (includes day names and date info)
  HEADER_HEIGHT: 120,

  // Height per schedule layer when stacked
  LAYER_HEIGHT: 90,

  // Minimum time unit in minutes for schedule positioning
  MIN_TIME_UNIT: 10,
} as const;

/**
 * Legacy export for backward compatibility
 * @deprecated Use MONTHLY_VIEW_CONSTANTS instead
 */
export const CALENDAR_LAYOUT_CONSTANTS = MONTHLY_VIEW_CONSTANTS;

export type MonthlyViewConstants = typeof MONTHLY_VIEW_CONSTANTS;
export type WeeklyDailyViewConstants = typeof WEEKLY_DAILY_VIEW_CONSTANTS;
