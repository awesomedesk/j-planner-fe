import { afterEach, describe, expect, it } from 'vitest';

import { ddayFixture } from '@/test/ddayFixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { createDemoBackend, installDemoMode } from '@utils/api/demo/demoBackend';
import { buildDemoData } from '@utils/api/demo/demoData';
import { makeStore } from '@store/store';

import { fetchDdayMarks, fetchDdays, moveDday, refreshDdays, selectDdayMarks, selectDdays } from './ddaySlice';

afterEach(() => installDemoMode(null));

const LIST = [ddayFixture({ id: 1, title: '시험' }), ddayFixture({ id: 2, title: '여행' }), ddayFixture({ id: 3, title: '전역' })];

describe('D-Day store (US-22·23)', () => {
  it('목록은 서버 순서 그대로 (D-029)', async () => {
    mockApi({ 'GET /ddays': () => json(200, LIST) });
    const store = makeStore();
    await store.dispatch(fetchDdays());
    expect(selectDdays(store.getState()).map((d) => d.title)).toEqual(['시험', '여행', '전역']);
  });

  it('달력 표시는 기간으로 받고, 늦게 온 옛 기간 응답은 버린다', async () => {
    let resolveOld: (v: ReturnType<typeof json>) => void = () => undefined;
    const api = mockApi({
      'GET /dday-marks': (req) =>
        req.query.get('from') === '2026-11-01'
          ? new Promise((resolve) => {
              resolveOld = resolve;
            })
          : json(200, [{ ddayId: 1, date: '2026-12-31', label: 'D-Day', kind: 'TARGET' }]),
    });
    const store = makeStore();
    const old = store.dispatch(fetchDdayMarks({ from: '2026-11-01', to: '2026-11-30' }));
    await store.dispatch(fetchDdayMarks({ from: '2026-12-01', to: '2026-12-31' }));
    resolveOld(json(200, [{ ddayId: 9, date: '2026-11-05', label: 'D-9', kind: 'DAILY' }]));
    await old;
    expect(selectDdayMarks(store.getState()).map((m) => m.ddayId)).toEqual([1]);
    expect(api.calls('GET /dday-marks')[1].query.toString()).toBe('from=2026-12-01&to=2026-12-31');
  });

  it('저장·삭제 뒤 refreshDdays: 목록과 지금 기간의 달력 표시를 다시 받는다 (06 달력 표시)', async () => {
    const api = mockApi({ 'GET /ddays': () => json(200, LIST), 'GET /dday-marks': () => json(200, []) });
    const store = makeStore();
    await store.dispatch(fetchDdayMarks({ from: '2026-12-01', to: '2026-12-31' }));
    await store.dispatch(refreshDdays());
    expect(api.calls('GET /ddays')).toHaveLength(1);
    expect(api.calls('GET /dday-marks')).toHaveLength(2);
  });

  it('순서 이동: 바로 바꾸고 PUT position(afterId), 달력 표시도 다시 받는다 (D-029)', async () => {
    const api = mockApi({
      'GET /ddays': () => json(200, LIST),
      'PUT /ddays/:id/position': (req) => json(200, { ...LIST[2], ...(req.body as object) }),
      'GET /dday-marks': () => json(200, []),
    });
    const store = makeStore();
    await store.dispatch(fetchDdays());
    await store.dispatch(fetchDdayMarks({ from: '2026-12-01', to: '2026-12-31' }));
    await store.dispatch(moveDday({ id: 3, afterId: null }));
    expect(selectDdays(store.getState()).map((d) => d.id)).toEqual([3, 1, 2]);
    expect(api.calls('PUT /ddays/:id/position')[0].body).toEqual({ afterId: null });
    expect(api.calls('GET /dday-marks')).toHaveLength(2);
  });

  it('순서 이동이 실패하면 원래 순서로 되돌리고 안내', async () => {
    mockApi({
      'GET /ddays': () => json(200, LIST),
      'PUT /ddays/:id/position': () => problem(500, 'INTERNAL_ERROR', '서버 오류'),
    });
    const store = makeStore();
    await store.dispatch(fetchDdays());
    await store.dispatch(moveDday({ id: 1, afterId: 2 }));
    expect(selectDdays(store.getState()).map((d) => d.id)).toEqual([1, 2, 3]);
    expect(store.getState().notice.items.length).toBeGreaterThan(0);
  });

  it('둘러보기에서는 순서를 바꾸지 않고 요청도 보내지 않는다 (D-093)', async () => {
    const api = mockApi({ 'GET /ddays': () => json(200, LIST) });
    const store = makeStore();
    await store.dispatch(fetchDdays());
    let blocked = 0;
    installDemoMode(createDemoBackend(buildDemoData(new Date(2026, 10, 26)), () => (blocked += 1)));
    await store.dispatch(moveDday({ id: 3, afterId: null }));
    expect(selectDdays(store.getState()).map((d) => d.id)).toEqual([1, 2, 3]);
    expect(blocked).toBe(1);
    expect(api.calls('PUT /ddays/:id/position')).toHaveLength(0);
  });
});
