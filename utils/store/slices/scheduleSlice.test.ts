import { describe, expect, it } from 'vitest';

import { schedule } from '@/test/fixtures';
import { json, mockApi, problem, type MockResponse } from '@/test/mockApi';
import { makeStore } from '@store/store';

import { fetchSchedules } from './scheduleSlice';

const MONTH = { from: '2026-08-30', to: '2026-10-03' };
const WEEK = { from: '2026-09-20', to: '2026-09-26' };

/** 응답을 원하는 순서로 풀어 주는 가짜 API */
const deferredApi = () => {
  const pending = new Map<string, (res: MockResponse) => void>();
  mockApi({
    'GET /schedules': ({ query }) =>
      new Promise<MockResponse>((resolve) => pending.set(`${query.get('from')}~${query.get('to')}`, resolve)),
  });
  return { resolve: (range: { from: string; to: string }, res: MockResponse) => pending.get(`${range.from}~${range.to}`)!(res) };
};

describe('보이는 기간 일정 (US-06~08)', () => {
  it('받은 기간과 일정을 기억한다', async () => {
    mockApi({ 'GET /schedules': () => json(200, [schedule({ id: 1, start: '2026-09-21T10:00:00', end: '2026-09-21T11:00:00' })]) });
    const store = makeStore();
    await store.dispatch(fetchSchedules(WEEK));
    expect(store.getState().schedule).toMatchObject({ status: 'succeeded', range: WEEK, items: [expect.objectContaining({ id: 1 })] });
  });

  it('늦게 온 옛 기간의 성공 응답은 버린다', async () => {
    const api = deferredApi();
    const store = makeStore();
    const month = store.dispatch(fetchSchedules(MONTH));
    const week = store.dispatch(fetchSchedules(WEEK));
    api.resolve(WEEK, json(200, [schedule({ id: 2, start: '2026-09-22T10:00:00', end: '2026-09-22T11:00:00' })]));
    await week;
    api.resolve(MONTH, json(200, [schedule({ id: 1, start: '2026-09-21T10:00:00', end: '2026-09-21T11:00:00' })]));
    await month;
    expect(store.getState().schedule).toMatchObject({ status: 'succeeded', range: WEEK, items: [expect.objectContaining({ id: 2 })] });
  });

  it('늦게 온 옛 기간의 실패도 지금 기간을 "실패"로 바꾸지 않는다', async () => {
    const api = deferredApi();
    const store = makeStore();
    const month = store.dispatch(fetchSchedules(MONTH));
    const week = store.dispatch(fetchSchedules(WEEK));
    api.resolve(WEEK, json(200, [schedule({ id: 2, start: '2026-09-22T10:00:00', end: '2026-09-22T11:00:00' })]));
    await week;
    api.resolve(MONTH, problem(500, 'INTERNAL_ERROR', '서버 오류'));
    await month;
    expect(store.getState().schedule.status).toBe('succeeded');
  });

  it('지금 기간이 실패하면 "실패"', async () => {
    mockApi({ 'GET /schedules': () => problem(500, 'INTERNAL_ERROR', '서버 오류') });
    const store = makeStore();
    await store.dispatch(fetchSchedules(WEEK));
    expect(store.getState().schedule.status).toBe('failed');
  });
});
