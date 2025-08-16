import apiClient from '../../../utils/api/client';
import type {
  ScheduleAPI,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  MonthlySchedulesResponse,
  DailySchedulesResponse,
  ScheduleSearchResponse,
  CalendarSettings,
  MonthlyParams,
  DailyParams,
  SearchParams,
} from './types';

// 일정 관련 API 함수들
export const scheduleApi = {
  // 전체 일정 조회
  getAll: () => 
    apiClient.get<ScheduleAPI[]>('/schedules'),

  // 월별 일정 조회
  getByMonth: ({ year, month }: MonthlyParams) =>
    apiClient.get<MonthlySchedulesResponse>('/schedules', { 
      month: `${year}-${month.toString().padStart(2, '0')}` 
    }),

  // 일별 일정 조회
  getByDate: ({ date }: DailyParams) =>
    apiClient.get<DailySchedulesResponse>('/schedules', { date }),

  // 일정 검색
  search: ({ query, page = 1, limit = 20, dateFrom, dateTo, color }: SearchParams) =>
    apiClient.get<ScheduleSearchResponse>('/schedules/search', {
      q: query,
      page: page.toString(),
      limit: limit.toString(),
      ...(dateFrom && { date_from: dateFrom }),
      ...(dateTo && { date_to: dateTo }),
      ...(color && { color }),
    }),

  // 특정 일정 조회
  getById: (id: string) =>
    apiClient.get<ScheduleAPI>(`/schedules/${id}`),

  // 일정 생성
  create: (data: CreateScheduleRequest) =>
    apiClient.post<ScheduleAPI>('/schedules', data),

  // 일정 수정
  update: (id: string, data: UpdateScheduleRequest) =>
    apiClient.put<ScheduleAPI>(`/schedules/${id}`, data),

  // 일정 삭제
  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/schedules/${id}`),

  // 일정 일괄 생성
  createBulk: (schedules: CreateScheduleRequest[]) =>
    apiClient.post<ScheduleAPI[]>('/schedules/bulk', { schedules }),

  // 일정 일괄 수정
  updateBulk: (updates: { id: string; data: UpdateScheduleRequest }[]) =>
    apiClient.put<ScheduleAPI[]>('/schedules/bulk', { updates }),
};

// 사용자 설정 관련 API 함수들
export const userApi = {
  // 달력 설정 조회
  getCalendarSettings: () =>
    apiClient.get<CalendarSettings>('/user/calendar-settings'),

  // 달력 설정 수정
  updateCalendarSettings: (settings: Partial<CalendarSettings>) =>
    apiClient.put<CalendarSettings>('/user/calendar-settings', settings),
};
