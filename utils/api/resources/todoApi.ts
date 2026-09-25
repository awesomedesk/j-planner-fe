import apiClient from '../client';
import type { Id, LocalDate, PositionRequest, Todo, TodoCreateRequest, TodoUpdateRequest } from '@/types/api';

/**
 * Todo 조회 조건 — 셋 중 하나만 보낸다 (섞으면 400 INVALID_QUERY, 08-api-design 5절)
 * - date: 그날 박스. 오늘이면 지난 미완료 Todo도 함께 오고 overdue: true (D-029)
 * - from·to: 기간과 겹치는 Todo. scheduled: true면 시간이 있는 것만 (시간표 블록), 최대 62일
 * - completedOn: 그날 완료한 Todo (일기 화면, DIARY-04)
 * categoryId는 셋 모두와 함께 쓸 수 있다 (CAT-03)
 */
export type TodoListQuery = { categoryId?: Id[] } & (
  | { date: LocalDate }
  | { from: LocalDate; to: LocalDate; scheduled?: boolean }
  | { completedOn: LocalDate }
);

/** Todo `/todos` (08-api-design 5절, US-12~16) */
export const todoApi = {
  getList: (query: TodoListQuery) => apiClient.get<Todo[]>('/todos', { ...query }),

  getById: (id: Id) => apiClient.get<Todo>(`/todos/${id}`),

  /** 추가. 박스 맨 아래에 들어간다 (D-029) */
  create: (body: TodoCreateRequest) => apiClient.post<Todo>('/todos', body),

  /**
   * 수정 (JSON Merge Patch). 완료 처리도 여기로: { completed: true | false } (null은 400)
   * 시간 지우기: { time: null }
   */
  update: (id: Id, body: TodoUpdateRequest) => apiClient.patch<Todo>(`/todos/${id}`, body),

  /** 완료·완료 취소 (TODO-02, 기간·주간·월간도 한 번이면 전체 완료 D-027) */
  setCompleted: (id: Id, completed: boolean) => apiClient.patch<Todo>(`/todos/${id}`, { completed }),

  remove: (id: Id) => apiClient.delete(`/todos/${id}`),

  /** 순서 이동 (끌어서, D-030). afterId 바로 뒤, null = 맨 앞 */
  move: (id: Id, body: PositionRequest) => apiClient.put<Todo>(`/todos/${id}/position`, body),
};
