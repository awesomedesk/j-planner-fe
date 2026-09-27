import { describe, expect, it } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';

import {
  DEFAULT_CATEGORY_COLOR,
  DUPLICATED_NAME_MESSAGE,
  UNASSIGNED_CATEGORY_COLOR,
  getCategoryListColor,
  getCategoryStripeColor,
  getMoveAfterId,
  normalizeCategoryName,
  validateCategoryName,
} from './categoryUtils';

const withStudy = [...CATEGORIES, { ...CATEGORIES[1], id: 9, name: 'Study' }, { ...CATEGORIES[1], id: 10, name: 'café' }];

describe('카테고리 이름 검사 (US-04, D-035)', () => {
  it('앞뒤 공백을 지우고 비교한다', () => expect(validateCategoryName('  공부 ', CATEGORIES)).toBe(DUPLICATED_NAME_MESSAGE));
  it('영문 대소문자를 구분하지 않는다', () => expect(validateCategoryName('STUDY', withStudy)).toBe(DUPLICATED_NAME_MESSAGE));
  it('악센트를 구분하지 않는다', () => expect(validateCategoryName('Cafe', withStudy)).toBe(DUPLICATED_NAME_MESSAGE));
  it('한글은 그대로 비교한다 (띄어쓰기 다르면 다른 이름)', () => {
    expect(normalizeCategoryName('공부')).toBe('공부');
    expect(validateCategoryName('공 부', CATEGORIES)).toBeNull();
  });
  it('자기 이름의 대소문자만 바꾸는 것은 된다', () => expect(validateCategoryName('STUDY', withStudy, 9)).toBeNull());
  it('공백만 있거나 50자를 넘으면 안 된다', () => {
    expect(validateCategoryName('   ', CATEGORIES)).toBe('이름을 입력하세요');
    expect(validateCategoryName('가'.repeat(51), CATEGORIES)).toMatch('50자');
  });
});

describe('순서 이동 ▲▼ → afterId (US-04, D-029)', () => {
  it('미지정은 움직일 수 없다', () => expect(getMoveAfterId(CATEGORIES, 1, 'up')).toBeUndefined());
  it('사용자 카테고리 맨 위는 더 못 올라간다', () => expect(getMoveAfterId(CATEGORIES, 2, 'up')).toBeUndefined());
  it('두 번째를 올리면 미지정 바로 뒤(null)', () => expect(getMoveAfterId(CATEGORIES, 3, 'up')).toBeNull());
  it('세 번째를 올리면 첫 번째 뒤', () => expect(getMoveAfterId(CATEGORIES, 4, 'up')).toBe(2));
  it('내리면 다음 항목 뒤, 맨 아래는 못 내려간다', () => {
    expect(getMoveAfterId(CATEGORIES, 2, 'down')).toBe(3);
    expect(getMoveAfterId(CATEGORIES, 4, 'down')).toBeUndefined();
  });
});

describe('카테고리 표시 색 (D-037)', () => {
  it('미지정은 목록에서 회색 고정', () => expect(getCategoryListColor(CATEGORIES[0])).toBe(UNASSIGNED_CATEGORY_COLOR));
  it('색이 없으면(null) 6색 중 첫 번째', () => {
    expect(getCategoryListColor(CATEGORIES[3])).toBe(DEFAULT_CATEGORY_COLOR);
    expect(DEFAULT_CATEGORY_COLOR).toBe('#2F62A8');
  });
  it('달력 띠: 미지정은 테마 Theme2', () => expect(getCategoryStripeColor(CATEGORIES[0])).toBe('var(--tp-theme2)'));
  it('달력 띠: 그 밖에는 카테고리 색', () => expect(getCategoryStripeColor(CATEGORIES[2])).toBe('#A6323F'));
});
