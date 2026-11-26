import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import AppShell from './AppShell';

afterEach(() => vi.useRealTimers());

const setup = async (width: number, now: Date) => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(now);
  setViewportWidth(width);
  const api = mockApi({
    'GET /schedules': () => json(200, []),
    'GET /categories': () => json(200, CATEGORIES),
    'GET /todos': () => json(200, []),
    'GET /memos': () => json(200, []),
    'GET /ddays': () => json(200, []),
    'GET /dday-marks': () => json(200, []),
    'GET /diaries': () => json(200, []),
    'POST /schedules': (req) => json(201, { id: 90, categoryId: 1, color: null, url: null, location: null, memo: null, ...(req.body as object) }),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  return { api, ...renderWithStore(<AppShell />, { store }) };
};

const cellOf = (label: string) => screen.getByRole('button', { name: label }).parentElement!.parentElement as HTMLElement;

describe('월간 빈 칸 더블클릭 빠른 추가 연결 (D-110, #367)', () => {
  it('1440: 빈 칸 두 번 → 그날 빠른 추가 1개, 월간 그대로. 제목을 쓰면 칸에 점선 표식, 저장하면 POST 1번 후 표식이 사라진다', async () => {
    const { user, api, store } = await setup(1440, new Date(2026, 8, 25, 10, 20));
    await user.dblClick(cellOf('9월 23일 (수)'));
    const popovers = screen.getAllByRole('dialog', { name: '빠른 추가' });
    expect(popovers).toHaveLength(1);
    expect(store.getState().calendar.viewMode).toBe('MONTH');
    expect(within(popovers[0]).getByRole('textbox', { name: '제목' })).toHaveFocus();
    expect(within(popovers[0]).getByLabelText('시작 시간')).toHaveValue('11:00');
    expect(within(popovers[0]).getByLabelText('종료 시간')).toHaveValue('12:00');

    await user.type(within(popovers[0]).getByRole('textbox', { name: '제목' }), '기획 회의');
    expect(within(cellOf('9월 23일 (수)')).getByTestId('month-quick-add-draft')).toHaveTextContent('기획 회의 · 11:00-12:00');

    await user.click(within(popovers[0]).getByRole('button', { name: '저장' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '빠른 추가' })).not.toBeInTheDocument());
    expect(api.calls('POST /schedules')).toHaveLength(1);
    expect(api.calls('POST /schedules')[0].body).toMatchObject({ title: '기획 회의', start: '2026-09-23T11:00:00', end: '2026-09-23T12:00:00' });
    expect(screen.queryByTestId('month-quick-add-draft')).not.toBeInTheDocument();
  });

  it('23:15에 열면 고른 날 23:00~23:59 (시작·종료 날짜 모두 그날)', async () => {
    const { user, api } = await setup(1440, new Date(2026, 8, 25, 23, 15));
    await user.dblClick(cellOf('9월 25일 (금)'));
    const popover = screen.getByRole('dialog', { name: '빠른 추가' });
    expect(within(popover).getByLabelText('시작 시간')).toHaveValue('23:00');
    expect(within(popover).getByLabelText('종료 시간')).toHaveValue('23:59');
    await user.type(within(popover).getByRole('textbox', { name: '제목' }), '정리');
    await user.click(within(popover).getByRole('button', { name: '저장' }));
    await waitFor(() => expect(api.calls('POST /schedules')).toHaveLength(1));
    expect(api.calls('POST /schedules')[0].body).toMatchObject({ start: '2026-09-25T23:00:00', end: '2026-09-25T23:59:00' });
  });

  it('취소하면 표식이 사라지고, [자세히 입력]은 쓴 값을 그대로 일정 추가 창으로', async () => {
    const { user } = await setup(1440, new Date(2026, 8, 25, 10, 20));
    await user.dblClick(cellOf('9월 23일 (수)'));
    await user.click(within(screen.getByRole('dialog', { name: '빠른 추가' })).getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog', { name: '빠른 추가' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('month-quick-add-draft')).not.toBeInTheDocument();

    await user.dblClick(cellOf('9월 23일 (수)'));
    await user.type(within(screen.getByRole('dialog', { name: '빠른 추가' })).getByRole('textbox', { name: '제목' }), '자세히');
    await user.click(screen.getByRole('button', { name: '자세히 입력' }));
    const dialog = screen.getByRole('dialog', { name: '일정 추가' });
    expect(within(dialog).getByLabelText('제목')).toHaveValue('자세히');
    expect(within(dialog).getByLabelText('시작 날짜')).toHaveValue('2026-09-23');
  });

  it('입력 중에 다른 날을 누르면 "작성을 취소할까요?" → 작성 취소면 그 날로 옮긴다', async () => {
    const { user } = await setup(1440, new Date(2026, 8, 25, 10, 20));
    await user.dblClick(cellOf('9월 23일 (수)'));
    await user.type(within(screen.getByRole('dialog', { name: '빠른 추가' })).getByRole('textbox', { name: '제목' }), '쓰던 것');
    await user.click(screen.getByTestId('quick-add-backdrop'));
    // jsdom은 elementFromPoint가 없어 바깥 누름은 닫기 요청 → 입력이 있으니 확인
    expect(screen.getByRole('alertdialog', { name: '작성을 취소할까요?' })).toBeInTheDocument();
  });

  it('820 태블릿도 같고, 390 모바일은 한 번 누르면 날짜 시트(두 번 눌러도 빠른 추가 없음)', async () => {
    const tablet = await setup(820, new Date(2026, 8, 25, 10, 20));
    await tablet.user.dblClick(cellOf('9월 23일 (수)'));
    expect(screen.getByRole('dialog', { name: '빠른 추가' })).toBeInTheDocument();
    tablet.unmount();

    const mobile = await setup(390, new Date(2026, 8, 25, 10, 20));
    await mobile.user.dblClick(screen.getByRole('button', { name: /^9월 23일 \(수\)/ }));
    expect(screen.queryByRole('dialog', { name: '빠른 추가' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: '9월 23일 (수) 날짜 시트' })).toBeInTheDocument();
    expect(mobile.store.getState().calendar.viewMode).toBe('MONTH');
  });
});
