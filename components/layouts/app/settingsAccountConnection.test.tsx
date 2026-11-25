import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';
import { rememberAccountReturn, takeAccountReturn } from '@components/auth/account/accountReturnFocus';
import { checkSession } from '@store/slices/authSlice';
import { openDayView } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import AppShell from './AppShell';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});
afterEach(() => {
  vi.useRealTimers();
  takeAccountReturn();
});

const ME = { email: 'qa@example.com', name: '검수', hasPassword: true, loginMethods: ['EMAIL' as const] };
const TRIGGER = '설정 및 계정';

const makeSignedInStore = async () => {
  mockApi({
    'GET /schedules': () => json(200, []),
    'GET /categories': () => json(200, CATEGORIES),
    'GET /memos': () => json(200, []),
    'GET /todos': () => json(200, []),
    'GET /ddays': () => json(200, []),
    'GET /dday-marks': () => json(200, []),
    'GET /diaries': () => json(200, []),
  });
  const store = makeStore();
  store.dispatch(checkSession.fulfilled(ME, 'test'));
  await store.dispatch(fetchCategories());
  return store;
};

const mobileHeader = () => screen.getByRole('banner', { name: '모바일 머리' });

describe('설정 및 계정 진입 버튼 초점·달력 문맥 (D-117, #366)', () => {
  it('모바일: ≡ → [설정 및 계정] → 닫기면 ≡로 초점 (사라진 메뉴 버튼이 아니라 연 버튼)', async () => {
    setViewportWidth(390);
    const { user } = renderWithStore(<AppShell />, { store: await makeSignedInStore() });
    await user.click(within(mobileHeader()).getByRole('button', { name: '메뉴' }));
    await user.click(within(screen.getByRole('dialog', { name: '메뉴' })).getByRole('button', { name: TRIGGER }));
    await user.click(within(screen.getByRole('dialog', { name: TRIGGER })).getByRole('button', { name: '닫기' }));
    expect(within(mobileHeader()).getByRole('button', { name: '메뉴' })).toHaveFocus();
  });

  it('모바일: 머리 ⚙ → Esc로 닫으면 그 ⚙로 초점', async () => {
    setViewportWidth(390);
    const { user } = renderWithStore(<AppShell />, { store: await makeSignedInStore() });
    const gear = within(mobileHeader()).getByRole('button', { name: TRIGGER });
    await user.click(gear);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: TRIGGER })).not.toBeInTheDocument();
    expect(gear).toHaveFocus();
  });

  it('내 계정을 다녀오면 같은 세션의 날짜·보기가 남고, ≡로 들어갔으면 ≡에 초점 (모바일)', async () => {
    setViewportWidth(390);
    const store = await makeSignedInStore();
    store.dispatch(openDayView('2026-09-12'));
    const first = renderWithStore(<AppShell />, { store });
    first.unmount(); // /me로 앱 안 이동

    rememberAccountReturn('menu');
    renderWithStore(<AppShell />, { store });
    expect(store.getState().calendar.viewDate).toBe('2026-09-12');
    expect(store.getState().calendar.viewMode).toBe('DAY');
    expect(within(mobileHeader()).getByRole('button', { name: '메뉴' })).toHaveFocus();
    expect(takeAccountReturn()).toBeNull(); // 한 번만
  });

  it('PC: ⚙로 들어갔으면 돌아온 달력의 헤더 ⚙에 초점', async () => {
    setViewportWidth(1440);
    const store = await makeSignedInStore();
    rememberAccountReturn('gear');
    renderWithStore(<AppShell />, { store });
    const pcHeader = screen.getByRole('banner', { name: '달력 도구' });
    expect(within(pcHeader).getByRole('button', { name: TRIGGER })).toHaveFocus();
  });

  it('≡로 들어갔다가 넓은 폭으로 돌아오면(≡가 안 보임) 헤더 ⚙에 초점', async () => {
    setViewportWidth(1440);
    const store = await makeSignedInStore();
    rememberAccountReturn('menu');
    renderWithStore(<AppShell />, { store });
    const pcHeader = screen.getByRole('banner', { name: '달력 도구' });
    expect(within(pcHeader).getByRole('button', { name: TRIGGER })).toHaveFocus();
  });
});
