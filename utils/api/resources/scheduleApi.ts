import apiClient from '../client';
import type {
  Id,
  LocalDate,
  Schedule,
  ScheduleCreateRequest,
  ScheduleUpdateRequest,
} from '@/types/api';

export interface ScheduleListQuery {
  /** 기간 시작일 (포함) */
  from: LocalDate;
  /** 기간 끝일 (포함). from부터 최대 62일 */
  to: LocalDate;
  /** 카테고리 필터 (CAT-03). 없으면 전체 */
  categoryId?: Id[];
}

/** 일정 `/schedules` (08-api-design 4절) */
export const scheduleApi = {
  /** 기간과 겹치는 일정. 시작 시각 순 */
  getList: ({ from, to, categoryId }: ScheduleListQuery) =>
    apiClient.get<Schedule[]>('/schedules', { from, to, categoryId }),

  getById: (id: Id) => apiClient.get<Schedule>(`/schedules/${id}`),

  create: (body: ScheduleCreateRequest) => apiClient.post<Schedule>('/schedules', body),

  /** JSON Merge Patch: 바뀐 필드만 보낸다. null = 값 지우기 */
  update: (id: Id, body: ScheduleUpdateRequest) => apiClient.patch<Schedule>(`/schedules/${id}`, body),

  remove: (id: Id) => apiClient.delete(`/schedules/${id}`),
};
