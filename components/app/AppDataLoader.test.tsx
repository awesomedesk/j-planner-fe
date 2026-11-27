import { waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { DEFAULT_SETTINGS } from '@store/slices/settingsSlice';
import { LAST_VIEW_KEY } from '@utils/storage/lastViewStorage';

import AppDataLoader from './AppDataLoader';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});
afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

const load = (startView: (typeof DEFAULT_SETTINGS)['startView']) => {
  mockApi({ 'GET /categories': () => json(200, CATEGORIES), 'GET /settings': () => json(200, { ...DEFAULT_SETTINGS, startView }) });
  return renderWithStore(<AppDataLoader />);
};

describe('앱을 열면 설정의 처음 화면으로 (US-27, D-029·030)', () => {
  it('주간이면 주간으로 시작', async () => {
    const { store } = load('WEEK');
    await waitFor(() => expect(store.getState().calendar.viewMode).toBe('WEEK'));
  });

  it("'마지막에 본 화면'이면 이 브라우저에 기억한 보기 (3일도)", async () => {
    localStorage.setItem(LAST_VIEW_KEY, 'THREE_DAY');
    const { store } = load('LAST');
    await waitFor(() => expect(store.getState().settings.status).toBe('loaded'));
    expect(store.getState().calendar.viewMode).toBe('THREE_DAY');
  });

  it('기억한 보기가 없으면 월간', async () => {
    const { store } = load('LAST');
    await waitFor(() => expect(store.getState().settings.status).toBe('loaded'));
    expect(store.getState().calendar.viewMode).toBe('MONTH');
  });
});
