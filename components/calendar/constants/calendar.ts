/**
 * Calendar component constants
 * Centralized magic numbers for consistent sizing and layout
 */

export const CALENDAR_LAYOUT_CONSTANTS = {
  // Calendar header (day names row) height in pixels
  CALENDAR_HEADER_HEIGHT: 40,

  // Main application header height in pixels
  MAIN_HEADER_HEIGHT: 60,

  // Estimated footer height in pixels
  FOOTER_HEIGHT: 60,

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

export type CalendarLayoutConstants = typeof CALENDAR_LAYOUT_CONSTANTS;
