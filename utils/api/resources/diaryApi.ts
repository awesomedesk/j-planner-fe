import apiClient from '../client';
import type { Diary, LocalDate } from '@/types/api';

/** 일기 `/diaries` (08-api-design 7절, US-24). 날짜당 1개, 날짜가 곧 주소 (D-011) */
export const diaryApi = {
  /** 기간 안의 일기 (월간 펜 아이콘, D-021). 날짜 순, 최대 62일 */
  getRange: (from: LocalDate, to: LocalDate) => apiClient.get<Diary[]>('/diaries', { from, to }),

  /** 그날 일기. 안 썼으면 404 */
  get: (date: LocalDate) => apiClient.get<Diary>(`/diaries/${date}`),

  /** 쓰기·덮어쓰기 (새로 201, 고치면 200). 내용은 보낸 그대로 저장 (D-032). 빈 내용은 400 */
  put: (date: LocalDate, content: string) => apiClient.put<Diary>(`/diaries/${date}`, { content }),

  remove: (date: LocalDate) => apiClient.delete(`/diaries/${date}`),
};
