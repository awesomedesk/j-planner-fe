import apiClient from '../client';
import type { Dday, DdayCreateRequest, DdayMark, DdayUpdateRequest, Id, LocalDate, PositionRequest } from '@/types/api';

/** D-Day `/ddays`, `/dday-marks` (08-api-design 6절, US-22·23) */
export const ddayApi = {
  /** 전체 목록. sortOrder 순, 남은 날·지난 날 구분 없음 (D-029). today.label = 오늘 기준 표시 */
  getList: () => apiClient.get<Dday[]>('/ddays'),

  getById: (id: Id) => apiClient.get<Dday>(`/ddays/${id}`),

  /** 추가. 맨 뒤에 들어간다 (D-029). display를 빼면 기준별 기본값 (D-020) */
  create: (body: DdayCreateRequest) => apiClient.post<Dday>('/ddays', body),

  /** 수정 (JSON Merge Patch). 기준을 바꾸면 새 기준에 없는 옵션을 꺼서 함께 보낸다 (아니면 400) */
  update: (id: Id, body: DdayUpdateRequest) => apiClient.patch<Dday>(`/ddays/${id}`, body),

  remove: (id: Id) => apiClient.delete(`/ddays/${id}`),

  /** 순서 이동. afterId 바로 뒤, null = 맨 앞 */
  move: (id: Id, body: PositionRequest) => apiClient.put<Dday>(`/ddays/${id}/position`, body),

  /** 달력에 그릴 D-Day (서버 계산, D-043). 최대 62일. 정렬: date → D-Day 순서 */
  getMarks: (from: LocalDate, to: LocalDate) => apiClient.get<DdayMark[]>('/dday-marks', { from, to }),
};
