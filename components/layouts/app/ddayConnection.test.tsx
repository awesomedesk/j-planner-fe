import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DdayMark } from '@/types/api';
import { ddayFixture } from '@/test/ddayFixtures';
import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';
import { setViewMode } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import AppShell from './AppShell';
import { getDayTabSlots } from './dayTabSlots';
import { SIDEBAR_SECTION_SLOTS } from './sidebarSectionSlots';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0)); // 2026-09-25(금)
});
afterEach(() => vi.useRealTimers());

const EXAM = ddayFixture({ id: 1, title: '기말 시험', targetDate: '2026-09-28', today: { value: -3, label: 'D-3' } });
const MARKS: DdayMark[] = [{ ddayId: 1, date: '2026-09-28', label: 'D-Day', kind: 'TARGET' }];

const setup = async (width: number) => {
  setViewportWidth(width);
  let list = [EXAM];
  const api = mockApi({
    'GET /schedules': () => json(200, []),
    'GET /categories': () => json(200, CATEGORIES),
    'GET /todos': () => json(200, []),
    'GET /memos': () => json(200, []),
    'GET /ddays': () => json(200, list),
    'GET /dday-marks': () => json(200, MARKS),
    'POST /ddays': (req) => {
      const created = ddayFixture({ id: 2, ...(req.body as object), today: { value: 0, label: 'D-Day' } });
      list = [...list, created];
      return json(201, created);
    },
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  return { api, ...renderWithStore(<AppShell />, { store }) };
};

describe('D-Day 연결 지점 (US-22·23)', () => {
  it('사이드바·폴드 패널 D-Day 섹션, 모바일 일간 D-Day 탭이 꽂혀 있다 (D-049)', () => {
    expect(SIDEBAR_SECTION_SLOTS.DDAY).toBeDefined();
    expect(getDayTabSlots().DDAY).toBeDefined();
  });

  it('PC 헤더 추가 > D-Day → 고른 날짜로 새 D-Day 창, 저장하면 목록 맨 아래·달력 표시를 다시 받는다', async () => {
    const { user, api } = await setup(1440);
    const sidebar = screen.getByRole('complementary', { name: '사이드바' });
    const section = within(sidebar).getByRole('region', { name: 'D-Day' });
    await within(section).findByRole('button', { name: '기말 시험 D-3 수정' });

    await user.click(screen.getByRole('button', { name: '9월 23일 (수)' }));
    await user.click(screen.getAllByRole('button', { name: '추가' })[0]);
    await user.click(screen.getByRole('menuitem', { name: 'D-Day' }));
    const dialog = screen.getByRole('dialog', { name: 'D-Day 추가' });
    expect(within(dialog).getByLabelText('날짜')).toHaveValue('2026-09-23');

    await user.type(within(dialog).getByRole('textbox', { name: '제목' }), '여행');
    const marksBefore = api.calls('GET /dday-marks').length;
    await user.click(within(dialog).getAllByRole('button', { name: '저장' })[0]);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'D-Day 추가' })).not.toBeInTheDocument());
    await waitFor(() => expect(api.calls('GET /dday-marks').length).toBeGreaterThan(marksBefore));
    const rows = await within(section).findAllByRole('listitem');
    expect(rows.at(-1)).toHaveTextContent('여행');
  });

  it('사이드바 행을 누르면 D-Day 수정 창', async () => {
    const { user } = await setup(1440);
    const sidebar = screen.getByRole('complementary', { name: '사이드바' });
    await user.click(await within(sidebar).findByRole('button', { name: '기말 시험 D-3 수정' }));
    expect(screen.getByRole('dialog', { name: 'D-Day 수정' })).toBeInTheDocument();
  });

  it('달력의 D-Day 표시를 누르면 그 D-Day 수정 창', async () => {
    const { user } = await setup(1440);
    await user.click(await within(screen.getByLabelText('월간 달력')).findByRole('button', { name: 'D-Day 기말 시험' }));
    expect(screen.getByRole('dialog', { name: 'D-Day 수정' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('기말 시험');
  });

  it('모바일 + > D-Day 추가 → 새 D-Day 창', async () => {
    const { user } = await setup(390);
    await user.click(screen.getAllByRole('button', { name: '추가' }).at(-1)!);
    await user.click(screen.getByRole('menuitem', { name: 'D-Day 추가' }));
    expect(screen.getByRole('dialog', { name: 'D-Day 추가' })).toBeInTheDocument();
  });

  it('모바일 일간 D-Day 탭: 탭이 눌리고 목록이 보인다, 머리 줄에 < > 없음 (D-049)', async () => {
    const { user, store } = await setup(390);
    store.dispatch(setViewMode('DAY'));
    await user.click(await screen.findByRole('tab', { name: 'D-Day' }));
    const panel = screen.getByRole('tabpanel', { name: 'D-Day' });
    expect(await within(panel).findByRole('button', { name: '기말 시험 D-3 수정' })).toBeInTheDocument();
    const header = screen.getByRole('banner', { name: '모바일 머리' });
    expect(within(header).queryByRole('button', { name: /이전|다음/ })).not.toBeInTheDocument();
  });
});
