import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DdayMark } from '@/types/api';
import { ddayFixture } from '@/test/ddayFixtures';
import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { SEED_SCHEDULES } from '@/test/seed';
import { setResizeHeight } from '@/test/viewport';
import { openDayView, selectDate, setViewMode } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import CalendarDaily from './daily/CalendarDaily';
import CalendarMonthly from './monthly/CalendarMonthly';
import { ddayChipsByDate } from './utils/ddayMarkUtils';
import CalendarWeekly from './weekly/CalendarWeekly';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0)); // 2026-09-25(금)
});
afterEach(() => vi.useRealTimers());

const DDAYS = [ddayFixture({ id: 1, title: '기말 시험' }), ddayFixture({ id: 2, title: '만난 날', countType: 'COUNTUP' })];
const MARKS: DdayMark[] = [
  { ddayId: 1, date: '2026-09-25', label: 'D-3', kind: 'LAST_DAYS' },
  { ddayId: 2, date: '2026-09-25', label: '100일', kind: 'INTERVAL' },
  { ddayId: 1, date: '2026-09-28', label: 'D-Day', kind: 'TARGET' },
];

const prepare = async () => {
  const api = mockApi({
    'GET /schedules': () => json(200, SEED_SCHEDULES),
    'GET /categories': () => json(200, CATEGORIES),
    'GET /todos': () => json(200, []),
    'GET /ddays': () => json(200, DDAYS),
    'GET /dday-marks': () => json(200, MARKS),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  return { api, store, onOpenDday: vi.fn() };
};

describe('D-Day 표시 묶기 (US-23, D-043: 서버 label 그대로)', () => {
  it('날짜별로 서버 순서대로 묶고, 제목은 목록에서 찾는다', () => {
    const byDate = ddayChipsByDate(MARKS, DDAYS);
    expect(byDate.get('2026-09-25')?.map((chip) => `${chip.label} ${chip.title}`)).toEqual(['D-3 기말 시험', '100일 만난 날']);
    expect(byDate.get('2026-09-28')?.[0]).toMatchObject({ ddayId: 1, label: 'D-Day', title: '기말 시험' });
  });

  it('목록에 아직 없는 D-Day는 제목 없이 라벨만', () => {
    expect(ddayChipsByDate([{ ddayId: 9, date: '2026-09-25', label: 'D-1', kind: 'DAILY' }], []).get('2026-09-25')?.[0].title).toBe('');
  });
});

describe('월간 달력 D-Day 표시 (US-23, 06 달력 표시)', () => {
  it('보이는 기간으로 GET /dday-marks, 칸 맨 위에 "D-3 제목" 칩, 누르면 그 D-Day 수정', async () => {
    const { api, store, onOpenDday } = await prepare();
    const { user } = renderWithStore(<CalendarMonthly variant="bars" onOpenSchedule={vi.fn()} onOpenDday={onOpenDday} />, { store });
    await waitFor(() => expect(api.calls('GET /dday-marks')).toHaveLength(1));
    expect(api.calls('GET /dday-marks')[0].query.toString()).toBe('from=2026-08-30&to=2026-10-03');

    const chip = await screen.findByRole('button', { name: 'D-3 기말 시험' });
    expect(screen.getByRole('button', { name: '100일 만난 날' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'D-Day 기말 시험' })).toBeInTheDocument();
    // 칩이 그날 일정 막대보다 위
    const cellButtons = within(chip.parentElement as HTMLElement).getAllByRole('button');
    expect(cellButtons.indexOf(chip)).toBeLessThan(cellButtons.findIndex((b) => /치과/.test(b.textContent ?? '')));

    await user.click(chip);
    expect(onOpenDday).toHaveBeenCalledWith(1);
  });

  it('칸에 다 안 들어가면 D-Day도 "+n 더보기"에 포함하고, 작은 창에도 보인다', async () => {
    setResizeHeight(400); // 5줄 × 80px → 2칸
    const { store, onOpenDday } = await prepare();
    const { user } = renderWithStore(<CalendarMonthly variant="bars" onOpenSchedule={vi.fn()} onOpenDday={onOpenDday} />, { store });
    // 25일: D-Day 2 + 일정 4 = 6 → 1개 + '+5'
    const more = await screen.findByRole('button', { name: '+5 더보기' });
    await user.click(more);
    const popover = screen.getByRole('dialog', { name: '9월 25일 (금) 일정' });
    await user.click(within(popover).getByRole('button', { name: '100일 만난 날' }));
    expect(onOpenDday).toHaveBeenCalledWith(2);
  });

  it('모바일(색 점): 칸에는 라벨만, 날짜 버튼 접근 이름에 제목 포함', async () => {
    const { store } = await prepare();
    renderWithStore(<CalendarMonthly variant="dots" onOpenSchedule={vi.fn()} />, { store });
    const cell = await screen.findByRole('button', { name: '9월 28일 (월), D-Day 기말 시험' });
    expect(cell).toHaveTextContent('D-Day');
    expect(cell).not.toHaveTextContent('기말 시험');
    expect(await screen.findByRole('button', { name: '9월 25일 (금), D-3 기말 시험, 100일 만난 날, 일정 4개' })).toBeInTheDocument();
  });
});

describe('주간·일간 D-Day 표시 (US-23, 06 달력 표시: 종일 영역 맨 위)', () => {
  it('주간: 그 주 기간으로 받고 종일 줄 맨 위에 칩, 누르면 수정', async () => {
    const { api, store, onOpenDday } = await prepare();
    store.dispatch(selectDate('2026-09-25'));
    store.dispatch(setViewMode('WEEK'));
    const { user } = renderWithStore(<CalendarWeekly variant="pc" onOpenSchedule={vi.fn()} onOpenDday={onOpenDday} />, { store });
    await waitFor(() => expect(api.calls('GET /dday-marks')).toHaveLength(1));
    expect(api.calls('GET /dday-marks')[0].query.toString()).toBe('from=2026-09-20&to=2026-09-26');
    const allDay = screen.getByRole('region', { name: '종일' });
    await user.click(await within(allDay).findByRole('button', { name: 'D-3 기말 시험' }));
    expect(onOpenDday).toHaveBeenCalledWith(1);
  });

  it('모바일 주간(좁은 칸): 라벨만 보이고 접근 이름에 제목', async () => {
    const { store } = await prepare();
    store.dispatch(selectDate('2026-09-25'));
    store.dispatch(setViewMode('WEEK'));
    renderWithStore(<CalendarWeekly variant="mobile" onOpenSchedule={vi.fn()} />, { store });
    const chip = await within(screen.getByRole('region', { name: '종일' })).findByRole('button', { name: 'D-3 기말 시험' });
    expect(chip).toHaveTextContent(/^D-3$/);
  });

  it('일간: 그날로 받고 종일 줄 맨 위에 같은 칩', async () => {
    const { api, store, onOpenDday } = await prepare();
    store.dispatch(openDayView('2026-09-25'));
    renderWithStore(<CalendarDaily variant="pc" onOpenSchedule={vi.fn()} onOpenDday={onOpenDday} />, { store });
    await waitFor(() => expect(api.calls('GET /dday-marks')).toHaveLength(1));
    expect(api.calls('GET /dday-marks')[0].query.toString()).toBe('from=2026-09-25&to=2026-09-25');
    const allDay = screen.getByRole('region', { name: '종일' });
    expect(await within(allDay).findByRole('button', { name: 'D-3 기말 시험' })).toBeInTheDocument();
    expect(within(allDay).getByRole('button', { name: '100일 만난 날' })).toBeInTheDocument();
  });
});
