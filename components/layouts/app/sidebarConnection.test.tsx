import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Settings, SidebarItem } from '@/types/api';
import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';
import { openDayView } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { DEFAULT_SETTINGS, fetchSettings } from '@store/slices/settingsSlice';
import { makeStore } from '@store/store';

import AppShell from './AppShell';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0)); // 2026-09-25(금)
});
afterEach(() => vi.useRealTimers());

const items = (...entries: [SidebarItem['type'], boolean][]): SidebarItem[] => entries.map(([type, visible]) => ({ type, visible }));

const setup = async ({ width = 1440, settings = DEFAULT_SETTINGS, patch }: { width?: number; settings?: Settings; patch?: () => Response | Promise<Response> } = {}) => {
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
    'GET /diaries/2026-09-25': () => problem(404, 'NOT_FOUND', '없음'),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  await store.dispatch(fetchSettings());
  return { api, store, ...renderWithStore(<AppShell />, { store }) };
};

const sidebar = () => screen.getByRole('complementary', { name: '사이드바' });
const sectionNames = () =>
  within(sidebar())
    .queryAllByRole('region')
    .map((region) => region.getAttribute('aria-label'))
    .filter((name) => name !== '미니 달력');

const lastPatch = (api: Awaited<ReturnType<typeof setup>>['api']) => api.calls('PATCH /settings').at(-1)?.body;

describe('사이드바 섹션 — 설정 순서·표시를 따른다 (US-19·21, D-013·024)', () => {
  it('설정의 순서대로, 끈 섹션은 빼고 그린다', async () => {
    await setup({ settings: { ...DEFAULT_SETTINGS, sidebarItems: items(['MEMO', true], ['TODO', true], ['DDAY', false], ['DIARY', true]) } });
    expect(sectionNames()).toEqual(['메모', 'Todo', '일기']);
  });

  it('처음엔 Todo·D-Day를 펼치고 일기·메모는 접는다 (v1.2). 섹션 제목을 누르면 접기·펼치기', async () => {
    const { user } = await setup();
    const heading = (name: string) => within(sidebar()).getByRole('button', { name });
    expect(heading('Todo')).toHaveAttribute('aria-expanded', 'true');
    expect(heading('D-Day')).toHaveAttribute('aria-expanded', 'true');
    expect(heading('일기')).toHaveAttribute('aria-expanded', 'false');
    expect(heading('메모')).toHaveAttribute('aria-expanded', 'false');
    await user.click(heading('메모'));
    expect(heading('메모')).toHaveAttribute('aria-expanded', 'true');
    expect(heading('메모')).toHaveFocus();
  });
});

describe('섹션 편집 (US-21, D-049 · v1.2)', () => {
  const openEditor = async (user: Awaited<ReturnType<typeof setup>>['user']) => {
    await user.click(within(sidebar()).getByRole('button', { name: '섹션 편집' }));
    return within(sidebar()).getByRole('list', { name: '섹션 편집' });
  };

  it("머리의 [섹션 편집] → 제목 '섹션 편집'·버튼 '완료', 네 줄(체크박스 + ▲▼), 맨 위 ▲·맨 아래 ▼는 막힘", async () => {
    const { user } = await setup();
    const list = await openEditor(user);
    expect(within(sidebar()).getByRole('heading', { name: '섹션 편집' })).toBeInTheDocument();
    expect(within(sidebar()).getByRole('button', { name: '완료' })).toBeInTheDocument();
    expect(within(list).getAllByRole('checkbox').map((box) => box.getAttribute('aria-label'))).toEqual(['Todo 표시', 'D-Day 표시', '일기 표시', '메모 표시']);
    expect(within(list).getByRole('button', { name: 'Todo 위로' })).toBeDisabled();
    expect(within(list).getByRole('button', { name: '메모 아래로' })).toBeDisabled();
  });

  it('끄기 → 4개 전체를 순서대로 PATCH, 완료하면 그 섹션이 빠진다', async () => {
    const { user, api } = await setup();
    const list = await openEditor(user);
    await user.click(within(list).getByRole('checkbox', { name: '메모 표시' }));
    expect(lastPatch(api)).toEqual({ sidebarItems: items(['TODO', true], ['DDAY', true], ['DIARY', true], ['MEMO', false]) });
    await user.click(within(sidebar()).getByRole('button', { name: '완료' }));
    expect(sectionNames()).toEqual(['Todo', 'D-Day', '일기']);
    expect(within(sidebar()).getByRole('button', { name: '섹션 편집' })).toHaveFocus();
  });

  it('▼ 순서 바꾸기 → PATCH, 누른 버튼에 초점이 남고, 맨 끝으로 가 막히면 반대 버튼으로', async () => {
    const { user, api } = await setup();
    const list = await openEditor(user);
    await user.click(within(list).getByRole('button', { name: 'Todo 아래로' }));
    expect(lastPatch(api)).toEqual({ sidebarItems: items(['DDAY', true], ['TODO', true], ['DIARY', true], ['MEMO', true]) });
    expect(within(list).getByRole('button', { name: 'Todo 아래로' })).toHaveFocus();
    await user.click(within(list).getByRole('button', { name: 'Todo 아래로' }));
    await user.click(within(list).getByRole('button', { name: 'Todo 아래로' }));
    expect(within(list).getByRole('button', { name: 'Todo 아래로' })).toBeDisabled();
    expect(within(list).getByRole('button', { name: 'Todo 위로' })).toHaveFocus();
  });

  it('편집 중 Esc는 편집만 끝낸다', async () => {
    const { user } = await setup();
    await openEditor(user);
    await user.keyboard('{Escape}');
    expect(within(sidebar()).getByRole('button', { name: '섹션 편집' })).toHaveFocus();
    expect(sidebar()).toBeInTheDocument();
  });

  it("모두 끄면 '표시할 섹션이 없어요. 섹션 편집에서 켤 수 있어요.'", async () => {
    await setup({ settings: { ...DEFAULT_SETTINGS, sidebarItems: items(['TODO', false], ['DDAY', false], ['DIARY', false], ['MEMO', false]) } });
    expect(within(sidebar()).getByText('표시할 섹션이 없어요. 섹션 편집에서 켤 수 있어요.')).toBeInTheDocument();
    expect(within(sidebar()).getByRole('button', { name: '섹션 편집' })).toBeInTheDocument();
  });

  it('저장에 실패하면 되돌리고 알린다', async () => {
    const { user } = await setup({ patch: () => problem(500, 'INTERNAL', '실패') });
    const list = await openEditor(user);
    await user.click(within(list).getByRole('checkbox', { name: '메모 표시' }));
    await waitFor(() => expect(within(list).getByRole('checkbox', { name: '메모 표시' })).toBeChecked());
    expect(await screen.findByText('설정을 저장하지 못해 이전 값으로 되돌렸어요. 다시 바꿔 주세요.')).toBeInTheDocument();
  });
});

