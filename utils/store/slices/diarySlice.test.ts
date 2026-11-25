import { describe, expect, it } from 'vitest';

import { json, mockApi } from '@/test/mockApi';
import { makeStore } from '@store/store';

import { diaryChanged, fetchDiaryMarks, refreshDiaryMarks, selectDiaryDates, selectDiaryRevision } from './diarySlice';

const diary = (date: string) => ({ date, content: '내용', updatedAt: `${date}T22:00:00` });

describe('일기 store (US-24, D-021 펜 아이콘)', () => {
  it('보이는 기간으로 GET /diaries, 일기 있는 날짜만 기억한다', async () => {
    const api = mockApi({ 'GET /diaries': () => json(200, [diary('2026-09-03'), diary('2026-09-25')]) });
    const store = makeStore();
    await store.dispatch(fetchDiaryMarks({ from: '2026-08-30', to: '2026-10-03' }));
    expect(api.calls('GET /diaries')[0].query.toString()).toBe('from=2026-08-30&to=2026-10-03');
    expect(selectDiaryDates(store.getState())).toEqual(new Set(['2026-09-03', '2026-09-25']));
  });

  it('저장·삭제하면 바로 펜 표시를 고치고 revision을 올린다 → refreshDiaryMarks로 다시 받는다', async () => {
    const api = mockApi({ 'GET /diaries': () => json(200, [diary('2026-09-25')]) });
    const store = makeStore();
    await store.dispatch(fetchDiaryMarks({ from: '2026-08-30', to: '2026-10-03' }));
    const before = selectDiaryRevision(store.getState());
    store.dispatch(diaryChanged({ date: '2026-09-10', exists: true }));
    expect(selectDiaryDates(store.getState()).has('2026-09-10')).toBe(true);
    store.dispatch(diaryChanged({ date: '2026-09-25', exists: false }));
    expect(selectDiaryDates(store.getState()).has('2026-09-25')).toBe(false);
    expect(selectDiaryRevision(store.getState())).toBe(before + 2);
    await store.dispatch(refreshDiaryMarks());
    expect(api.calls('GET /diaries')).toHaveLength(2);
  });
});
