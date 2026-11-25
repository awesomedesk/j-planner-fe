import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';
import { moveView, openDayView, setMobileDayTab, setViewMode } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import AppShell from './AppShell';
import { getDayTabSlots, setDayTabSlotsForTest } from './dayTabSlots';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0)); // 2026-09-25(금)
});
afterEach(() => {
  vi.useRealTimers();
  setDayTabSlotsForTest(null);
});

const setup = async () => {
  setViewportWidth(390);
  const api = mockApi({
    'GET /schedules': () => json(200, []),
    'GET /categories': () => json(200, CATEGORIES),
    'GET /todos': () => json(200, []),
    'GET /memos': () => json(200, []),
    'GET /ddays': () => json(200, []),
    'GET /dday-marks': () => json(200, []),
    'GET /diaries': () => json(200, []),
    'GET /diaries/2026-09-25': () => problem(404, 'NOT_FOUND', '없음'),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  return { api, ...renderWithStore(<AppShell />, { store }) };
};

const header = () => screen.getByRole('banner', { name: '모바일 머리' });
const menuButton = () => within(header()).getByRole('button', { name: '메뉴' });
const openMenu = async (user: Awaited<ReturnType<typeof setup>>['user']) => {
  await user.click(menuButton());
  return screen.getByRole('dialog', { name: '메뉴' });
};

describe('모바일 ≡ 메뉴 항목 (US-28, MO-02 · D-021·022·049·109)', () => {
  it("머리 '<'(메뉴 닫기) + '메뉴', 항목 순서: Todo · D-Day · 일기 · 메모 → 카테고리 → 설정 및 계정, '오늘'·별도 '설정' 없음", async () => {
    const { user } = await setup();
    const menu = await openMenu(user);
    expect(within(menu).getByRole('heading', { name: '메뉴' })).toBeInTheDocument();
    const names = within(menu)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label') ?? button.textContent?.trim());
    expect(names).toEqual(['메뉴 닫기', 'Todo', 'D-Day', '일기', '메모', '카테고리', '설정 및 계정']);
    expect(within(menu).queryByRole('button', { name: '오늘' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('button', { name: '설정' })).not.toBeInTheDocument();
  });

  it('탭 항목 → 메뉴를 닫고 오늘 날짜 일간의 그 탭(메인 화면, ≡ 머리)으로 연다 (D-049)', async () => {
    const { user, store } = await setup();
    store.dispatch(setViewMode('MONTH'));
    store.dispatch(moveView(2)); // 11월을 보던 중
    await user.click(within(await openMenu(user)).getByRole('button', { name: 'D-Day' }));

    expect(screen.queryByRole('dialog', { name: '메뉴' })).not.toBeInTheDocument();
    const { calendar } = store.getState();
    expect(calendar.viewMode).toBe('DAY');
    expect(calendar.viewDate).toBe('2026-09-25');
    expect(calendar.selectedDate).toBe('2026-09-25');
    expect(calendar.mobileDayTab).toBe('DDAY');
    expect(screen.getByRole('tab', { name: 'D-Day' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'D-Day' })).toBeInTheDocument();
    expect(menuButton()).toHaveFocus();
  });

  it('Todo·일기·메모도 각자 그 탭으로', async () => {
    const { user, store } = await setup();
    for (const [label, key] of [
      ['Todo', 'TODO'],
      ['일기', 'DIARY'],
      ['메모', 'MEMO'],
    ] as const) {
      store.dispatch(openDayView('2026-09-20'));
      await user.click(within(await openMenu(user)).getByRole('button', { name: label }));
      expect(store.getState().calendar.mobileDayTab).toBe(key);
      expect(store.getState().calendar.viewDate).toBe('2026-09-25');
    }
  });

  it('아직 꽂히지 않은 탭은 흐리게·눌리지 않게 (D-040)', async () => {
    const { DIARY: _diary, ...rest } = getDayTabSlots();
    setDayTabSlotsForTest(rest);
    const { user } = await setup();
    const menu = await openMenu(user);
    expect(within(menu).getByRole('button', { name: '일기' })).toBeDisabled();
    expect(within(menu).getByRole('button', { name: '메모' })).toBeEnabled();
  });

  it('카테고리 → 메뉴를 닫고 카테고리 관리 전체 화면 (MO-21)', async () => {
    const { user } = await setup();
    await user.click(within(await openMenu(user)).getByRole('button', { name: '카테고리' }));
    expect(screen.queryByRole('dialog', { name: '메뉴' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '카테고리 관리' })).toBeInTheDocument();
  });

  it("'<'나 Esc로 닫으면 ≡에 초점이 돌아온다", async () => {
    const { user } = await setup();
    await user.click(within(await openMenu(user)).getByRole('button', { name: '메뉴 닫기' }));
    expect(screen.queryByRole('dialog', { name: '메뉴' })).not.toBeInTheDocument();
    expect(menuButton()).toHaveFocus();

    await openMenu(user);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: '메뉴' })).not.toBeInTheDocument();
    expect(menuButton()).toHaveFocus();
  });

  it('열리면 첫 항목에 초점이 간다 (메뉴 닫기)', async () => {
    const { user } = await setup();
    const menu = await openMenu(user);
    expect(within(menu).getByRole('button', { name: '메뉴 닫기' })).toHaveFocus();
  });

  it("일기 탭에서 쓰던 중이면 탭 항목을 눌렀을 때 '작성을 취소할까요?'를 먼저 묻는다 (06 일기 작성 취소)", async () => {
    const { user, store } = await setup();
    store.dispatch(openDayView('2026-09-25'));
    store.dispatch(setMobileDayTab('DIARY'));
    const panel = await screen.findByRole('tabpanel', { name: '일기' });
    await waitFor(() => expect(within(panel).getByRole('textbox', { name: '일기 내용' })).toBeEnabled());
    await user.type(within(panel).getByRole('textbox', { name: '일기 내용' }), '쓰던 글');

    await user.click(within(await openMenu(user)).getByRole('button', { name: 'Todo' }));
    const confirm = screen.getByRole('alertdialog', { name: '작성을 취소할까요?' });
    expect(store.getState().calendar.mobileDayTab).toBe('DIARY');
    await user.click(within(confirm).getByRole('button', { name: '작성 취소' }));
    expect(store.getState().calendar.mobileDayTab).toBe('TODO');
  });
});
