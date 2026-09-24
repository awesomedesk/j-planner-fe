import apiClient from '../client';
import type {
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  Id,
  PositionRequest,
} from '@/types/api';

/** 카테고리 `/categories` (08-api-design 3절) */
export const categoryApi = {
  /** 전체 목록. `미지정` 맨 위 + sortOrder 순 */
  getList: () => apiClient.get<Category[]>('/categories'),

  /** 추가. 맨 뒤에 들어간다. 이름 중복이면 409 CATEGORY_NAME_DUPLICATED */
  create: (body: CategoryCreateRequest) => apiClient.post<Category>('/categories', body),

  /** 이름·색 수정. `미지정`은 색만 바꿀 수 있다 */
  update: (id: Id, body: CategoryUpdateRequest) => apiClient.patch<Category>(`/categories/${id}`, body),

  /** 삭제. 연결된 일정·Todo는 `미지정`으로 옮겨진다 */
  remove: (id: Id) => apiClient.delete(`/categories/${id}`),

  /** 순서 이동 (afterId 바로 뒤, null = `미지정` 바로 뒤) */
  move: (id: Id, body: PositionRequest) => apiClient.put<Category>(`/categories/${id}/position`, body),
};
