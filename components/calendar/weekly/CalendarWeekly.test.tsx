import type { ComponentProps } from 'react';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES, schedule } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { SEED_SCHEDULES } from '@/test/seed';
import { goToday, moveView, selectDate, setTimetableTopMinutes, setViewMode } from '@store/slices/calendarSlice';
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

const setup = async (
  variant: 'pc' | 'mobile' = 'pc',
  viewDate?: string,
  schedules = SCHEDULES,
  extra: Partial<ComponentProps<typeof CalendarWeekly>> = {}
) => {
  const api = mockApi({
    'GET /schedules': () => json(200, schedules),
    'GET /categories': () => json(200, CATEGORIES),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  if (viewDate) store.dispatch(selectDate(viewDate));
  store.dispatch(setViewMode('WEEK')); // 보기를 바꾸면 고른 날짜가 들어 있는 주
  const onOpenSchedule = vi.fn();
  const view = renderWithStore(<CalendarWeekly variant={variant} onOpenSchedule={onOpenSchedule} {...extra} />, { store });
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

  it('시간 눈금은 항상 00:00~23:00 (D-046)', async () => {
    await setup();
    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByText('23:00')).toBeInTheDocument();
    expect(screen.queryByText('24:00')).not.toBeInTheDocument();
  });

  it('종일 줄: 종일 일정은 걸친 날마다, 시간표에는 두지 않는다 (PC-02 ⑤)', async () => {
    await setup();
    const allDay = screen.getByRole('region', { name: '종일' });
    expect(await within(allDay).findAllByRole('button', { name: /가족 여행/ })).toHaveLength(1); // 9/26~27 중 이번 주는 26일(토)만
    expect(within(column('9월 26일 (토)')).queryByRole('button', { name: /가족 여행/ })).not.toBeInTheDocument();
  });

  describe('종일 줄 (D-052)', () => {
    const TRIP = schedule({ id: 40, title: '출장', allDay: true, start: '2026-09-22T00:00:00', end: '2026-09-24T23:59:59' });
    const CONT = schedule({ id: 42, title: '지난주부터', allDay: true, start: '2026-09-18T00:00:00', end: '2026-09-21T23:59:59' });
    const allDayRow = () => screen.getByRole('region', { name: '종일' });
    // 종일 줄 칸: 1열 = '종일' 글자, 2열 = 20일(일) … 8열 = 26일(토)

    it('여러 날 종일 일정은 이어진 막대 하나, 제목은 한 번 (22~24일 = 4~6열)', async () => {
      await setup('pc', undefined, [TRIP]);
      const bars = await within(allDayRow()).findAllByRole('button', { name: '출장' });
      expect(bars).toHaveLength(1);
      expect(bars[0].style.gridColumn).toBe('4 / span 3');
      expect(within(column('9월 23일 (수)')).queryByRole('button', { name: /출장/ })).not.toBeInTheDocument();
    });

    it('지난주부터 이어지면 이번 주 일요일부터, 이어짐 표시', async () => {
      await setup('pc', undefined, [CONT]);
      const bar = await within(allDayRow()).findByRole('button', { name: '지난주부터' });
      expect(bar.style.gridColumn).toBe('2 / span 2');
      expect(bar).toHaveAttribute('data-continues-before');
    });

    it('막대를 누르면 그 일정 수정 창', async () => {
      const { onOpenSchedule, user } = await setup('pc', undefined, [TRIP]);
      await user.click(await within(allDayRow()).findByRole('button', { name: '출장' }));
      expect(onOpenSchedule).toHaveBeenCalledWith(expect.objectContaining({ id: 40 }));
    });

    it("모바일 7칸도 이어진 막대, 글자는 '…' 없이 칸 끝에서 자른다", async () => {
      await setup('mobile', undefined, [TRIP]);
      const bar = await within(allDayRow()).findByRole('button', { name: '출장' });
      expect(bar.style.gridColumn).toBe('4 / span 3');
      expect(bar).not.toHaveClass('truncate');
      expect(bar).toHaveClass('text-clip');
    });

    it("3줄까지만, 넘으면 그날 '+n' → 누르면 그날 종일 일정 전부", async () => {
      const MANY = [1, 2, 3, 4, 5].map((n) =>
        schedule({ id: 60 + n, title: `QA ${n}`, allDay: true, start: '2026-09-23T00:00:00', end: '2026-09-23T23:59:59' })
      );
      const { user, onOpenSchedule } = await setup('pc', undefined, MANY);
      await within(allDayRow()).findAllByRole('button', { name: /^QA/ });
      expect(within(allDayRow()).getAllByRole('button', { name: /^QA/ })).toHaveLength(3);
      await user.click(within(allDayRow()).getByRole('button', { name: '9월 23일 (수) 종일 일정 2개 더 보기' }));
      const list = screen.getByRole('dialog', { name: '9월 23일 (수) 종일' });
      expect(within(list).getAllByRole('button', { name: /^QA/ }).map((b) => b.textContent)).toEqual(['QA 1', 'QA 2', 'QA 3', 'QA 4', 'QA 5']);
      await user.click(within(list).getByRole('button', { name: 'QA 5' }));
      expect(onOpenSchedule).toHaveBeenCalledWith(expect.objectContaining({ id: 65 }));
    });
  });

  it('시간 일정은 시각에 맞는 위치·높이 (46px = 1시간)', async () => {
    await setup();
    const block = await within(column('9월 21일 (월)')).findByRole('button', { name: /팀 주간 회의/ });
    const box = block.closest('[data-block]') as HTMLElement;
    expect(box.style.top).toBe(`${10 * 46}px`); // 00:00부터 10시간
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
    expect(line.style.top).toBe(`${14.5 * 46}px`);
    expect(within(column('9월 24일 (목)')).queryByRole('separator')).not.toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(within(column('9월 25일 (금)')).getByRole('separator', { name: '현재 시각 14:31' })).toBeInTheDocument();
  });

  it('오늘이 없는 주에는 현재 시각 선이 없다', async () => {
    await setup('pc', '2026-10-01');
    expect(screen.queryByRole('separator', { name: /현재 시각/ })).not.toBeInTheDocument();
  });

  // 시간표 위 여백 8px → HH:mm 선의 실제 위치 = 8 + 시간 × 46
  describe('처음 보이는 위치 (D-046, 화면 높이 600px)', () => {
    beforeEach(() => {
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600);
    });
    afterEach(() => vi.restoreAllMocks());
    const scrollTop = () => screen.getByTestId('timetable-scroll').scrollTop;

    it('오늘이 있는 주: 현재 시각(14:30)이 가운데', async () => {
      await setup();
      expect(scrollTop()).toBe(8 + 14.5 * 46 - 300);
    });

    it('늦은 밤(23:50)이라 가운데로 못 오면 끝까지만', async () => {
      vi.setSystemTime(new Date(2026, 8, 25, 23, 50));
      await setup();
      expect(scrollTop()).toBe(24 * 46 + 8 - 600);
    });

    it('오늘이 없는 주: 일정을 받은 뒤 가장 이른 일정이 위쪽에 1시간 여유 (화 09시·목 19시 → 08시)', async () => {
      await setup('pc', '2026-10-06', [
        schedule({ id: 30, title: '목 저녁', start: '2026-10-08T19:00:00', end: '2026-10-08T20:00:00' }),
        schedule({ id: 31, title: '화 회의', start: '2026-10-06T09:00:00', end: '2026-10-06T10:00:00' }),
      ]);
      await waitFor(() => expect(scrollTop()).toBe(8 * 46)); // 08:00 선이 맨 위 + 눈금 글자가 잘리지 않게 8px 여유
    });

    it('일간에서 주간으로 오면 보던 시간(08:00)이 그대로 맨 위 (D-046 ②)', async () => {
      const api = mockApi({ 'GET /schedules': () => json(200, SCHEDULES), 'GET /categories': () => json(200, CATEGORIES) });
      const store = makeStore();
      store.dispatch(setViewMode('DAY'));
      store.dispatch(setTimetableTopMinutes(480));
      store.dispatch(setViewMode('WEEK'));
      renderWithStore(<CalendarWeekly variant="pc" onOpenSchedule={vi.fn()} />, { store });
      expect(scrollTop()).toBe(8 * 46);
      expect(api.calls('GET /schedules')).toHaveLength(1);
    });

    it('‹ ›로 다음 주에 가도 보던 시간 그대로 (D-046 ②)', async () => {
      const { store } = await setup();
      const scroller = screen.getByTestId('timetable-scroll');
      scroller.scrollTop = 10 * 46;
      fireEvent.scroll(scroller);
      act(() => { store.dispatch(moveView(1)); });
      expect(screen.getByRole('button', { name: '10월 2일 (금)' })).toBeInTheDocument();
      expect(screen.getByTestId('timetable-scroll').scrollTop).toBe(10 * 46);
    });

    it("'오늘'을 누르면 현재 시각이 다시 가운데", async () => {
      const { store } = await setup();
      act(() => { store.dispatch(moveView(2)); });
      const scroller = screen.getByTestId('timetable-scroll');
      scroller.scrollTop = 0;
      fireEvent.scroll(scroller);
      act(() => { store.dispatch(goToday('2026-09-25')); });
      expect(screen.getByTestId('timetable-scroll').scrollTop).toBe(8 + 14.5 * 46 - 300);
    });

    it('스크롤하면 보던 시간(분)을 기억한다', async () => {
      const { store } = await setup();
      const scroller = screen.getByTestId('timetable-scroll');
      scroller.scrollTop = 10 * 46;
      fireEvent.scroll(scroller);
      expect(store.getState().calendar.timetableTopMinutes).toBe(600);
    });

    it('오늘도 일정도 없는 주: 현재 시각이 가운데', async () => {
      await setup('pc', '2026-10-06', []);
      await waitFor(() => expect(scrollTop()).toBe(8 + 14.5 * 46 - 300));
    });
  });

  it('시간표 스크롤바 폭만큼 머리글·종일 줄도 비워 세로선을 맞춘다 (US-07 검수)', async () => {
    // 스크롤바가 항상 보이는 환경: 바깥 폭 1000, 안쪽 폭 985 → 스크롤바 15px
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(985);
    await setup();
    const head = screen.getByRole('button', { name: '9월 20일 (일)' }).parentElement as HTMLElement;
    expect(head.style.paddingRight).toBe('15px');
    expect(screen.getByRole('region', { name: '종일' }).style.paddingRight).toBe('15px');
    vi.restoreAllMocks();
  });

  it('스크롤바가 겹쳐 뜨는 환경(폭 0)이면 비우지 않는다', async () => {
    await setup();
    expect(screen.getByRole('region', { name: '종일' }).style.paddingRight).toBe('0px');
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
  it('같은 7칸, 1시간 = 38px, 눈금은 시만 (0 … 23)', async () => {
    await setup('mobile');
    expect(screen.getByText('0')).toBeInTheDocument();
    const block = await within(column('9월 21일 (월)')).findByRole('button', { name: /팀 주간 회의/ });
    expect((block.closest('[data-block]') as HTMLElement).style.top).toBe(`${10 * 38}px`);
  });

  it('모바일 7칸에서는 링크 아이콘을 숨긴다 — 수정 창에서 연다 (D-045)', async () => {
    await setup('mobile');
    expect(await screen.findByRole('button', { name: /팀 주간 회의/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '팀 주간 회의 링크 열기' })).not.toBeInTheDocument();
  });

  it('긴 제목 줄 수도 모바일 크기로 (2시간 = 76px → 5줄)', async () => {
    await setup('mobile');
    const title = (await screen.findByRole('button', { name: new RegExp(LONG_TITLE) })).querySelector('[data-title]') as HTMLElement;
    expect(title.getAttribute('style')).toMatch(/-webkit-line-clamp: 5/);
  });
});

describe('빈 시간 눌러 빠른 추가 (US-10, D-021)', () => {
  // jsdom은 칸 위치가 모두 0이라 clientY가 곧 시간표 맨 위에서 잰 거리 (주간 PC 1시간 = 46px)
  it('주간 칸의 빈 시간을 누르면 그날·30분 단위 시각으로 빠른 추가를 연다', async () => {
    const onAddAt = vi.fn();
    await setup('pc', undefined, SCHEDULES, { onAddAt });
    fireEvent.click(column('9월 24일 (목)'), { clientY: 14 * 46 + 30 });
    expect(onAddAt).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-09-24', startTime: '14:30' })); // 30분 단위 (D-053)
  });

  it('일정 블록을 누르면 빠른 추가가 아니라 수정 (블록 클릭 유지)', async () => {
    const onAddAt = vi.fn();
    const { user, onOpenSchedule } = await setup('pc', undefined, SCHEDULES, { onAddAt });
    const [block] = await within(column('9월 25일 (금)')).findAllByRole('button');
    await user.click(block);
    expect(onOpenSchedule).toHaveBeenCalled();
    expect(onAddAt).not.toHaveBeenCalled();
  });

  it('임시 블록(점선)은 그날 칸에만, 그 시각 자리에 (D-017)', async () => {
    await setup('pc', undefined, SCHEDULES, { draft: { date: '2026-09-24', startTime: '14:00', endTime: '15:00', title: '' } });
    const draft = within(column('9월 24일 (목)')).getByTestId('draft-block');
    expect(draft).toHaveTextContent('(제목 없음) · 14:00-15:00');
    expect(draft).toHaveStyle({ top: `${14 * 46}px`, height: '46px' });
    expect(within(column('9월 25일 (금)')).queryByTestId('draft-block')).not.toBeInTheDocument();
  });
});
