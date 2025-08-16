"use client";

import { useState, useEffect, useCallback } from 'react';
import { scheduleApi } from '../types/schedule';
import type { 
  ScheduleAPI, 
  CreateScheduleRequest, 
  UpdateScheduleRequest,
  MonthlyParams,
  DailyParams,
  SearchParams 
} from '../types/types';
import type { ApiError } from '../../../utils/api/client';

interface UseScheduleState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// 월별 일정 조회 훅
export function useMonthlySchedules(params: MonthlyParams) {
  const [state, setState] = useState<UseScheduleState<ScheduleAPI[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchSchedules = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await scheduleApi.getByMonth(params);
      setState({
        data: response.data.schedules,
        loading: false,
        error: null,
      });
    } catch (error) {
      const apiError = error as ApiError;
      setState({
        data: null,
        loading: false,
        error: apiError.message || '일정을 불러오는데 실패했습니다.',
      });
    }
  }, [params]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    ...state,
    refetch: fetchSchedules,
  };
}

// 일별 일정 조회 훅
export function useDailySchedules(params: DailyParams) {
  const [state, setState] = useState<UseScheduleState<ScheduleAPI[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchSchedules = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await scheduleApi.getByDate(params);
      setState({
        data: response.data.schedules,
        loading: false,
        error: null,
      });
    } catch (error) {
      const apiError = error as ApiError;
      setState({
        data: null,
        loading: false,
        error: apiError.message || '일정을 불러오는데 실패했습니다.',
      });
    }
  }, [params]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    ...state,
    refetch: fetchSchedules,
  };
}

// 일정 생성/수정/삭제 훅
export function useScheduleMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSchedule = useCallback(async (data: CreateScheduleRequest): Promise<ScheduleAPI | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scheduleApi.create(data);
      setLoading(false);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || '일정 생성에 실패했습니다.');
      setLoading(false);
      return null;
    }
  }, []);

  const updateSchedule = useCallback(async (id: string, data: UpdateScheduleRequest): Promise<ScheduleAPI | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scheduleApi.update(id, data);
      setLoading(false);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || '일정 수정에 실패했습니다.');
      setLoading(false);
      return null;
    }
  }, []);

  const deleteSchedule = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await scheduleApi.delete(id);
      setLoading(false);
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || '일정 삭제에 실패했습니다.');
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

// 일정 검색 훅
export function useScheduleSearch() {
  const [state, setState] = useState<UseScheduleState<ScheduleAPI[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const searchSchedules = useCallback(async (params: SearchParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await scheduleApi.search(params);
      setState({
        data: response.data.schedules,
        loading: false,
        error: null,
      });
    } catch (error) {
      const apiError = error as ApiError;
      setState({
        data: null,
        loading: false,
        error: apiError.message || '검색에 실패했습니다.',
      });
    }
  }, []);

  return {
    ...state,
    searchSchedules,
  };
}
