import apiClient from '../client';
import type { Id, Memo, MemoRequest } from '@/types/api';

/** 메모 `/memos` (08-api-design 8절, US-25). 날짜와 연결되지 않는다 (D-011) */
export const memoApi = {
  /** 전체 목록. 최근 수정 순 (D-029). 검색 없음 (D-030) */
  getList: () => apiClient.get<Memo[]>('/memos'),

  getById: (id: Id) => apiClient.get<Memo>(`/memos/${id}`),

  /** 추가. 제목·내용이 모두 비면 400 VALIDATION_FAILED (D-032) */
  create: (body: MemoRequest) => apiClient.post<Memo>('/memos', body),

  /** 수정 (JSON Merge Patch). 저장 버튼으로만, 자동 저장 없음 (D-030) */
  update: (id: Id, body: MemoRequest) => apiClient.patch<Memo>(`/memos/${id}`, body),

  remove: (id: Id) => apiClient.delete(`/memos/${id}`),
};
