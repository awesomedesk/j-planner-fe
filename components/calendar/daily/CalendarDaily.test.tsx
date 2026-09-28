import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES, schedule } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { SEED_SCHEDULES } from '@/test/seed';
import { openDayView, setTimetableTopMinutes, setViewMode } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import CalendarDaily from './CalendarDaily';

const LONG_TITLE = '스터디 모임 · 자료구조 3장 발표 준비와 질문 정리, 다음 주 과제 나누기';
const SCHEDULES = [
  ...SEED_SCHEDULES,
  schedule({ id: 20, title: LONG_TITLE, start: '2026-09-25T09:00:00', end: '2026-09-25T11:00:00', categoryId: 2 }),
  schedule({
    id: 21,
    title: '겹치는 회의',
    start: '2026-09-25T19:30:00',
    end: '2026-09-25T20:30:00',
    categoryId: 3,
    location: { name: '회의실 A', latitude: null, longitude: null },
  }),
  schedule({ id: 22, title: '3일 출장', allDay: true, start: '2026-09-24T00:00:00', end: '2026-09-26T23:59:59', categoryId: 3 }),
];

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date', 'setInterval', 'clearInterval'] });
  vi.setSystemTime(new Date(2026, 8, 25, 14, 30)); // 2026-09-25(금) 14:30
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const setup = async (variant: 'pc' | 'mobile' = 'pc', date = '2026-09-25', schedules = SCHEDULES) => {
  const api = mockApi({
    'GET /schedules': () => json(200, schedules),
    'GET /categories': () => json(200, CATEGORIES),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  store.dispatch(openDayView(date)); // 월간에서 두 번 눌러 들어온 것과 같음
  const onOpenSchedule = vi.fn();
  const view = renderWithStore(<CalendarDaily variant={variant} onOpenSchedule={onOpenSchedule} />, { store });
  return { api, onOpenSchedule, ...view };
};

const timetable = () => screen.getByRole('group', { name: /시간표$/ });
const blockBox = (el: HTMLElement) => el.closest('[data-block]') as HTMLElement;

describe('일간 시간표 (US-08, PC-03)', () => {
  it('그날 일정만 받는다: from=to=2026-09-25', async () => {
    const { api } = await setup();
    await waitFor(() => expect(api.calls('GET /schedules')).toHaveLength(1));
    expect(api.calls('GET /schedules')[0].query.toString()).toBe('from=2026-09-25&to=2026-09-25');
  });

  it('시간표는 00:00~23:00 눈금, 1시간 = 48px (D-046)', async () => {
    await setup();
    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByText('23:00')).toBeInTheDocument();
    const gym = await within(timetable()).findByRole('button', { name: /헬스장/ });
    expect(blockBox(gym).style.top).toBe(`${7 * 48}px`);
    expect(blockBox(gym).style.height).toBe('48px');
  });

  it('맨 위 종일 줄: 여러 날 종일 일정 포함, 시간표에는 없음 (US-08 AC)', async () => {
    await setup();
    const allDay = screen.getByRole('region', { name: '종일' });
    expect(await within(allDay).findByRole('button', { name: '3일 출장' })).toBeInTheDocument();
    expect(within(timetable()).queryByRole('button', { name: /3일 출장/ })).not.toBeInTheDocument();
  });

  it('PC 블록: 제목 + "일정 · 시작-끝 · 장소" (PC-03)', async () => {
    await setup();
    const meeting = await within(timetable()).findByRole('button', { name: /겹치는 회의/ });
    expect(meeting).toHaveTextContent('겹치는 회의');
    expect(meeting).toHaveTextContent('일정 · 19:30-20:30 · 회의실 A');
    expect(within(timetable()).getByRole('button', { name: /헬스장/ })).toHaveTextContent('일정 · 07:00-08:00');
  });

  it('블록 색: 왼쪽 띠 = 카테고리 색, 몸통 = 일정 색 (D-019)', async () => {
    await setup();
    const dentist = await within(timetable()).findByRole('button', { name: /치과/ });
    const style = dentist.closest('[data-block-body]')!.getAttribute('style')!;
    expect(style).toMatch(/#2F62A8 0 5px|rgb\(47, 98, 168\) 0(px)? 5px/i);
    expect(style).toMatch(/#3F3F3F 5px|rgb\(63, 63, 63\) 5px/i);
  });

  it('겹치는 일정은 칸을 나눠 나란히 (D-045)', async () => {
    await setup();
    const a = blockBox(await within(timetable()).findByRole('button', { name: /영어 회화/ }));
    const b = blockBox(within(timetable()).getByRole('button', { name: /겹치는 회의/ }));
    expect(a.style.width).toBe('50%');
    expect(b.style.width).toBe('50%');
    expect(a.style.left).not.toBe(b.style.left);
  });

  it('자정을 넘은 일정은 다음 날 00:00부터 (9/30 새벽 배포 00~01시)', async () => {
    await setup('pc', '2026-09-30');
    const deploy = blockBox(await within(timetable()).findByRole('button', { name: /새벽 배포/ }));
    expect(deploy.style.top).toBe('0px');
    expect(deploy.style.height).toBe('48px');
  });

  it('긴 제목은 줄바꿈 후 칸이 부족하면 … (D-023), 아랫줄 설명 자리만큼 줄 수가 준다', async () => {
    await setup();
    const title = (await screen.findByRole('button', { name: new RegExp(LONG_TITLE.slice(0, 10)) })).querySelector('[data-title]') as HTMLElement;
    // 2시간 = 96px − 틈 2 − 설명 줄 14 → 80px, 13px 글자 줄 높이 16.25 → 4줄
    expect(title.getAttribute('style')).toMatch(/-webkit-line-clamp: 4/);
  });

  it('블록을 누르면 수정 창, URL은 링크 아이콘 (D-021)', async () => {
    const { onOpenSchedule, user } = await setup('pc', '2026-09-21');
    await user.click(await within(timetable()).findByRole('button', { name: /팀 주간 회의/ }));
    expect(onOpenSchedule).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(screen.getByRole('link', { name: '팀 주간 회의 링크 열기' })).toHaveAttribute('target', '_blank');
  });

  it('오늘이면 현재 시각 선, 1분마다 움직인다 (CAL-06)', async () => {
    await setup();
    expect(within(timetable()).getByRole('separator', { name: '현재 시각 14:30' }).style.top).toBe(`${14.5 * 48}px`);
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(within(timetable()).getByRole('separator', { name: '현재 시각 14:31' })).toBeInTheDocument();
  });

  it('오늘이 아니면 현재 시각 선이 없다', async () => {
    await setup('pc', '2026-09-24');
    expect(screen.queryByRole('separator', { name: /현재 시각/ })).not.toBeInTheDocument();
  });

  describe('처음 보이는 위치 (D-046, 화면 높이 600px)', () => {
    beforeEach(() => {
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600);
    });
    const scrollTop = () => screen.getByTestId('timetable-scroll').scrollTop;

    it('오늘: 현재 시각이 가운데', async () => {
      await setup();
      expect(scrollTop()).toBe(8 + 14.5 * 48 - 300);
    });

    it('다른 날: 그날 가장 이른 일정(09:00) 1시간 전(08:00)이 위쪽', async () => {
      await setup('pc', '2026-10-06', [schedule({ id: 30, start: '2026-10-06T09:00:00', end: '2026-10-06T10:00:00' })]);
      await waitFor(() => expect(scrollTop()).toBe(8 * 48));
    });

    it('주간에서 넘어오면 보던 시간(10:00)이 그대로 맨 위 (D-046 ②)', async () => {
      mockApi({ 'GET /schedules': () => json(200, SCHEDULES), 'GET /categories': () => json(200, CATEGORIES) });
      const store = makeStore();
      store.dispatch(setViewMode('WEEK'));
      store.dispatch(setTimetableTopMinutes(600));
      store.dispatch(openDayView('2026-09-23'));
      renderWithStore(<CalendarDaily variant="pc" onOpenSchedule={vi.fn()} />, { store });
      expect(scrollTop()).toBe(10 * 48);
    });
  });
});

describe('모바일 일간 (MO-03)', () => {
  it('탭: 시간표 선택됨, Todo·일기는 아직 막힘 (M2·M3)', async () => {
    await setup('mobile');
    const tabs = screen.getByRole('tablist', { name: '일간 보기' });
    expect(within(tabs).getByRole('tab', { name: '시간표' })).toHaveAttribute('aria-selected', 'true');
    expect(within(tabs).getByRole('tab', { name: 'Todo' })).toBeDisabled();
    expect(within(tabs).getByRole('tab', { name: '일기' })).toBeDisabled();
  });

  it('1시간 = 46px, 블록은 제목만', async () => {
    await setup('mobile');
    const gym = await within(timetable()).findByRole('button', { name: /헬스장/ });
    expect(blockBox(gym).style.top).toBe(`${7 * 46}px`);
    expect(gym).toHaveTextContent(/^헬스장$/);
  });

  it('모바일 일간은 칸이 넓어 링크 아이콘을 보인다 (D-045는 7칸만 숨김)', async () => {
    await setup('mobile', '2026-09-21');
    expect(await screen.findByRole('link', { name: '팀 주간 회의 링크 열기' })).toBeInTheDocument();
  });
});
