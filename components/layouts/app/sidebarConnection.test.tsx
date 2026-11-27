import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Settings, SidebarItem } from '@/types/api';
import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi, problem, type MockResponse } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';
import { openDayView } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { selectNotices } from '@store/slices/noticeSlice';
import { DEFAULT_SETTINGS, fetchSettings } from '@store/slices/settingsSlice';
import { makeStore } from '@store/store';

import AppShell from './AppShell';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0)); // 2026-09-25(금)
});
afterEach(() => vi.useRealTimers());

const items = (...entries: [SidebarItem['type'], boolean][]): SidebarItem[] => entries.map(([type, visible]) => ({ type, visible }));

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
    'GET /diaries/2026-09-25': () => problem(404, 'NOT_FOUND', '없음'),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  await store.dispatch(fetchSettings());
  return { api, ...renderWithStore(<AppShell />, { store }) };
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
    const { user, store } = await setup({ patch: () => problem(500, 'INTERNAL', '실패') });
    const list = await openEditor(user);
    await user.click(within(list).getByRole('checkbox', { name: '메모 표시' }));
    await waitFor(() => expect(within(list).getByRole('checkbox', { name: '메모 표시' })).toBeChecked());
    expect(selectNotices(store.getState()).at(-1)?.message).toBe('설정을 저장하지 못해 이전 값으로 되돌렸어요. 다시 바꿔 주세요.');
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

describe('미니 달력 — 사이드바 맨 위 고정 (US-19, D-013·015)', () => {
  const mini = () => within(sidebar()).getByRole('region', { name: '미니 달력' });

  it('고른 날짜의 달(제목 아래 날짜 이름은 \'23일 (수)\')을 그리고 오늘·고른 날을 표시, 날짜를 누르면 사이드바 기준 날짜가 그날로', async () => {
    const { user, store } = await setup();
    expect(within(mini()).getByRole('heading', { name: '2026년 9월' })).toBeInTheDocument();
    const days = within(mini()).getAllByRole('button');
    expect(days).toHaveLength(30);
    expect(within(mini()).getByRole('button', { name: '25일 (금)' })).toHaveAttribute('aria-current', 'date');
    expect(within(mini()).getByRole('button', { name: '25일 (금)' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(within(mini()).getByRole('button', { name: '23일 (수)' }));
    expect(store.getState().calendar.selectedDate).toBe('2026-09-23');
    expect(within(sidebar()).getByRole('heading', { name: '9월 23일 (수)' })).toBeInTheDocument();
    expect(within(mini()).getByRole('button', { name: '23일 (수)' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('섹션 편집 중에는 숨긴다', async () => {
    const { user } = await setup();
    await user.click(within(sidebar()).getByRole('button', { name: '섹션 편집' }));
    expect(within(sidebar()).queryByRole('region', { name: '미니 달력' })).not.toBeInTheDocument();
  });
});

describe('태블릿 겹침 사이드바 (US-20, D-039)', () => {
  it('바깥(달력 쪽)을 누르면 닫힌다', async () => {
    const { user } = await setup({ width: 820 });
    await user.click(within(screen.getByRole('complementary', { name: '사이드바 (닫힘)' })).getByRole('button', { name: '사이드바 열기' }));
    await user.click(screen.getByTestId('sidebar-backdrop'));
    expect(screen.getByRole('complementary', { name: '사이드바 (닫힘)' })).toBeInTheDocument();
  });

  it('PC 폭에서는 막이 없다 (달력을 그대로 누를 수 있음)', async () => {
    await setup();
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
  });
});

describe('모바일 날짜 시트도 같은 섹션 (US-19·21, MO-01·18 · v1.2.1)', () => {
  const openSheet = async (user: Awaited<ReturnType<typeof setup>>['user']) => {
    await user.click(await within(screen.getByLabelText('월간 달력')).findByRole('button', { name: /^9월 25일 \(금\)/ }));
    return screen.getByRole('region', { name: '9월 25일 (금) 날짜 시트' });
  };

  it('그날 일정·[하루 계획 보기] 아래에 설정 순서의 섹션 (끈 섹션은 빠짐, 일기·메모는 접힘)', async () => {
    const { user } = await setup({ width: 390, settings: { ...DEFAULT_SETTINGS, sidebarItems: items(['MEMO', true], ['TODO', true], ['DDAY', false], ['DIARY', true]) } });
    const sheet = await openSheet(user);
    expect(within(sheet).getByRole('button', { name: '하루 계획 보기' })).toBeInTheDocument();
    expect(within(sheet).getByText('이날 일정이 없어요')).toBeInTheDocument();
    const names = within(sheet).getAllByRole('region').map((r) => r.getAttribute('aria-label'));
    expect(names).toEqual(['메모', 'Todo', '일기']); // 모바일 시트에는 미니 달력이 없다
    expect(within(sheet).getByRole('button', { name: '메모' })).toHaveAttribute('aria-expanded', 'false');
  });

  it("[크게 보기] → 끝까지 올림(MO-18), 다시 누르면 '작게 보기'", async () => {
    const { user } = await setup({ width: 390 });
    const sheet = await openSheet(user);
    const expand = within(sheet).getByRole('button', { name: '크게 보기' });
    await user.click(expand);
    expect(sheet).toHaveAttribute('data-expanded', 'true');
    await user.click(within(sheet).getByRole('button', { name: '작게 보기' }));
    expect(sheet).toHaveAttribute('data-expanded', 'false');
  });

  it('시트에서도 [섹션 편집] → 편집 행, 바꾸면 저장', async () => {
    const { user, api } = await setup({ width: 390 });
    const sheet = await openSheet(user);
    await user.click(within(sheet).getByRole('button', { name: '섹션 편집' }));
    const list = within(sheet).getByRole('list', { name: '섹션 편집' });
    await user.click(within(list).getByRole('checkbox', { name: 'D-Day 표시' }));
    expect(lastPatch(api)).toEqual({ sidebarItems: items(['TODO', true], ['DDAY', false], ['DIARY', true], ['MEMO', true]) });
    await user.click(within(sheet).getByRole('button', { name: '완료' }));
    expect(within(sheet).queryByRole('region', { name: 'D-Day' })).not.toBeInTheDocument();
  });
});
