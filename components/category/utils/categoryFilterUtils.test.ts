import { describe, expect, it } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';

import { categoryFilterLabel, searchCategories, selectedCategoryIds, toCategoryFilter } from './categoryFilterUtils';

// CATEGORIES: 1 미지정, 2 공부, 3 업무, 4 운동

describe('카테고리 필터 값 (US-11, CAT-03)', () => {
  it('전부 고르면 "전체"(null) — 조회에 categoryId를 붙이지 않는다', () => {
    expect(toCategoryFilter([4, 3, 2, 1], CATEGORIES)).toBeNull();
  });

  it('일부만 고르면 카테고리 목록 순서로', () => {
    expect(toCategoryFilter([3, 2], CATEGORIES)).toEqual([2, 3]);
  });

  it('하나도 안 고르면 빈 목록', () => {
    expect(toCategoryFilter([], CATEGORIES)).toEqual([]);
  });

  it('체크 상태: 전체면 모두, 아니면 고른 것 중 아직 있는 것만 (지운 카테고리는 빠짐)', () => {
    expect(selectedCategoryIds(null, CATEGORIES)).toEqual([1, 2, 3, 4]);
    expect(selectedCategoryIds([2, 9], CATEGORIES)).toEqual([2]);
  });

  it('버튼 글자: 전체 / n개 (D-015)', () => {
    expect(categoryFilterLabel(null, CATEGORIES)).toBe('전체');
    expect(categoryFilterLabel([2, 3], CATEGORIES)).toBe('2개');
    expect(categoryFilterLabel([], CATEGORIES)).toBe('0개');
    expect(categoryFilterLabel([2, 9], CATEGORIES)).toBe('1개'); // 지운 카테고리는 세지 않음
  });

  it('검색: 앞뒤 공백 무시, 대소문자 무시, 이름에 들어 있으면', () => {
    const withEnglish = [...CATEGORIES, { ...CATEGORIES[1], id: 5, name: 'Study Group' }];
    expect(searchCategories(withEnglish, '  업 ').map((c) => c.name)).toEqual(['업무']);
    expect(searchCategories(withEnglish, 'study').map((c) => c.name)).toEqual(['Study Group']);
    expect(searchCategories(withEnglish, '')).toHaveLength(5);
  });
});
