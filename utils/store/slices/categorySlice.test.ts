import { describe, expect, it } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { makeStore } from '@store/store';

import { fetchCategories, selectCategories, selectCategoriesById } from './categorySlice';

describe('카테고리 (US-04)', () => {
  it('미지정 맨 위, 그다음 순서대로', async () => {
    mockApi({ 'GET /categories': () => json(200, [...CATEGORIES].reverse()) });
    const store = makeStore();
    await store.dispatch(fetchCategories());
    expect(selectCategories(store.getState()).map((c) => c.name)).toEqual(['미지정', '공부', '업무', '운동']);
  });

  it('id로 찾는 표를 한 번만 만든다 (화면마다 다시 만들지 않게)', async () => {
    mockApi({ 'GET /categories': () => json(200, CATEGORIES) });
    const store = makeStore();
    await store.dispatch(fetchCategories());
    const byId = selectCategoriesById(store.getState());
    expect(byId.get(2)?.name).toBe('공부');
    expect(selectCategoriesById(store.getState())).toBe(byId); // 같은 목록이면 같은 표
  });
});
