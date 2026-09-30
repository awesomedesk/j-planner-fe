import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES, schedule } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { SEED_SCHEDULES } from '@/test/seed';
import { setResizeHeight } from '@/test/viewport';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import CalendarMonthly from './CalendarMonthly';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0)); // 2026-09-25(금)
});
afterEach(() => vi.useRealTimers());

const setup = async (variant: 'bars' | 'dots' = 'bars', schedules = SEED_SCHEDULES) => {
  const api = mockApi({
    'GET /schedules': () => json(200, schedules),
    'GET /categories': () => json(200, CATEGORIES),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  const onOpenSchedule = vi.fn();
  const onTapDate = vi.fn();
  const view = renderWithStore(<CalendarMonthly variant={variant} onOpenSchedule={onOpenSchedule} onTapDate={onTapDate} />, { store });
  return { api, onOpenSchedule, onTapDate, ...view };
};

const dayCell = (label: string) => screen.getByRole('button', { name: label }).parentElement!.parentElement as HTMLElement;

describe('월간 달력 (US-06)', () => {
  it('보이는 기간(첫 칸~마지막 칸)의 일정을 받는다', async () => {
    const { api } = await setup();
    await waitFor(() => expect(api.calls('GET /schedules')).toHaveLength(1));
    expect(api.calls('GET /schedules')[0].query.toString()).toBe('from=2026-08-30&to=2026-10-03');
  });

  it('주차 열: ISO 주차 36~40 (CAL-05, D-041)', async () => {
    await setup();
    for (const week of [36, 37, 38, 39, 40]) expect(screen.getByLabelText(`${week}주차`)).toBeInTheDocument();
  });

  it('요일 머리글: 일요일 빨강·토요일 파랑', async () => {
    await setup();
    expect(screen.getByText('일', { selector: 'div' })).toHaveClass('text-sunday');
    expect(screen.getByText('토', { selector: 'div' })).toHaveClass('text-saturday');
  });

  it('오늘 날짜 강조 (CAL-06)', async () => {
    await setup();
    expect(screen.getByRole('button', { name: '9월 25일 (금)' })).toHaveAttribute('aria-current', 'date');
  });

  it('일정 막대: 시작 시각 + 제목, 자정 넘는 일정은 다음 날에도 (시각 없이) (D-041)', async () => {
    await setup();
    const deploys = await screen.findAllByRole('button', { name: /새벽 배포/ });
    expect(deploys).toHaveLength(2);
    expect(deploys[0]).toHaveTextContent('23:00새벽 배포');
    expect(deploys[1]).toHaveTextContent(/^새벽 배포$/);
  });

  it('막대 색: 왼쪽 띠 = 카테고리 색, 몸통 = 일정 색 (D-019)', async () => {
    await setup();
    const bar = (await screen.findByRole('button', { name: /치과/ })).parentElement!;
    const style = bar.getAttribute('style')!;
    expect(style).toMatch(/#2F62A8 0 5px|rgb\(47, 98, 168\) 0(px)? 5px/i); // 공부
    expect(style).toMatch(/#3F3F3F 5px|rgb\(63, 63, 63\) 5px/i); // 일정 색
  });

  it('미지정 일정의 띠는 테마 Theme2 (D-037)', async () => {
    await setup();
    const bar = (await screen.findAllByRole('button', { name: /가족 여행/ }))[0].parentElement!;
    expect(bar.getAttribute('style')).toMatch(/var\(--tp-theme2\) 0(px)? 5px/);
  });

  it('막대를 누르면 수정 창, URL은 링크 아이콘으로 새 탭 (D-041)', async () => {
    const { onOpenSchedule, user } = await setup();
    await user.click(await screen.findByRole('button', { name: /팀 주간 회의/ }));
    expect(onOpenSchedule).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    const link = screen.getByRole('link', { name: '팀 주간 회의 링크 열기' });
    expect(link).toHaveAttribute('href', 'https://meet.example.com/team-weekly');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('날짜를 한 번 누르면 선택 + 옅은 테두리, 두 번 누르면 일간 (D-015, D-041)', async () => {
    const { store, user } = await setup();
    await user.click(screen.getByRole('button', { name: '9월 23일 (수)' }));
    expect(store.getState().calendar.selectedDate).toBe('2026-09-23');
    expect(dayCell('9월 23일 (수)').getAttribute('style')).toContain('var(--tp-theme2)');
    expect(dayCell('9월 25일 (금)').getAttribute('style')).toContain('var(--tp-theme1)'); // 오늘은 진한 강조 그대로

    await user.dblClick(screen.getByRole('button', { name: '9월 30일 (수)' }));
    expect(store.getState().calendar).toMatchObject({ viewMode: 'DAY', selectedDate: '2026-09-30' });
  });

  it('칸을 넘으면 "+n 더보기" → 그날 일정 전체 작은 창 (D-041)', async () => {
    setResizeHeight(400); // 5줄 × 80px → 막대 2칸
    const { user } = await setup();
    const more = await screen.findByRole('button', { name: '+3 더보기' });
    await user.click(more);
    const popover = screen.getByRole('dialog', { name: '9월 25일 (금) 일정' });
    expect(within(popover).getAllByRole('button', { name: /헬스장|치과|영어 회화|저녁 약속/ })).toHaveLength(4);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('월간 칸에는 Todo 요약을 표시하지 않는다 (D-021)', async () => {
    const { api } = await setup();
    await screen.findAllByRole('button', { name: /새벽 배포/ });
    expect(api.all().some((r) => r.path.startsWith('/todos'))).toBe(false);
  });
});

describe('날짜가 바뀌면 (CAL-06)', () => {
  it('앱을 켜 둔 채 자정을 넘기면 오늘 강조가 다음 날로 옮겨 간다', async () => {
    vi.useRealTimers(); // beforeEach의 가짜 시계(Date만)를 풀고, 1분 시계까지 가짜로 다시
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date(2026, 8, 25, 23, 59));
    await setup();
    expect(screen.getByRole('button', { name: '9월 25일 (금)' })).toHaveAttribute('aria-current', 'date');
    act(() => { vi.advanceTimersByTime(2 * 60_000); });
    expect(screen.getByRole('button', { name: '9월 26일 (토)' })).toHaveAttribute('aria-current', 'date');
    expect(screen.getByRole('button', { name: '9월 25일 (금)' })).not.toHaveAttribute('aria-current');
  });
});

describe('여러 날 종일 일정 (US-06)', () => {
  const TRIP = schedule({ id: 40, title: '출장', allDay: true, start: '2026-09-22T00:00:00', end: '2026-09-24T23:59:59' });
  const barsIn = (label: string, name: RegExp) => within(dayCell(label)).queryAllByRole('button', { name });

  it('걸친 날마다 막대, 시각 없이 제목만', async () => {
    await setup('bars', [TRIP]);
    await screen.findAllByRole('button', { name: /출장/ });
    for (const day of ['9월 22일 (화)', '9월 23일 (수)', '9월 24일 (목)']) {
      const [bar] = barsIn(day, /출장/);
      expect(bar).toHaveTextContent(/^출장$/);
    }
    expect(barsIn('9월 21일 (월)', /출장/)).toHaveLength(0);
    expect(barsIn('9월 25일 (금)', /출장/)).toHaveLength(0);
  });

  it('주(줄)를 넘으면 다음 줄에도 이어서 (9/26 토 → 9/27 일)', async () => {
    await setup('bars', [schedule({ id: 5, title: '가족 여행', allDay: true, start: '2026-09-26T00:00:00', end: '2026-09-27T23:59:59' })]);
    await screen.findAllByRole('button', { name: /가족 여행/ });
    expect(barsIn('9월 26일 (토)', /가족 여행/)).toHaveLength(1);
    expect(barsIn('9월 27일 (일)', /가족 여행/)).toHaveLength(1);
  });

  it('같은 날엔 종일·여러 날 일정이 시각 일정보다 위', async () => {
    const gym = schedule({ id: 3, title: '헬스장', start: '2026-09-23T07:00:00', end: '2026-09-23T08:00:00' });
    await setup('bars', [gym, TRIP]);
    await screen.findAllByRole('button', { name: /출장/ });
    const titles = within(dayCell('9월 23일 (수)')).getAllByRole('button').map((b) => b.textContent);
    expect(titles.indexOf('출장')).toBeLessThan(titles.indexOf('07:00헬스장'));
  });

  it('모바일 색 점: 걸친 날마다 점, 일정 수에도 들어간다', async () => {
    await setup('dots', [TRIP]);
    expect(await screen.findByRole('button', { name: '9월 22일 (화), 일정 1개' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '9월 24일 (목), 일정 1개' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '9월 25일 (금)' })).toBeInTheDocument();
  });
});

describe('모바일 월간 (MO-01)', () => {
  it('칸에 서로 다른 카테고리 색 점, 날짜를 누르면 시트용 콜백', async () => {
    const { onTapDate, user } = await setup('dots');
    const friday = await screen.findByRole('button', { name: '9월 25일 (금), 일정 4개' });
    expect(friday.querySelectorAll('span[aria-hidden="true"] > span')).toHaveLength(2); // 운동(색 없음→기본색 #2F62A8)=공부 색이라 한 점 + 업무 = 2색 (같은 색은 한 번만)
    await user.click(friday);
    expect(onTapDate).toHaveBeenCalledWith('2026-09-25');
  });
});
