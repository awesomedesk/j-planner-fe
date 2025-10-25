/**
 * Color Utility Functions
 *
 * Provides color manipulation utilities for calendar schedules:
 * - Hex color validation
 * - Luminance calculation (relative brightness)
 * - Automatic text color determination based on background brightness
 */

/**
 * Check if a string is a valid hex color
 * Supports both 3-digit (#RGB) and 6-digit (#RRGGBB) formats
 *
 * @param hex - Color string to validate
 * @returns true if valid hex color, false otherwise
 */
export function isValidHex(hex: string): boolean {
  if (!hex) return false;

  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Check if it's 3 or 6 characters and all are valid hex digits
  return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex);
}

/**
 * Normalize hex color to 6-digit format with #
 * Converts #RGB to #RRGGBB
 *
 * @param hex - Hex color string
 * @returns Normalized hex color or null if invalid
 */
export function normalizeHex(hex: string): string | null {
  if (!isValidHex(hex)) return null;

  let cleanHex = hex.replace('#', '');

  // Expand 3-digit to 6-digit
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map(char => char + char)
      .join('');
  }

  return `#${cleanHex.toUpperCase()}`;
}

/**
 * Calculate relative luminance of a color using WCAG formula
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 *
 * @param hex - Hex color string
 * @returns Luminance value between 0 (darkest) and 1 (brightest), or null if invalid
 */
export function calculateLuminance(hex: string): number | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;

  // Extract RGB values
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);

  // Convert to sRGB
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Determine appropriate text color (black or white) based on background color
 * Uses WCAG recommended threshold of 0.5 for luminance
 *
 * @param backgroundColor - Hex color string for background
 * @returns '#000000' for dark text or '#FFFFFF' for light text
 */
export function getContrastTextColor(backgroundColor: string): string {
  const luminance = calculateLuminance(backgroundColor);

  if (luminance === null) {
    // Invalid color, default to white text
    return '#FFFFFF';
  }

  // WCAG threshold: 0.5
  // Luminance > 0.5: background is bright, use dark text
  // Luminance ≤ 0.5: background is dark, use light text
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Get schedule background color and appropriate text color
 *
 * @param colorHex - Hex color string from schedule.color
 * @param fallbackColor - Fallback color if hex is invalid (default: blue)
 * @returns Object with backgroundColor and textColor
 */
export function getScheduleColors(
  colorHex: string | undefined,
  fallbackColor: string = '#3B82F6'
): { backgroundColor: string; textColor: string } {
  const backgroundColor = normalizeHex(colorHex || '') || fallbackColor;
  const textColor = getContrastTextColor(backgroundColor);

  return {
    backgroundColor,
    textColor
  };
}
