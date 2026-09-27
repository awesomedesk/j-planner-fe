import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES, schedule } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { SEED_SCHEDULES } from '@/test/seed';
import { selectDate, setViewMode } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import CalendarWeekly from './CalendarWeekly';

const LONG_TITLE = '스터디 모임 · 자료구조 3장 발표 준비와 질문 정리';
const SCHEDULES = [
  ...SEED_SCHEDULES,
  schedule({ id: 20, title: LONG_TITLE, start: '2026-09-23T19:00:00', end: '2026-09-23T21:00:00', categoryId: 2 }),
  schedule({ id: 21, title: '겹치는 회의', start: '2026-09-25T19:30:00', end: '2026-09-25T20:30:00', categoryId: 3 }),
];

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date', 'setInterval', 'clearInterval'] });
  vi.setSystemTime(new Date(2026, 8, 25, 14, 30)); // 2026-09-25(금) 14:30
});
afterEach(() => vi.useRealTimers());

const setup = async (variant: 'pc' | 'mobile' = 'pc', viewDate?: string) => {
  const api = mockApi({
    'GET /schedules': () => json(200, SCHEDULES),
    'GET /categories': () => json(200, CATEGORIES),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  if (viewDate) store.dispatch(selectDate(viewDate));
  store.dispatch(setViewMode('WEEK')); // 보기를 바꾸면 고른 날짜가 들어 있는 주
  const onOpenSchedule = vi.fn();
  const view = renderWithStore(<CalendarWeekly variant={variant} onOpenSchedule={onOpenSchedule} />, { store });
  return { api, onOpenSchedule, ...view };
};

const column = (label: string) => screen.getByRole('group', { name: `${label} 시간표` });

describe('주간 시간표 (US-07, PC-02)', () => {
  it('그 주(일~토) 일정만 받는다: from=2026-09-20&to=2026-09-26', async () => {
    const { api } = await setup();
    await waitFor(() => expect(api.calls('GET /schedules')).toHaveLength(1));
    expect(api.calls('GET /schedules')[0].query.toString()).toBe('from=2026-09-20&to=2026-09-26');
  });

  it('7일 머리글과 오늘 강조 (CAL-06)', async () => {
    await setup();
    const heads = ['9월 20일 (일)', '9월 21일 (월)', '9월 22일 (화)', '9월 23일 (수)', '9월 24일 (목)', '9월 25일 (금)', '9월 26일 (토)'];
    heads.forEach((name) => expect(screen.getByRole('button', { name })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '9월 25일 (금)' })).toHaveAttribute('aria-current', 'date');
  });

  it('시간 눈금 06:00~23:00 (D-024 기본 표시 시간)', async () => {
    await setup();
    expect(screen.getByText('06:00')).toBeInTheDocument();
    expect(screen.getByText('23:00')).toBeInTheDocument();
    expect(screen.queryByText('05:00')).not.toBeInTheDocument();
  });

  it('종일 줄: 종일 일정은 걸친 날마다, 시간표에는 두지 않는다 (PC-02 ⑤)', async () => {
    await setup();
    const allDay = screen.getByRole('region', { name: '종일' });
    expect(await within(allDay).findAllByRole('button', { name: /가족 여행/ })).toHaveLength(1); // 9/26~27 중 이번 주는 26일(토)만
    expect(within(column('9월 26일 (토)')).queryByRole('button', { name: /가족 여행/ })).not.toBeInTheDocument();
  });

  it('시간 일정은 시각에 맞는 위치·높이 (46px = 1시간)', async () => {
    await setup();
    const block = await within(column('9월 21일 (월)')).findByRole('button', { name: /팀 주간 회의/ });
    const box = block.closest('[data-block]') as HTMLElement;
    expect(box.style.top).toBe(`${(4 * 46).toString()}px`); // 10:00 - 06:00 = 4시간
    expect(box.style.height).toBe('46px');
  });

  it('블록 색: 왼쪽 띠 = 카테고리 색, 몸통 = 일정 색 (D-019)', async () => {
    await setup();
    const block = await within(column('9월 25일 (금)')).findByRole('button', { name: /치과/ });
    const style = block.closest('[data-block-body]')!.getAttribute('style')!;
    expect(style).toMatch(/#2F62A8 0 5px|rgb\(47, 98, 168\) 0(px)? 5px/i);
    expect(style).toMatch(/#3F3F3F 5px|rgb\(63, 63, 63\) 5px/i);
  });

  it('겹치는 일정은 칸을 나눠 나란히', async () => {
    await setup();
    const friday = column('9월 25일 (금)');
    const a = (await within(friday).findByRole('button', { name: /영어 회화/ })).closest('[data-block]') as HTMLElement;
    const b = within(friday).getByRole('button', { name: /겹치는 회의/ }).closest('[data-block]') as HTMLElement;
    expect(a.style.width).toBe('50%');
    expect(b.style.width).toBe('50%');
    expect(a.style.left).not.toBe(b.style.left);
  });

  it('자정을 넘는 일정은 두 날에 나눠 그린다', async () => {
    await setup('pc', '2026-09-29');
    expect(await within(column('9월 29일 (화)')).findByRole('button', { name: /새벽 배포/ })).toBeInTheDocument();
    expect(within(column('9월 30일 (수)')).getByRole('button', { name: /새벽 배포/ })).toBeInTheDocument();
  });

  it('긴 제목은 줄바꿈 후 칸이 부족하면 … (D-023)', async () => {
    await setup();
    const title = (await screen.findByRole('button', { name: new RegExp(LONG_TITLE) })).querySelector('[data-title]') as HTMLElement;
    expect(title.getAttribute('style')).toMatch(/-webkit-line-clamp: 6/); // 2시간 = 92px → 6줄
    expect(title).toHaveTextContent(LONG_TITLE);
  });

  it('블록을 누르면 수정 창, URL은 링크로 새 탭 (D-021)', async () => {
    const { onOpenSchedule, user } = await setup();
    await user.click(await screen.findByRole('button', { name: /팀 주간 회의/ }));
    expect(onOpenSchedule).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    const link = screen.getByRole('link', { name: '팀 주간 회의 링크 열기' });
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('현재 시각 선은 오늘 칸에만, 1분마다 움직인다 (CAL-06)', async () => {
    await setup();
    const line = within(column('9월 25일 (금)')).getByRole('separator', { name: '현재 시각 14:30' });
    expect(line.style.top).toBe(`${(8.5 * 46).toString()}px`);
    expect(within(column('9월 24일 (목)')).queryByRole('separator')).not.toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(within(column('9월 25일 (금)')).getByRole('separator', { name: '현재 시각 14:31' })).toBeInTheDocument();
  });

  it('오늘이 없는 주에는 현재 시각 선이 없다', async () => {
    await setup('pc', '2026-10-01');
    expect(screen.queryByRole('separator', { name: /현재 시각/ })).not.toBeInTheDocument();
  });

  it('처음 열면 현재 시각 1시간 전이 맨 위에 오도록 스크롤', async () => {
    await setup();
    expect(screen.getByTestId('timetable-scroll').scrollTop).toBe(7.5 * 46); // 13:30 - 06:00
  });

  it('날짜 머리글을 한 번 누르면 선택, 두 번 누르면 일간 (D-015, 월간과 같게)', async () => {
    const { store, user } = await setup();
    await user.click(screen.getByRole('button', { name: '9월 23일 (수)' }));
    expect(store.getState().calendar.selectedDate).toBe('2026-09-23');
    await user.dblClick(screen.getByRole('button', { name: '9월 22일 (화)' }));
    expect(store.getState().calendar).toMatchObject({ viewMode: 'DAY', selectedDate: '2026-09-22' });
  });
});

describe('모바일 주간 7칸 시간표 (MO-05)', () => {
  it('같은 7칸, 1시간 = 38px, 눈금은 시만 (6 … 23)', async () => {
    await setup('mobile');
    expect(screen.getByText('6')).toBeInTheDocument();
    const block = await within(column('9월 21일 (월)')).findByRole('button', { name: /팀 주간 회의/ });
    expect((block.closest('[data-block]') as HTMLElement).style.top).toBe(`${4 * 38}px`);
  });

  it('긴 제목 줄 수도 모바일 크기로 (2시간 = 76px → 5줄)', async () => {
    await setup('mobile');
    const title = (await screen.findByRole('button', { name: new RegExp(LONG_TITLE) })).querySelector('[data-title]') as HTMLElement;
    expect(title.getAttribute('style')).toMatch(/-webkit-line-clamp: 5/);
  });
});
