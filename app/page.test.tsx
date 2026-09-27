import { act, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { SEED_SCHEDULES } from '@/test/seed';
import { makeStore } from '@store/store';

import Home from './page';

afterEach(() => vi.useRealTimers());

const app = () => (
  <Provider store={makeStore()}>
    <Home />
  </Provider>
);

describe('정적 빌드로 연 첫 화면 (US-01, US-06)', () => {
  it('빌드한 날이 아니라 여는 날을 오늘로 보여준다', async () => {
    mockApi({ 'GET /schedules': () => json(200, SEED_SCHEDULES), 'GET /categories': () => json(200, CATEGORIES) });
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });

    vi.setSystemTime(new Date(2026, 8, 27, 1, 0)); // 빌드: 9/27(일)
    const html = renderToString(app());

    vi.setSystemTime(new Date(2026, 8, 25, 14, 30)); // 브라우저에서 연 날: 9/25(금)
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    const root = await act(async () => hydrateRoot(container, app(), { onRecoverableError: () => {} }));

    expect(await screen.findByRole('button', { name: '9월 25일 (금)' })).toHaveAttribute('aria-current', 'date');
    expect(screen.getByRole('button', { name: '9월 27일 (일)' })).not.toHaveAttribute('aria-current');
    expect(screen.getAllByRole('heading', { name: '9월 25일 (금)' }).length).toBeGreaterThan(0); // 사이드바·폴드 패널 날짜
    expect(screen.queryByRole('heading', { name: '9월 27일 (일)' })).not.toBeInTheDocument();
    act(() => root.unmount());
    container.remove();
  });
});
