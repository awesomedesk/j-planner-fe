import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { SEED_SCHEDULES } from '@/test/seed';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import CalendarMonthly from './monthly/CalendarMonthly';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});
afterEach(() => vi.useRealTimers());

const prepare = async () => {
  const api = mockApi({
    'GET /schedules': () => json(200, SEED_SCHEDULES),
    'GET /categories': () => json(200, CATEGORIES),
    'GET /diaries': () => json(200, [{ date: '2026-09-23', content: '비밀 내용', updatedAt: '2026-09-23T22:00:00' }]),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  return { api, store };
};

describe('월간 일기 펜 아이콘 (US-24, D-021)', () => {
  it('보이는 기간으로 GET /diaries, 일기 있는 날에 펜 버튼(내용은 칸에 없음) → 그날 일기 창', async () => {
    const { api, store } = await prepare();
    const onOpenDiary = vi.fn();
    const { user } = renderWithStore(<CalendarMonthly variant="bars" onOpenSchedule={vi.fn()} onOpenDiary={onOpenDiary} />, { store });
    await waitFor(() => expect(api.calls('GET /diaries')).toHaveLength(1));
    expect(api.calls('GET /diaries')[0].query.toString()).toBe('from=2026-08-30&to=2026-10-03');
    const pen = await screen.findByRole('button', { name: '9월 23일 일기' });
    expect(screen.queryByText('비밀 내용')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '9월 24일 일기' })).not.toBeInTheDocument();

    await user.click(pen);
    expect(onOpenDiary).toHaveBeenCalledWith('2026-09-23');
    // 칸 선택·일간 이동으로 번지지 않는다
    expect(store.getState().calendar.selectedDate).toBe('2026-09-25');
    await user.dblClick(pen);
    expect(store.getState().calendar.viewMode).toBe('MONTH');
  });

  it('모바일(색 점): 펜은 그림만, 날짜 버튼 이름에 "일기 있음"', async () => {
    const { store } = await prepare();
    renderWithStore(<CalendarMonthly variant="dots" onOpenSchedule={vi.fn()} />, { store });
    expect(await screen.findByRole('button', { name: /^9월 23일 \(수\).*, 일기 있음$/ })).toBeInTheDocument();
  });
});
