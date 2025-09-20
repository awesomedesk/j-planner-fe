// Layout constants for consistent sizing across the application

export const LAYOUT_CONSTANTS = {
  // Main header height in pixels - change this to update everywhere
  HEADER_HEIGHT_PX: 56,
} as const;

export type LayoutConstants = typeof LAYOUT_CONSTANTS;
