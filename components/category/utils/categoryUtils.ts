import type { Category, HexColor, Id } from '@/types/api';
import { ITEM_COLOR_OPTIONS } from '@components/theme/itemColorOptions';

/** 이름 길이 (08-api-design 3절: 앞뒤 공백을 지운 뒤 1~50자) */
export const CATEGORY_NAME_MAX_LENGTH = 50;

/** 이미 있는 이름일 때 문구 (화면기획서 OV-04 ⑤) */
export const DUPLICATED_NAME_MESSAGE = '이미 있는 이름이에요 (같은 이름 추가·변경 불가)';

/**
 * 이름 비교용으로 바꾼다 (D-035)
 * 앞뒤 공백을 지우고, 영문 대소문자·악센트를 구분하지 않는다. "Study" = "study", "cafe" = "café"
 * 한글은 그대로 둔다 (NFD로 나눈 뒤 결합 부호만 지우고 다시 NFC로 합친다).
 */
export const normalizeCategoryName = (name: string) =>
  name.trim().normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC').toLocaleLowerCase('en-US');

/**
 * 이름 검사. 문제가 없으면 null
 * @param exceptId 이름을 바꿀 때 자기 자신은 빼고 비교 (자기 이름의 대소문자만 바꾸는 것은 된다)
 */
export const validateCategoryName = (name: string, categories: Category[], exceptId?: Id): string | null => {
  const trimmed = name.trim();
  if (!trimmed) return '이름을 입력하세요';
  if (trimmed.length > CATEGORY_NAME_MAX_LENGTH) return `이름은 ${CATEGORY_NAME_MAX_LENGTH}자까지 쓸 수 있어요`;
  const normalized = normalizeCategoryName(trimmed);
  if (categories.some((c) => c.id !== exceptId && normalizeCategoryName(c.name) === normalized)) return DUPLICATED_NAME_MESSAGE;
  return null;
};

// ---------------------------------------------------------------- 표시 색 (D-037)

/** `미지정`의 목록·필터 색 (회색 고정, 화면기획서 OV-04·MO-21) */
export const UNASSIGNED_CATEGORY_COLOR: HexColor = '#6B6B6B';

/** 색을 고르지 않은(null) 카테고리의 표시 색 = 6색 중 첫 번째 */
export const DEFAULT_CATEGORY_COLOR: HexColor = ITEM_COLOR_OPTIONS[0];

/** 카테고리 관리·필터·입력 창 목록에서 보이는 색 */
export const getCategoryListColor = (category: Pick<Category, 'isDefault' | 'color'>): HexColor =>
  category.isDefault ? UNASSIGNED_CATEGORY_COLOR : category.color ?? DEFAULT_CATEGORY_COLOR;

/**
 * 달력 블록 왼쪽 띠 색 (D-019, D-037)
 * `미지정`은 테마의 Theme2. 값이 CSS 변수라 테마를 바꾸면 따라 바뀐다.
 */
export const getCategoryStripeColor = (category: Pick<Category, 'isDefault' | 'color'>): string =>
  category.isDefault ? 'var(--tp-theme2)' : category.color ?? DEFAULT_CATEGORY_COLOR;

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