describe('닫기·막대·열림 기억 (US-20, D-021)', () => {
  it('PC: 닫으면 sidebarOpen=false 저장 + 막대(보이는 섹션만, 설정 순서). 막대의 섹션 → 열고 그 섹션을 펼쳐 제목에 초점, sidebarOpen=true', async () => {
    const { user, api } = await setup({ settings: { ...DEFAULT_SETTINGS, sidebarItems: items(['DIARY', true], ['TODO', true], ['DDAY', false], ['MEMO', true]) } });
    await user.click(within(sidebar()).getByRole('button', { name: '사이드바 닫기' }));
    expect(lastPatch(api)).toEqual({ sidebarOpen: false });
    const rail = screen.getByRole('complementary', { name: '사이드바 (닫힘)' });
    expect(within(rail).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['사이드바 열기', '일기 열기', 'Todo 열기', '메모 열기']);
    await user.click(within(rail).getByRole('button', { name: '메모 열기' }));
    expect(lastPatch(api)).toEqual({ sidebarOpen: true });
    const memo = within(sidebar()).getByRole('button', { name: '메모' });
    expect(memo).toHaveAttribute('aria-expanded', 'true');
    expect(memo).toHaveFocus();
  });

  it('PC: 저장된 sidebarOpen=false면 닫힌 채 시작', async () => {
    await setup({ settings: { ...DEFAULT_SETTINGS, sidebarOpen: false } });
    expect(screen.getByRole('complementary', { name: '사이드바 (닫힘)' })).toBeInTheDocument();
  });

  it('태블릿(820): 저장값과 상관없이 닫힌 채 시작하고, 열고 닫아도 저장하지 않는다 (FE 검토 ③)', async () => {
    const { user, api } = await setup({ width: 820 });
    const rail = screen.getByRole('complementary', { name: '사이드바 (닫힘)' });
    await user.click(within(rail).getByRole('button', { name: '사이드바 열기' }));
    await user.click(within(sidebar()).getByRole('button', { name: '사이드바 닫기' }));
    expect(api.calls('PATCH /settings')).toHaveLength(0);
  });
});

describe('모바일도 같은 설정 (US-21, D-049)', () => {
  it('일간 탭과 ≡ 메뉴가 설정 순서·끄기를 따른다', async () => {
    const { user, store } = await setup({ width: 390, settings: { ...DEFAULT_SETTINGS, sidebarItems: items(['MEMO', true], ['TODO', true], ['DDAY', false], ['DIARY', true]) } });
    store.dispatch(openDayView('2026-09-25'));
    const tabs = await screen.findAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['시간표', '메모', 'Todo', '일기']);
    await user.click(within(screen.getByRole('banner', { name: '모바일 머리' })).getByRole('button', { name: '메뉴' }));
    const menu = screen.getByRole('dialog', { name: '메뉴' });
    const names = within(menu).getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim());
    expect(names).toEqual(['메뉴 닫기', '메모', 'Todo', '일기', '카테고리', '설정 및 계정']);
  });
});
