import { act, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';
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
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});
afterEach(() => vi.useRealTimers());

const setup = async (width: number) => {
  setViewportWidth(width);
  mockApi({
    'GET /schedules': () => json(200, SEED_SCHEDULES),
    'GET /categories': () => json(200, CATEGORIES),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  return renderWithStore(<AppShell />, { store });
};

// jsdom은 Tailwind 클래스를 적용하지 않으므로 (hidden tablet:flex) 폭별 차이는 JS로 갈리는 부분만 확인한다.
describe('화면 틀 (US-01, D-018)', () => {
  it('1440px: 사이드바가 열린 채 시작하고, 달력은 막대', async () => {
    await setup(1440);
    expect(screen.getByRole('complementary', { name: '사이드바' })).toBeInTheDocument();
    const monthly = screen.getByLabelText('월간 달력');
    expect(await within(monthly).findByRole('button', { name: /치과/ })).toBeInTheDocument();
    expect(within(monthly).queryByRole('button', { name: /일정 \d+개/ })).not.toBeInTheDocument(); // 색 점 아님
  });

  it('820px: 사이드바는 닫힌 막대로 시작, 열면 열린다', async () => {
    const { user } = await setup(820);
    const closed = screen.getByRole('complementary', { name: '사이드바 (닫힘)' });
    await user.click(within(closed).getAllByRole('button')[0]);
    expect(screen.getByRole('complementary', { name: '사이드바' })).toBeInTheDocument();
  });

  it('390px: 달력은 색 점, 날짜를 누르면 아래 날짜 시트 (MO-01)', async () => {
    const { user } = await setup(390);
    await user.click(await screen.findByRole('button', { name: '9월 25일 (금), 일정 4개' }));
    const sheet = screen.getByRole('region', { name: '9월 25일 (금) 날짜 시트' });
    expect(within(sheet).getByText('치과')).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: '시트 닫기' }));
    expect(screen.queryByRole('region', { name: /날짜 시트/ })).not.toBeInTheDocument();
  });
});

describe('추가 → 일정 입력 (US-05, D-015)', () => {
  it('고른 날짜를 기준으로 일정 추가 창이 열린다', async () => {
    const { user } = await setup(1440);
    await user.click(screen.getByRole('button', { name: '9월 23일 (수)' }));
    await user.click(screen.getAllByRole('button', { name: '추가' })[0]); // PC 헤더 (jsdom은 모바일 + 버튼도 그림)
    await user.click(screen.getByRole('menuitem', { name: '일정' }));
    const dialog = screen.getByRole('dialog', { name: '일정 추가' });
    expect(within(dialog).getByLabelText('시작 날짜')).toHaveValue('2026-09-23');
  });

  it('일정 막대를 누르면 수정 창', async () => {
    const { user } = await setup(1440);
    await user.click(await screen.findByRole('button', { name: /팀 주간 회의/ }));
    expect(screen.getByRole('dialog', { name: '일정 수정' })).toBeInTheDocument();
    expect(screen.getByLabelText('제목')).toHaveValue('팀 주간 회의');
  });
});

describe('보기 전환 (PC-01, US-07)', () => {
  it('주를 누르면 주간 시간표, 헤더 제목은 그 주 기간', async () => {
    const { user, store } = await setup(1440);
    expect(screen.getAllByRole('heading', { name: '2026년 9월' }).length).toBeGreaterThan(0);
    const group = screen.getByRole('group', { name: '보기 전환' });
    await user.click(within(group).getByRole('button', { name: '주' }));
    expect(store.getState().calendar.viewMode).toBe('WEEK');
    expect(within(group).getByRole('button', { name: '주' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('주간 시간표')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: '9월 20일 – 26일' }).length).toBeGreaterThan(0);
  });

  it('월간에서 고른 날짜의 주로 간다', async () => {
    const { user } = await setup(1440);
    await user.click(screen.getByRole('button', { name: '9월 30일 (수)' }));
    await user.click(within(screen.getByRole('group', { name: '보기 전환' })).getByRole('button', { name: '주' }));
    expect(screen.getAllByRole('heading', { name: '9월 27일 – 10월 3일' }).length).toBeGreaterThan(0);
  });

  it('주간 블록을 누르면 일정 수정 창', async () => {
    const { user } = await setup(1440);
    await user.click(within(screen.getByRole('group', { name: '보기 전환' })).getByRole('button', { name: '주' }));
    await user.click(await within(screen.getByLabelText('주간 시간표')).findByRole('button', { name: /치과/ }));
    expect(screen.getByRole('dialog', { name: '일정 수정' })).toBeInTheDocument();
  });

  it('390px 주간은 모바일 7칸 시간표 (MO-05)', async () => {
    const { store } = await setup(390);
    act(() => { store.dispatch(setViewMode('WEEK')); });
    const weekly = screen.getByLabelText('주간 시간표');
    expect(within(weekly).getByText('6')).toBeInTheDocument(); // 모바일 눈금은 시만
    expect(screen.getByRole('button', { name: '화면 선택' })).toHaveTextContent('주간'); // 지금 보기 (D-022)
  });
});
