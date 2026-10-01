import type { Category, Id } from '@/types/api';
import type { CategoryFilter } from '@/types/calendar';

/** 체크한 id들 → 필터 값. 전부 골랐으면 '전체'(null), 아니면 카테고리 목록 순서로 */
export const toCategoryFilter = (checkedIds: Id[], categories: Category[]): CategoryFilter => {
  const checked = new Set(checkedIds);
  const ids = categories.filter((category) => checked.has(category.id)).map((category) => category.id);
  return ids.length === categories.length ? null : ids;
};

/** 필터 값 → 체크된 id들 (지운 카테고리는 빠진다) */
export const selectedCategoryIds = (filter: CategoryFilter, categories: Category[]): Id[] => {
  if (filter === null) return categories.map((category) => category.id);
  const chosen = new Set(filter);
  return categories.filter((category) => chosen.has(category.id)).map((category) => category.id);
};

/** 필터 버튼 글자: `전체` / `2개` (D-015) */
export const categoryFilterLabel = (filter: CategoryFilter, categories: Category[]) =>
  filter === null ? '전체' : `${selectedCategoryIds(filter, categories).length}개`;

/** 이름 검색 (앞뒤 공백·대소문자 무시) */
export const searchCategories = (categories: Category[], query: string) => {
  const keyword = query.trim().toLocaleLowerCase();
  return keyword ? categories.filter((category) => category.name.toLocaleLowerCase().includes(keyword)) : categories;
};
