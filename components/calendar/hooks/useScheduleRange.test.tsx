import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { schedule } from '@/test/fixtures';
import { json, mockApi, problem } from '@/test/mockApi';
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
