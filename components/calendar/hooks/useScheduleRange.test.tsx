import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { schedule } from '@/test/fixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { setCategoryFilter } from '@store/slices/calendarSlice';
import { makeStore } from '@store/store';

import { useScheduleRange } from './useScheduleRange';

const WEEK = { from: '2026-09-20', to: '2026-09-26' };

const setup = () => {
  const store = makeStore();
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const view = renderHook(({ range }) => useScheduleRange(range), { wrapper, initialProps: { range: WEEK } });
  return { store, ...view };
};

describe('보이는 기간 일정 받기 (월간·주간·일간 공통)', () => {
  it('그 기간을 받고, 다 받으면 isLoaded', async () => {
    const api = mockApi({ 'GET /schedules': () => json(200, [schedule({ id: 1, start: '2026-09-21T10:00:00', end: '2026-09-21T11:00:00' })]) });
    const { result } = setup();
    expect(result.current.isLoaded).toBe(false);
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(api.calls('GET /schedules')[0].query.toString()).toBe('from=2026-09-20&to=2026-09-26');
    expect(result.current.loadedSchedules.map((s) => s.id)).toEqual([1]);
  });

  it('실패해도 끝난 것으로 보고(isLoaded), 받은 일정은 없음 + 짧은 안내', async () => {
    mockApi({ 'GET /schedules': () => problem(500, 'INTERNAL_ERROR', '서버 오류가 났어요') });
    const { result, store } = setup();
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.loadedSchedules).toEqual([]);
    expect(store.getState().notice.items.map((n) => n.message)).toEqual(['서버 오류가 났어요']);
  });
});

describe('카테고리 필터로 거르기 (US-11, 08-api-design 11절: 서버에서 거름)', () => {
  it('고른 카테고리만: categoryId를 여러 번 붙여 받는다', async () => {
    const api = mockApi({ 'GET /schedules': () => json(200, []) });
    const { store, result } = setup();
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    act(() => {
      store.dispatch(setCategoryFilter([2, 3]));
    });
    await waitFor(() => expect(api.calls('GET /schedules')).toHaveLength(2));
    expect(api.calls('GET /schedules')[1].query.toString()).toBe('from=2026-09-20&to=2026-09-26&categoryId=2&categoryId=3');
  });

  it('하나도 안 고르면 요청 없이 빈 달력', async () => {
    const api = mockApi({ 'GET /schedules': () => json(200, [schedule({ id: 1, start: '2026-09-21T10:00:00', end: '2026-09-21T11:00:00' })]) });
    const { store, result } = setup();
    await waitFor(() => expect(result.current.schedules).toHaveLength(1));
    act(() => {
      store.dispatch(setCategoryFilter([]));
    });
    await waitFor(() => expect(result.current.schedules).toEqual([]));
    expect(result.current.isLoaded).toBe(true);
    expect(api.calls('GET /schedules')).toHaveLength(1);
  });

  it('필터를 바꾸기 전 요청이 늦게 와도 화면을 덮지 않는다', async () => {
    let release: (value: ReturnType<typeof json>) => void = () => undefined;
    mockApi({
      'GET /schedules': (req) =>
        req.query.getAll('categoryId').length === 0
          ? new Promise((resolve) => {
              release = resolve;
            })
          : json(200, [schedule({ id: 7, start: '2026-09-22T10:00:00', end: '2026-09-22T11:00:00', categoryId: 2 })]),
    });
    const { store, result } = setup();
    act(() => {
      store.dispatch(setCategoryFilter([2]));
    });
    await waitFor(() => expect(result.current.schedules.map((s) => s.id)).toEqual([7]));
    release(json(200, [schedule({ id: 1, start: '2026-09-21T10:00:00', end: '2026-09-21T11:00:00' })]));
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.schedules.map((s) => s.id)).toEqual([7]);
  });
});
