import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';
import { setViewMode } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import AppShell from './AppShell';
import { getDayTabSlots } from './dayTabSlots';
import { SIDEBAR_SECTION_SLOTS } from './sidebarSectionSlots';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});
afterEach(() => vi.useRealTimers());

const setup = async (width: number) => {
  setViewportWidth(width);
  const api = mockApi({
    'GET /schedules': () => json(200, []),
    'GET /categories': () => json(200, CATEGORIES),
    'GET /todos': () => json(200, []),
    'GET /memos': () => json(200, []),
    'GET /ddays': () => json(200, []),
    'GET /dday-marks': () => json(200, []),
    'GET /diaries': () => json(200, [{ date: '2026-09-23', content: '어제', updatedAt: '2026-09-23T22:00:00' }]),
    'GET /diaries/2026-09-23': () => json(200, { date: '2026-09-23', content: '어제', updatedAt: '2026-09-23T22:00:00' }),
    'GET /diaries/2026-09-25': () => problem(404, 'NOT_FOUND', '없음'),
    'PUT /diaries/2026-09-25': (req) => json(201, { date: '2026-09-25', updatedAt: '2026-09-25T22:00:00', ...(req.body as object) }),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  return { api, ...renderWithStore(<AppShell />, { store }) };
};

describe('일기 연결 지점 (US-24)', () => {
  it('사이드바 일기 섹션·모바일 일기 탭이 꽂혀 있다', () => {
    expect(SIDEBAR_SECTION_SLOTS.DIARY).toBeDefined();
    expect(getDayTabSlots().DIARY).toBeDefined();
  });

  it('PC: 월간 펜 → 그날 일기 창, 사이드바 [일기 쓰기] → 기준 날짜 일기 창, 저장하면 펜 표시를 다시 받는다', async () => {
    const { user, api } = await setup(1440);
    await user.click(await screen.findByRole('button', { name: '9월 23일 일기' }));
    const opened = screen.getByRole('dialog', { name: '9월 23일 (수) 일기' });
    await waitFor(() => expect(within(opened).getByRole('textbox', { name: '일기 내용' })).toHaveValue('어제'));
    await user.keyboard('{Escape}');

    const sidebar = screen.getByRole('complementary', { name: '사이드바' });
    await user.click(await within(sidebar).findByRole('button', { name: '9월 25일 (금) 일기 쓰기' }));
    const dialog = screen.getByRole('dialog', { name: '9월 25일 (금) 일기' });
    const box = within(dialog).getByRole('textbox', { name: '일기 내용' });
    await waitFor(() => expect(box).toBeEnabled());
    await user.type(box, '오늘');
    const before = api.calls('GET /diaries').length;
    await user.click(within(dialog).getAllByRole('button', { name: '저장' })[0]);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '9월 25일 (금) 일기' })).not.toBeInTheDocument());
    await waitFor(() => expect(api.calls('GET /diaries').length).toBeGreaterThan(before));
  });

  it('모바일 일기 탭: 쓰던 중 다른 탭으로 가면 "작성을 취소할까요?", [계속 작성]이면 머문다 (06 작성 취소)', async () => {
    const { user, store } = await setup(390);
    store.dispatch(setViewMode('DAY'));
    await user.click(await screen.findByRole('tab', { name: '일기' }));
    const panel = screen.getByRole('tabpanel', { name: '일기' });
    const box = await within(panel).findByRole('textbox', { name: '일기 내용' });
    await waitFor(() => expect(box).toBeEnabled());
    await user.type(box, '쓰는 중');

    await user.click(screen.getByRole('tab', { name: '시간표' }));
    const confirm = screen.getByRole('alertdialog', { name: '작성을 취소할까요?' });
    await user.click(within(confirm).getByRole('button', { name: '계속 작성' }));
    expect(screen.getByRole('tab', { name: '일기' })).toHaveAttribute('aria-selected', 'true');
    expect(within(screen.getByRole('tabpanel', { name: '일기' })).getByRole('textbox', { name: '일기 내용' })).toHaveValue('쓰는 중');

    await user.click(screen.getByRole('tab', { name: '시간표' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '작성 취소' }));
    expect(screen.getByRole('tab', { name: '시간표' })).toHaveAttribute('aria-selected', 'true');
  });
});
