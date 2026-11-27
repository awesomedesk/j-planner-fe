import { afterEach, describe, expect, it } from 'vitest';

import type { Settings } from '@/types/api';
import { json, mockApi, problem } from '@/test/mockApi';
import { createDemoBackend, installDemoMode } from '@utils/api/demo/demoBackend';
import { buildDemoData } from '@utils/api/demo/demoData';
import { makeStore } from '@store/store';

import { selectNotices } from './noticeSlice';
import { selectColorTheme, selectDarkMode } from './themeSlice';
import { DEFAULT_SETTINGS, fetchSettings, saveSettings, saveSettingsQuietly, selectSettings, selectSidebarItems } from './settingsSlice';

afterEach(() => installDemoMode(null));

const SERVER: Settings = {
  ...DEFAULT_SETTINGS,
  sidebarOpen: false,
  sidebarItems: [
    { type: 'MEMO', visible: true },
    { type: 'TODO', visible: true },
    { type: 'DDAY', visible: false },
    { type: 'DIARY', visible: true },
  ],
};

describe('설정 store (08 §9 /settings, US-21·26)', () => {
  it('처음엔 기본값 (D-024: 일요일 시작·월간·24시간·1시간 칸·라이트·녹색·사이드바 열림·네 섹션 모두 표시)', () => {
    expect(selectSettings(makeStore().getState())).toEqual({
      weekStartDay: 'SUN',
      startView: 'MONTH',
      timeFormat: '24H',
      slotMinutes: 60,
      darkMode: false,
      colorTheme: 'GREEN',
      sidebarOpen: true,
      sidebarItems: [
        { type: 'TODO', visible: true },
        { type: 'DDAY', visible: true },
        { type: 'DIARY', visible: true },
        { type: 'MEMO', visible: true },
      ],
    });
  });

  it('GET /settings 를 받아 그대로 쓴다', async () => {
    mockApi({ 'GET /settings': () => json(200, SERVER) });
    const store = makeStore();
    await store.dispatch(fetchSettings());
    expect(selectSettings(store.getState())).toEqual(SERVER);
  });

  it('읽기에 실패하면 기본값을 그대로 쓰고 짧게 알린다', async () => {
    mockApi({ 'GET /settings': () => problem(500, 'INTERNAL', '잠시 후 다시') });
    const store = makeStore();
    await store.dispatch(fetchSettings());
    expect(selectSettings(store.getState())).toEqual(DEFAULT_SETTINGS);
    expect(selectNotices(store.getState())).toHaveLength(1);
  });

  it('바꾸면 화면에 먼저 반영하고, 바뀐 항목만 PATCH (SET-05). 사이드바 항목은 4개 전체', async () => {
    const api = mockApi({ 'PATCH /settings': (req) => json(200, { ...DEFAULT_SETTINGS, ...(req.body as object) }) });
    const store = makeStore();
    const items = [...DEFAULT_SETTINGS.sidebarItems].reverse();
    const pending = store.dispatch(saveSettings({ sidebarItems: items }));
    expect(selectSidebarItems(store.getState())).toEqual(items); // 응답 전에 이미
    await pending;
    expect(api.calls('PATCH /settings')).toHaveLength(1);
    expect(api.calls('PATCH /settings')[0].body).toEqual({ sidebarItems: items });
  });

  it('저장에 실패하면 그 항목만 이전 값으로 되돌리고 알린다', async () => {
    mockApi({ 'PATCH /settings': () => problem(400, 'VALIDATION_FAILED', '잘못된 값') });
    const store = makeStore();
    await store.dispatch(saveSettings({ sidebarOpen: false }));
    expect(selectSettings(store.getState()).sidebarOpen).toBe(true);
    expect(selectNotices(store.getState()).at(-1)?.message).toBe('설정을 저장하지 못해 이전 값으로 되돌렸어요. 다시 바꿔 주세요.');
  });

  it('실패한 요청 뒤에 같은 항목을 또 바꿨으면 되돌리지 않는다 (마지막 값이 이김)', async () => {
    let fail: (v: ReturnType<typeof problem>) => void = () => undefined;
    let call = 0;
    mockApi({
      'PATCH /settings': (req) => {
        call += 1;
        if (call === 1) return new Promise((resolve) => (fail = resolve));
        return json(200, { ...DEFAULT_SETTINGS, ...(req.body as object) });
      },
    });
    const store = makeStore();
    const first = store.dispatch(saveSettings({ sidebarOpen: false }));
    await store.dispatch(saveSettings({ sidebarOpen: true }));
    fail(problem(500, 'INTERNAL', '실패'));
    await first;
    expect(selectSettings(store.getState()).sidebarOpen).toBe(true);
  });

  it('둘러보기에서는 바꾸지 않고 요청도 보내지 않는다 (D-093)', async () => {
    const api = mockApi({});
    let blocked = 0;
    installDemoMode(createDemoBackend(buildDemoData(new Date(2026, 10, 26)), () => (blocked += 1)));
    const store = makeStore();
    await store.dispatch(saveSettings({ sidebarOpen: false }));
    expect(selectSettings(store.getState()).sidebarOpen).toBe(true);
    expect(blocked).toBe(1);
    expect(api.calls('PATCH /settings')).toHaveLength(0);
  });

  it('다크 모드·색 테마는 받은 설정과 바꾼 값을 화면 테마에 바로 반영한다 (D-024, SET-05)', async () => {
    mockApi({
      'GET /settings': () => json(200, { ...DEFAULT_SETTINGS, darkMode: true, colorTheme: 'BROWN' }),
      'PATCH /settings': (req) => json(200, { ...DEFAULT_SETTINGS, ...(req.body as object) }),
    });
    const store = makeStore();
    await store.dispatch(fetchSettings());
    expect(selectDarkMode(store.getState())).toBe(true);
    expect(selectColorTheme(store.getState())).toBe('BROWN');
    await store.dispatch(saveSettings({ colorTheme: 'GRAY', darkMode: false }));
    expect(selectColorTheme(store.getState())).toBe('GRAY');
    expect(selectDarkMode(store.getState())).toBe(false);
  });

  it('실패해 되돌리면 테마도 되돌아간다', async () => {
    mockApi({ 'PATCH /settings': () => problem(500, 'INTERNAL', '실패') });
    const store = makeStore();
    await store.dispatch(saveSettings({ darkMode: true }));
    expect(selectDarkMode(store.getState())).toBe(false);
  });

  it("달력 설정 패널용 saveSettingsQuietly: 결과('saved'·'failed'·'blocked')를 돌려주고, 안내는 패널이 하므로 알림을 띄우지 않는다", async () => {
    let fail = false;
    mockApi({ 'PATCH /settings': (req) => (fail ? problem(500, 'INTERNAL', '실패') : json(200, { ...DEFAULT_SETTINGS, ...(req.body as object) })) });
    const store = makeStore();
    expect(await store.dispatch(saveSettingsQuietly({ weekStartDay: 'MON' })).unwrap()).toBe('saved');
    fail = true;
    expect(await store.dispatch(saveSettingsQuietly({ slotMinutes: 30 })).unwrap()).toBe('failed');
    expect(selectSettings(store.getState()).slotMinutes).toBe(60);
    expect(selectNotices(store.getState())).toHaveLength(0);
    installDemoMode(createDemoBackend(buildDemoData(new Date(2026, 10, 26)), () => undefined));
    expect(await store.dispatch(saveSettingsQuietly({ slotMinutes: 30 })).unwrap()).toBe('blocked');
  });
});
