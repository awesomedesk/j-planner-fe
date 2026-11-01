import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockApi } from '@/test/mockApi';
import { apiClient, isApiError, scheduleApi, todoApi } from '@utils/api';

import { buildDemoData } from './demoData';
import { createDemoBackend, isDemoBlocked, installDemoMode } from './demoBackend';

const TODAY = new Date(2026, 10, 4, 10, 0); // 11/4(수)

afterEach(() => installDemoMode(null));

describe('둘러보기 예시 데이터 (US-40, 06 SITE-08)', () => {
  it('오늘을 기준으로 만든 합성 예시 — 오늘 일정·Todo가 있고, 실제 사람·외부 링크·위치가 없다', () => {
    const data = buildDemoData(TODAY);
    expect(data.schedules.some((s) => s.start.startsWith('2026-11-04'))).toBe(true);
    expect(data.todos.some((t) => t.startDate === '2026-11-04')).toBe(true);
    expect(data.todos.map((t) => t.title)).toEqual(expect.arrayContaining(['주간 계획 세우기', '책 읽기', '운동하기']));
    for (const s of data.schedules) {
      expect(s.url).toBeNull();
      expect(s.location).toBeNull();
    }
    expect(JSON.stringify(data)).not.toMatch(/@|https?:/);
  });

  it('다른 날 열면 그날 기준으로 다시 만든다', () => {
    const data = buildDemoData(new Date(2027, 0, 15));
    expect(data.todos.some((t) => t.startDate === '2027-01-15')).toBe(true);
  });
});

describe('둘러보기 가짜 백엔드 — 실제 서버에 보내지 않음 (US-40 AC3·AC4)', () => {
  it('설치하면 조회는 예시로 답하고 fetch를 부르지 않는다 (기간·카테고리 필터 반영)', async () => {
    const api = mockApi({});
    installDemoMode(createDemoBackend(buildDemoData(TODAY), () => {}));
    const all = await scheduleApi.getList({ from: '2026-11-01', to: '2026-11-30' });
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((s) => s.start.slice(0, 10) <= '2026-11-30' && s.end.slice(0, 10) >= '2026-11-01')).toBe(true);
    const none = await scheduleApi.getList({ from: '2026-11-01', to: '2026-11-30', categoryId: [999] });
    expect(none).toEqual([]);
    const day = await todoApi.getList({ date: '2026-11-04' });
    expect(day.map((t) => t.title)).toContain('주간 계획 세우기');
    expect(api.all()).toHaveLength(0);
  });

  it('바꾸는 요청은 보내지 않고 안내를 띄우게 한 뒤 막는다 — 예시는 그대로', async () => {
    const api = mockApi({});
    const onBlocked = vi.fn();
    const data = buildDemoData(TODAY);
    installDemoMode(createDemoBackend(data, onBlocked));
    const before = JSON.stringify(data);
    const target = data.todos[0];

    const error = await todoApi.setCompleted(target.id, true).catch((e: unknown) => e);
    expect(isDemoBlocked(error)).toBe(true);
    expect(isApiError(error) && error.message).toBe('');
    await todoApi.remove(target.id).catch(() => {});
    await apiClient.post('/schedules', { title: 'x' }).catch(() => {});

    expect(onBlocked).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(data)).toBe(before);
    expect(api.all()).toHaveLength(0);
  });

  it('조회 결과를 고쳐도 예시는 바뀌지 않는다 (복사본을 준다)', async () => {
    mockApi({});
    const data = buildDemoData(TODAY);
    installDemoMode(createDemoBackend(data, () => {}));
    const list = await todoApi.getList({ date: '2026-11-04' });
    list[0].title = '바꿈';
    expect((await todoApi.getList({ date: '2026-11-04' }))[0].title).not.toBe('바꿈');
  });

  it('내 정보(GET /me)는 예시에 없음(401) — 실제 계정을 섞지 않는다', async () => {
    const api = mockApi({});
    installDemoMode(createDemoBackend(buildDemoData(TODAY), () => {}));
    const error = await apiClient.get('/me').catch((e: unknown) => e);
    expect(isApiError(error) && error.status).toBe(401);
    expect(api.all()).toHaveLength(0);
  });

  it('둘러보기를 끝내면(해제) 다시 실제 서버로 보낸다', async () => {
    installDemoMode(createDemoBackend(buildDemoData(TODAY), () => {}));
    installDemoMode(null);
    const api = mockApi({ 'GET /categories': () => ({ status: 200, body: [] }) });
    await apiClient.get('/categories');
    expect(api.calls('GET /categories')).toHaveLength(1);
  });
});
