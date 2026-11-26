import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DdayMark } from '@/types/api';
import { ddayFixture } from '@/test/ddayFixtures';
import { CATEGORIES, todo } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { SEED_SCHEDULES } from '@/test/seed';
import { setViewportWidth } from '@/test/viewport';
import { setViewMode } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import AppShell from './AppShell';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0)); // 2026-09-25(금)
});
afterEach(() => vi.useRealTimers());

const TIMED_TODO = todo({ id: 31, title: '보고서 마감', startDate: '2026-09-24', endDate: '2026-09-24', time: { start: '16:00', durationMinutes: 30 } });
const MARKS: DdayMark[] = [{ ddayId: 1, date: '2026-09-22', label: 'D-3', kind: 'LAST_DAYS' }];

const setup = async (width = 390) => {
  setViewportWidth(width);
  const api = mockApi({
    'GET /schedules': () => json(200, SEED_SCHEDULES),
    'GET /categories': () => json(200, CATEGORIES),
    'GET /todos': (req) => json(200, req.query.get('scheduled') === 'true' ? [TIMED_TODO] : []),
    'GET /memos': () => json(200, []),
    'GET /ddays': () => json(200, [ddayFixture({ id: 1, title: '기말 시험' })]),
    'GET /dday-marks': () => json(200, MARKS),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  return { api, ...renderWithStore(<AppShell />, { store }) };
};

const mobileHeader = () => screen.getByRole('banner', { name: '모바일 머리' });
const mobileTitle = () => within(mobileHeader()).getByRole('heading').textContent;
const pickView = async (user: Awaited<ReturnType<typeof setup>>['user'], label: string) => {
  await user.click(within(mobileHeader()).getByRole('button', { name: '화면 선택' }));
  await user.click(within(screen.getByRole('listbox', { name: '화면 선택' })).getByRole('option', { name: label }));
};
const swipe = (dx: number) => {
  const main = screen.getByRole('main');
  fireEvent.touchStart(main, { touches: [{ clientX: 200, clientY: 300 }] });
  fireEvent.touchEnd(main, { changedTouches: [{ clientX: 200 + dx, clientY: 300 }] });
};

describe('모바일 3일 보기 (US-29, D-025 · MO-20)', () => {
  it("드롭다운 '3일' → 오늘이 맨 왼쪽인 3칸 시간표, 제목 '9월 25일 – 27일'", async () => {
    const { user, store } = await setup();
    await pickView(user, '3일');
    expect(store.getState().calendar.viewMode).toBe('THREE_DAY');
    expect(mobileTitle()).toBe('9월 25일 – 27일');
    expect(within(mobileHeader()).getByRole('button', { name: '화면 선택' })).toHaveTextContent('3일');

    const timetable = screen.getByLabelText('3일 시간표');
    const columns = within(timetable)
      .getAllByRole('group')
      .map((group) => group.getAttribute('aria-label'))
      .filter((name) => name?.endsWith('시간표'));
    expect(columns).toEqual(['9월 25일 (금) 시간표', '9월 26일 (토) 시간표', '9월 27일 (일) 시간표']);
    expect(within(timetable).getByRole('button', { name: '9월 25일 (금)' })).toHaveAttribute('aria-current', 'date');
  });

  it('그 사흘의 일정만 받아 와 시간표·종일 줄에 그린다 (블록 규칙은 주간과 같음, D-025)', async () => {
    const { api, user } = await setup();
    await pickView(user, '3일');
    const timetable = screen.getByLabelText('3일 시간표');
    expect(await within(timetable).findByRole('button', { name: /치과/ })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: '종일' })).getByRole('button', { name: /가족 여행/ })).toBeInTheDocument();
    expect(within(timetable).queryByRole('button', { name: /팀 주간 회의/ })).not.toBeInTheDocument(); // 21일
    await waitFor(() => expect(api.calls('GET /schedules').at(-1)?.query.toString()).toBe('from=2026-09-25&to=2026-09-27'));
  });

  it('왼쪽으로 밀면 하루 뒤, 오른쪽으로 밀면 하루 앞 (24~26 ↔ 25~27), 오늘로 돌아오기', async () => {
    const { user } = await setup();
    await pickView(user, '3일');
    swipe(-120);
    expect(mobileTitle()).toBe('9월 26일 – 28일');
    swipe(120);
    swipe(120);
    expect(mobileTitle()).toBe('9월 24일 – 26일');
    const today = within(mobileHeader()).getByRole('button', { name: '오늘' });
    await user.click(today);
    expect(mobileTitle()).toBe('9월 25일 – 27일');
  });

  it('날짜 머리글을 두 번 누르면 그날 일간 (주간과 같게, D-015)', async () => {
    const { user, store } = await setup();
    await pickView(user, '3일');
    await user.dblClick(within(screen.getByLabelText('3일 시간표')).getByRole('button', { name: '9월 26일 (토)' }));
    expect(store.getState().calendar).toMatchObject({ viewMode: 'DAY', viewDate: '2026-09-26' });
  });
});

