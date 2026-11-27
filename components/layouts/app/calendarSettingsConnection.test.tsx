import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Settings } from '@/types/api';
import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi, problem, type MockResponse } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';
import { fetchCategories } from '@store/slices/categorySlice';
import { DEFAULT_SETTINGS, fetchSettings } from '@store/slices/settingsSlice';
import { selectDarkMode } from '@store/slices/themeSlice';
import { makeStore } from '@store/store';
import { LAST_VIEW_KEY } from '@utils/storage/lastViewStorage';

import AppShell from './AppShell';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0)); // 2026-09-25(금)
});
afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

const setup = async ({ width = 1440, settings = DEFAULT_SETTINGS, patch }: { width?: number; settings?: Settings; patch?: () => MockResponse } = {}) => {
  setViewportWidth(width);
  const api = mockApi({
    'GET /settings': () => json(200, settings),
    'PATCH /settings': patch ?? ((req) => json(200, { ...settings, ...(req.body as object) })),
    'GET /schedules': () => json(200, []),
    'GET /categories': () => json(200, CATEGORIES),
    'GET /todos': () => json(200, []),
    'GET /memos': () => json(200, []),
    'GET /ddays': () => json(200, []),
    'GET /dday-marks': () => json(200, []),
    'GET /diaries': () => json(200, []),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  await store.dispatch(fetchSettings());
  return { api, ...renderWithStore(<AppShell />, { store }) };
};

type User = Awaited<ReturnType<typeof setup>>['user'];
const pcGear = () => within(screen.getByRole('banner', { name: '달력 도구' })).getByRole('button', { name: '설정 및 계정' });
const openFromPcMenu = async (user: User) => {
  await user.click(pcGear());
  await user.click(within(screen.getByRole('dialog', { name: '설정 및 계정' })).getByRole('button', { name: '달력 설정' }));
  return screen.getByRole('region', { name: '달력 설정' });
};
const lastPatch = (api: Awaited<ReturnType<typeof setup>>['api']) => api.calls('PATCH /settings').at(-1)?.body;

describe('달력 설정 패널 — PC (US-26, #396 3dbb81f · v1.3.1)', () => {
  it("⚙ → 설정 및 계정 → '달력 설정' → 메뉴가 닫히고 사이드바 자리에 패널, 제목에 초점", async () => {
    const { user } = await setup();
    const panel = await openFromPcMenu(user);
    expect(screen.queryByRole('dialog', { name: '설정 및 계정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: '사이드바' })).not.toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: '달력 설정' })).toHaveFocus();
    expect(within(panel).getByText('바꾸면 바로 저장되고 달력에 적용돼요.')).toBeInTheDocument();
  });

  it('항목 순서: 주 시작 요일 · 처음 화면 · 시간 표시 · 시간표 칸 · 다크 모드 · 색 테마 · 사이드바 섹션 · 카테고리 관리, 지금 값이 골라져 있다', async () => {
    const { user } = await setup();
    const panel = await openFromPcMenu(user);
    const groups = within(panel).getAllByRole('group').map((group) => group.getAttribute('aria-label') ?? group.querySelector('legend')?.textContent?.trim());
    expect(groups).toEqual(['주 시작 요일', '처음 화면', '시간 표시', '시간표 칸 주·일간 눈금선 간격', '색 테마']);
    expect(within(panel).getByRole('radio', { name: '일요일' })).toBeChecked();
    expect(within(panel).getByRole('radio', { name: '월간' })).toBeChecked();
    expect(within(panel).getByRole('radio', { name: /24시간/ })).toBeChecked();
    expect(within(panel).getByRole('radio', { name: '1시간' })).toBeChecked();
    expect(within(panel).getByRole('switch', { name: '다크 모드' })).not.toBeChecked();
    expect(within(panel).getByRole('radio', { name: '녹색' })).toBeChecked();
    expect(within(panel).getByRole('list', { name: '섹션 편집' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: /카테고리 관리/ })).toBeInTheDocument();
    expect(within(panel).getByRole('radio', { name: /마지막에 본 화면/ })).toHaveAccessibleName('마지막에 본 화면 이 기기에서만');
  });

  it("바꾸면 바로 그 항목만 PATCH, '저장했어요.' (SET-05)", async () => {
    const { user, api, store } = await setup();
    const panel = await openFromPcMenu(user);
    await user.click(within(panel).getByRole('radio', { name: '월요일' }));
    expect(lastPatch(api)).toEqual({ weekStartDay: 'MON' });
    await waitFor(() => expect(within(panel).getByRole('status')).toHaveTextContent('저장했어요.'));
    await user.click(within(panel).getByRole('radio', { name: /마지막에 본 화면/ }));
    expect(lastPatch(api)).toEqual({ startView: 'LAST' });
    await user.click(within(panel).getByRole('radio', { name: /12시간/ }));
    expect(lastPatch(api)).toEqual({ timeFormat: '12H' });
    await user.click(within(panel).getByRole('radio', { name: '30분' }));
    expect(lastPatch(api)).toEqual({ slotMinutes: 30 });
    await user.click(within(panel).getByRole('switch', { name: '다크 모드' }));
    expect(lastPatch(api)).toEqual({ darkMode: true });
    expect(selectDarkMode(store.getState())).toBe(true); // 테마 즉시 반영
    await user.click(within(panel).getByRole('radio', { name: '갈색' }));
    expect(lastPatch(api)).toEqual({ colorTheme: 'BROWN' });
    await user.click(within(panel).getByRole('checkbox', { name: '메모 표시' }));
    expect(lastPatch(api)).toMatchObject({ sidebarItems: expect.arrayContaining([{ type: 'MEMO', visible: false }]) });
  });

  it('저장에 실패하면 값을 되돌리고 패널 위 안내 줄에 알린다', async () => {
    const { user } = await setup({ patch: () => problem(500, 'INTERNAL', '실패') });
    const panel = await openFromPcMenu(user);
    await user.click(within(panel).getByRole('radio', { name: '월요일' }));
    await waitFor(() => expect(within(panel).getByRole('status')).toHaveTextContent('저장하지 못해 이전 값으로 되돌렸어요. 다시 바꿔 주세요.'));
    expect(within(panel).getByRole('radio', { name: '일요일' })).toBeChecked();
  });

  it('× 닫기 → 원래 사이드바로, 초점은 ⚙ · Esc도 같다 (D-117 방식)', async () => {
    const { user } = await setup();
    let panel = await openFromPcMenu(user);
    await user.click(within(panel).getByRole('button', { name: '달력 설정 닫기' }));
    expect(screen.queryByRole('region', { name: '달력 설정' })).not.toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '사이드바' })).toBeInTheDocument();
    expect(pcGear()).toHaveFocus();
    panel = await openFromPcMenu(user);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region', { name: '달력 설정' })).not.toBeInTheDocument();
    expect(pcGear()).toHaveFocus();
  });

  it("‹ 뒤로 → 설정 및 계정 메뉴가 다시 열리고 '달력 설정'에 초점", async () => {
    const { user } = await setup();
    const panel = await openFromPcMenu(user);
    await user.click(within(panel).getByRole('button', { name: '설정 및 계정으로' }));
    const menu = screen.getByRole('dialog', { name: '설정 및 계정' });
    expect(within(menu).getByRole('button', { name: '달력 설정' })).toHaveFocus();
  });

  it('사이드바가 닫혀 있어도 같은 자리에 열리고, 닫으면 닫힌 막대로 (D-024)', async () => {
    const { user } = await setup({ settings: { ...DEFAULT_SETTINGS, sidebarOpen: false } });
    const panel = await openFromPcMenu(user);
    await user.click(within(panel).getByRole('button', { name: '달력 설정 닫기' }));
    expect(screen.getByRole('complementary', { name: '사이드바 (닫힘)' })).toBeInTheDocument();
  });

  it('[카테고리 관리 ›] → 기존 카테고리 관리 창', async () => {
    const { user } = await setup();
    const panel = await openFromPcMenu(user);
    await user.click(within(panel).getByRole('button', { name: /카테고리 관리/ }));
    expect(screen.getByRole('dialog', { name: '카테고리 관리' })).toBeInTheDocument();
  });
});

describe('태블릿 겹침 패널 (820, D-039)', () => {
  it('달력 쪽을 누르면 닫힌다', async () => {
    const { user } = await setup({ width: 820 });
    await openFromPcMenu(user);
    await user.click(screen.getByTestId('calendar-settings-backdrop'));
    expect(screen.queryByRole('region', { name: '달력 설정' })).not.toBeInTheDocument();
  });
});

describe('모바일 달력 설정 화면 (390)', () => {
  const openFromMobile = async (user: User) => {
    await user.click(within(screen.getByRole('banner', { name: '모바일 머리' })).getByRole('button', { name: '설정 및 계정' }));
    await user.click(within(screen.getByRole('dialog', { name: '설정 및 계정' })).getByRole('button', { name: '달력 설정' }));
    return screen.getByRole('dialog', { name: '달력 설정' });
  };

  it("설정 및 계정 화면 → '달력 설정' → 전체 화면, ‹ 뒤로(또는 Esc) → 설정 및 계정 화면의 '달력 설정'에 초점", async () => {
    const { user } = await setup({ width: 390 });
    const screenEl = await openFromMobile(user);
    expect(within(screenEl).getByRole('heading', { name: '달력 설정' })).toHaveFocus();
    expect(within(screenEl).queryByRole('button', { name: '달력 설정 닫기' })).not.toBeInTheDocument(); // 닫기 대신 뒤로
    await user.click(within(screenEl).getByRole('button', { name: '설정 및 계정으로' }));
    expect(within(screen.getByRole('dialog', { name: '설정 및 계정' })).getByRole('button', { name: '달력 설정' })).toHaveFocus();

    await user.click(within(screen.getByRole('dialog', { name: '설정 및 계정' })).getByRole('button', { name: '달력 설정' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: '달력 설정' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('dialog', { name: '설정 및 계정' })).getByRole('button', { name: '달력 설정' })).toHaveFocus();
  });
});

describe("'마지막에 본 화면' 기억 (US-27, D-029)", () => {
  it('보기를 바꾸면 이 브라우저에 기억한다', async () => {
    const { user } = await setup({ width: 390 });
    await user.click(within(screen.getByRole('banner', { name: '모바일 머리' })).getByRole('button', { name: '화면 선택' }));
    await user.click(within(screen.getByRole('listbox', { name: '화면 선택' })).getByRole('option', { name: '목록' }));
    expect(localStorage.getItem(LAST_VIEW_KEY)).toBe('LIST');
  });
});
