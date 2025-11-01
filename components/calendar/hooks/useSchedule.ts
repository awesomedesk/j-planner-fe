"use client";

/**
 * Schedule Hooks
 *
 * Custom React hooks for schedule operations:
 * - useScheduleSearch: Query schedules within a date range
 * - useScheduleMutations: Create, update, and delete schedules
 *
 * These hooks handle loading states, error handling, and API communication.
 */

import { useState, useEffect, useCallback } from 'react';
import { scheduleApi } from '@components/calendar/types/schedule';
import type {
  ScheduleAPI,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GetScheduleListParams
} from '@components/calendar/types/types';
import { isApiError } from '@utils/api/client';

interface UseScheduleState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for searching schedules within a date range
 * Automatically fetches data when params change
 *
 * @param params - Date range parameters for filtering schedules
 * @returns Query state with data, loading, error, and refetch function
 */
export function useScheduleSearch(params: GetScheduleListParams) {
  const [data, setData] = useState<ScheduleAPI[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await scheduleApi.getList(params);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      const errorMessage = isApiError(error)
        ? error.message
        : error instanceof Error
        ? error.message
        : '일정 조회에 실패했습니다.';
      setError(errorMessage);
      setData(null);
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    data,
    loading,
    error,
    refetch: fetchSchedules,
    clearError: () => setError(null),
  };
}

/**
 * Hook for schedule CRUD operations (mutations)
 * Provides functions for creating, updating, and deleting schedules
 */
export function useScheduleMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new schedule
   * @param data - Schedule data to create
   * @returns Created schedule or null on error
   */
  const createSchedule = useCallback(async (data: CreateScheduleRequest): Promise<ScheduleAPI | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await scheduleApi.create(data);
      setLoading(false);
      return response.data;
    } catch (error) {
      const errorMessage = isApiError(error)
        ? error.message
        : error instanceof Error
        ? error.message
        : '일정 생성에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, []);

  /**
   * Update an existing schedule
   * TODO: [Medium Priority] Implement when backend API is ready
   * @param id - Schedule ID to update
   * @param data - Partial schedule data to update
   * @returns Updated schedule or null on error
   */
  const updateSchedule = useCallback(async (id: string, data: UpdateScheduleRequest): Promise<ScheduleAPI | null> => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Uncomment when API is implemented
      // const response = await scheduleApi.update(id, data);
      // setLoading(false);
      // return response.data;

      // Temporary: Return error until API is implemented
      throw new Error('Update API not yet implemented');
    } catch (error) {
      const errorMessage = isApiError(error)
        ? error.message
        : error instanceof Error
        ? error.message
        : '일정 수정에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, []);

  /**
   * Delete a schedule
   * TODO: [Medium Priority] Implement when backend API is ready
   * @param id - Schedule ID to delete
   * @returns true on success, false on error
   */
  const deleteSchedule = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Uncomment when API is implemented
      // await scheduleApi.delete(id);
      // setLoading(false);
      // return true;

      // Temporary: Return error until API is implemented
      throw new Error('Delete API not yet implemented');
    } catch (error) {
      const errorMessage = isApiError(error)
        ? error.message
        : error instanceof Error
        ? error.message
        : '일정 삭제에 실패했습니다.';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  }, []);

  return {
    createSchedule,
    updateSchedule,
    deleteSchedule,
    loading,
    error,
    clearError: () => setError(null),
  };
}

