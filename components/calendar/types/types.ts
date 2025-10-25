/**
 * Calendar API Types
 *
 * This file contains all API-related types for the calendar system.
 * - ScheduleAPI: Backend API response format
 * - Request types: Payload formats for API calls
 * - Settings: User preferences
 *
 * For UI component types, see ./index.ts
 * For API client functions, see ./schedule.ts
 */

// Re-export for convenience
export type { GetScheduleListParams } from './schedule';

/**
 * Schedule format returned from API
 * Note: Field names match backend naming conventions (camelCase with 'Datetime' suffix)
 */
export interface ScheduleAPI {
  id: number;
  title: string;
  description?: string;
  startDatetime: string; // ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
  endDatetime?: string;  // ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
  color: string;         // HEX color code (e.g., '#3b82f6')
  allDay: boolean;
}

/**
 * Request payload for creating a new schedule
 */
export interface CreateScheduleRequest {
  title: string;
  description?: string;
  startDatetime: string; // ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
  endDatetime?: string;  // ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
  color: string;         // HEX color code (e.g., '#3b82f6')
  allDay: boolean;
}

/**
 * Request payload for updating an existing schedule
 * All fields are optional for partial updates
 */
export interface UpdateScheduleRequest {
  title?: string;
  description?: string;
  startDatetime?: string; // ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
  endDatetime?: string;   // ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
  color?: string;         // HEX color code (e.g., '#3b82f6')
  allDay?: boolean;
}

/**
 * User calendar preferences and settings
 * TODO: [Low Priority] Implement settings persistence
 */
export interface CalendarSettings {
  defaultView: 'month' | 'week' | 'day';
  weekStartsOn: 0 | 1; // 0: Sunday, 1: Monday
  timezone: string;
  notifications: boolean;
}