describe('모바일 목록 보기 (US-29, D-022 · MO-19)', () => {
  const listView = () => screen.getByRole('region', { name: '목록 보기' });
  const daySection = (name: string) => within(listView()).getByRole('region', { name });

  it("드롭다운 '목록' → 그 주 7일을 요일별로, 제목은 주 기간", async () => {
    const { user, store } = await setup();
    await pickView(user, '목록');
    expect(store.getState().calendar.viewMode).toBe('LIST');
    expect(mobileTitle()).toBe('9월 20일 – 26일');
    const days = within(listView()).getAllByRole('region').map((section) => section.getAttribute('aria-label'));
    expect(days).toEqual([
      '9월 20일 (일)',
      '9월 21일 (월)',
      '9월 22일 (화)',
      '9월 23일 (수)',
      '9월 24일 (목)',
      '9월 25일 (금)',
      '9월 26일 (토)',
    ]);
    expect(within(daySection('9월 25일 (금)')).getByRole('heading')).toHaveTextContent('오늘');
  });

  it('날마다 일정과 시간 지정 Todo를 시간순으로 (일간 Todo 탭의 그날 일정과 같은 모양, D-022), 없는 날은 안내', async () => {
    const { user } = await setup();
    await pickView(user, '목록');
    const friday = daySection('9월 25일 (금)');
    await waitFor(() => expect(within(friday).getAllByRole('listitem')).toHaveLength(4));
    expect(within(friday).getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      expect.stringMatching(/07:00.*08:00.*헬스장/),
      expect.stringMatching(/14:30.*15:00.*치과/),
      expect.stringMatching(/19:00.*20:00.*영어 회화/),
      expect.stringMatching(/20:30.*22:00.*저녁 약속/),
    ]);
    expect(within(daySection('9월 24일 (목)')).getByRole('listitem')).toHaveTextContent(/16:00.*16:30.*보고서 마감.*Todo/);
    expect(within(daySection('9월 26일 (토)')).getByRole('listitem')).toHaveTextContent(/종일.*가족 여행/);
    expect(within(daySection('9월 23일 (수)')).getByText('일정이 없어요')).toBeInTheDocument();
  });

  it('D-Day 칩도 그날에 보인다 (06 달력 표시: 모바일 목록도 같은 칩)', async () => {
    const { user } = await setup();
    await pickView(user, '목록');
    expect(await within(daySection('9월 22일 (화)')).findByRole('button', { name: 'D-3 기말 시험' })).toBeInTheDocument();
  });

  it('일정을 누르면 일정 수정 창', async () => {
    const { user } = await setup();
    await pickView(user, '목록');
    await user.click(await within(daySection('9월 25일 (금)')).findByRole('button', { name: /치과/ }));
    expect(screen.getByRole('dialog', { name: '일정 수정' })).toBeInTheDocument();
  });

  it('날짜 머리를 누르면 그날 일간 (하루 계획)', async () => {
    const { user, store } = await setup();
    await pickView(user, '목록');
    await user.click(within(daySection('9월 23일 (수)')).getByRole('button', { name: '9월 23일 (수) 하루 계획 보기' }));
    expect(store.getState().calendar).toMatchObject({ viewMode: 'DAY', viewDate: '2026-09-23', selectedDate: '2026-09-23' });
  });

  it('왼쪽으로 밀면 다음 주, 오른쪽으로 밀면 지난주', async () => {
    const { user } = await setup();
    await pickView(user, '목록');
    swipe(-120);
    expect(mobileTitle()).toBe('9월 27일 – 10월 3일');
    swipe(120);
    swipe(120);
    expect(mobileTitle()).toBe('9월 13일 – 19일');
  });
});

describe('넓은 폭에서 3일·목록 (US-29 모바일 전용)', () => {
  it('3일·목록을 고른 채 태블릿·PC 폭이면 주간 시간표로 보이고 PC 버튼은 주가 눌린 상태', async () => {
    const store = makeStore();
    setViewportWidth(1440);
    mockApi({
      'GET /schedules': () => json(200, SEED_SCHEDULES),
      'GET /categories': () => json(200, CATEGORIES),
      'GET /todos': () => json(200, []),
      'GET /memos': () => json(200, []),
      'GET /ddays': () => json(200, []),
      'GET /dday-marks': () => json(200, []),
    });
    await store.dispatch(fetchCategories());
    store.dispatch(setViewMode('LIST'));
    renderWithStore(<AppShell />, { store });
    expect(screen.getByLabelText('주간 시간표')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '목록 보기' })).not.toBeInTheDocument();
    const pcHeader = screen.getByRole('banner', { name: '달력 도구' });
    expect(within(pcHeader).getByRole('button', { name: '주' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(pcHeader).getByRole('heading')).toHaveTextContent('9월 20일 – 26일');
  });
});
