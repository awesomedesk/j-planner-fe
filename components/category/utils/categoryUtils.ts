import type { Category, Id } from '@/types/api';

/** 이름 길이 (08-api-design 3절: 앞뒤 공백을 지운 뒤 1~50자) */
export const CATEGORY_NAME_MAX_LENGTH = 50;

/** 이미 있는 이름일 때 문구 (화면기획서 OV-04 ⑤) */
export const DUPLICATED_NAME_MESSAGE = '이미 있는 이름이에요 (같은 이름 추가·변경 불가)';

/**
 * 이름 검사. 문제가 없으면 null
 * @param exceptId 이름을 바꿀 때 자기 자신은 빼고 비교
 */
export const validateCategoryName = (name: string, categories: Category[], exceptId?: Id): string | null => {
  const trimmed = name.trim();
  if (!trimmed) return '이름을 입력하세요';
  if (trimmed.length > CATEGORY_NAME_MAX_LENGTH) return `이름은 ${CATEGORY_NAME_MAX_LENGTH}자까지 쓸 수 있어요`;
  if (categories.some((c) => c.id !== exceptId && c.name.trim() === trimmed)) return DUPLICATED_NAME_MESSAGE;
  return null;
};

export type MoveDirection = 'up' | 'down';

/**
 * ▲▼ 이동 → `PUT /categories/{id}/position`의 afterId (08-api-design 2-5)
 * - `미지정`은 움직이지 않고, 다른 항목도 `미지정` 위로 갈 수 없다.
 * - afterId = null 은 `미지정` 바로 뒤(사용자 카테고리 맨 앞)
 * @returns 움직일 수 없으면 undefined
 */
export const getMoveAfterId = (categories: Category[], id: Id, direction: MoveDirection): Id | null | undefined => {
  const movable = categories.filter((c) => !c.isDefault);
  const index = movable.findIndex((c) => c.id === id);
  if (index < 0) return undefined;

  if (direction === 'up') {
    if (index === 0) return undefined;
    return index === 1 ? null : movable[index - 2].id;
  }
  if (index === movable.length - 1) return undefined;
  return movable[index + 1].id;
};
