/**
 * Calendar API Client
 *
 * This file contains API client functions for schedule operations.
 * - scheduleApi: Main API client object with CRUD methods
 * - GetScheduleListParams: Query parameters for list endpoint
 *
 * For type definitions, see ./types.ts
 * For UI component types, see ./index.ts
 */

import apiClient from '@utils/api/client';
import type { ScheduleAPI, CreateScheduleRequest, UpdateScheduleRequest } from './types';

/**
 * Query parameters for schedule list endpoint
 */
export interface GetScheduleListParams {
  startDateTime: string; // ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
  endDateTime: string;   // ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
}

/**
 * Schedule API client
 * Provides methods for CRUD operations on calendar schedules
 */
export const scheduleApi = {
  /**
   * Get list of schedules within a date range
   * @param params - Start and end datetime for filtering
   * @returns Array of schedules matching the criteria
   */
  getList: ({ startDateTime, endDateTime }: GetScheduleListParams) =>
    apiClient.get<ScheduleAPI[]>('/j-planner/v1/calendar/list', {
      startDateTime,
      endDateTime,
    }),

  /**
   * Create a new schedule
   * @param data - Schedule data to create
   * @returns Created schedule with assigned ID
   */
  create: (data: CreateScheduleRequest) =>
    apiClient.post<ScheduleAPI, CreateScheduleRequest>('/j-planner/v1/calendar', data),

  // TODO: [Medium Priority] Implement update schedule API
  /**
   * Update an existing schedule
   * @param id - Schedule ID to update
   * @param data - Partial schedule data to update
   * @returns Updated schedule
   */
  // update: (id: string, data: UpdateScheduleRequest) =>
  //   apiClient.put<ScheduleAPI, UpdateScheduleRequest>(`/j-planner/v1/calendar/${id}`, data),

  // TODO: [Medium Priority] Implement delete schedule API
  /**
   * Delete a schedule
   * @param id - Schedule ID to delete
   * @returns void
   */
  // delete: (id: string) =>
  //   apiClient.delete<void>(`/j-planner/v1/calendar/${id}`),
};
