import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Todo } from '@/types/api';
import { CATEGORIES, todo } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setCategoryFilter } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { refreshTodos } from '@store/slices/todoSlice';
import { makeStore } from '@store/store';

import UnscheduledTodoNotice from './UnscheduledTodoNotice';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0)); // 9/25(금) 10:00
});
afterEach(() => vi.useRealTimers());

const TODOS = [
  todo({ id: 1, title: '기획서 초안', time: { start: '11:00', durationMinutes: 90 }, categoryId: 3 }),
  todo({ id: 2, title: '장보기' }),
  todo({ id: 3, title: '책 1권 읽기', type: 'MONTH', startDate: '2026-09-01', endDate: '2026-09-30', categoryId: 2 }),
  todo({ id: 4, title: '물 2L', completed: true, completedAt: '2026-09-25T08:00:00' }),
  todo({ id: 5, title: '지난 빨래', startDate: '2026-09-20', endDate: '2026-09-20', overdue: true }),
];

const setup = async (variant: 'pc' | 'mobile', todos: Todo[] = TODOS, filter: number[] | null = null) => {
  let current = todos;
  const api = mockApi({
    'GET /categories': () => json(200, CATEGORIES),
    'GET /todos': () => json(200, current),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  if (filter) store.dispatch(setCategoryFilter(filter));
  const onPick = vi.fn();
  const view = renderWithStore(<UnscheduledTodoNotice date="2026-09-25" variant={variant} onPick={onPick} />, { store });
  const setTodos = (next: Todo[]) => {
    current = next;
  };
  return { api, onPick, setTodos, ...view };
};

describe('PC 일간 시간 미지정 Todo 안내 (US-18, PC-03 ⑧)', () => {
  it('그날 박스와 같은 요청(GET /todos?date=)으로 받고, 시간 없는 미완료 수와 제목 (US-18 Q1)', async () => {
    const { api } = await setup('pc');
    const notice = await screen.findByRole('region', { name: '시간 미지정 Todo' });
    expect(within(notice).getByText('시간 미지정 Todo 2개')).toBeInTheDocument();
    expect(within(notice).getByRole('button', { name: '장보기 시간 지정' })).toBeInTheDocument();
    expect(within(notice).getByRole('button', { name: '책 1권 읽기 시간 지정' })).toBeInTheDocument();
    expect(within(notice).queryByRole('button', { name: /기획서 초안|물 2L|지난 빨래/ })).not.toBeInTheDocument();
    expect(api.calls('GET /todos')[0].query.toString()).toBe('date=2026-09-25');
  });

  it("설명: '제목을 누르면 시간을 정할 수 있어요' (US-18 Q2)", async () => {
    await setup('pc');
    expect(await screen.findByText('제목을 누르면 시간을 정할 수 있어요')).toBeInTheDocument();
  });

  it('제목을 누르면 그 Todo로 시간 지정 (US-18 AC: 누르면 Todo 입력 창)', async () => {
    const { user, onPick } = await setup('pc');
    await user.click(await screen.findByRole('button', { name: '책 1권 읽기 시간 지정' }));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 3, title: '책 1권 읽기' }));
  });

  it('0개면 안내가 없다 (US-18 Q1)', async () => {
    const { api } = await setup('pc', [TODOS[0], TODOS[3]]);
    await waitFor(() => expect(api.calls('GET /todos')).toHaveLength(1));
    await act(async () => {}); // 응답 반영
    expect(screen.queryByRole('region', { name: '시간 미지정 Todo' })).not.toBeInTheDocument();
  });

  it('카테고리 필터를 따른다 (US-11): categoryId를 붙여 받는다', async () => {
    const { api } = await setup('pc', TODOS, [2]);
    await waitFor(() => expect(api.calls('GET /todos')).toHaveLength(1));
    expect(api.calls('GET /todos')[0].query.getAll('categoryId')).toEqual(['2']);
  });

  it('Todo를 저장해 박스를 다시 받으면 수가 줄어든다 (US-18 Q5)', async () => {
    const { store, setTodos } = await setup('pc');
    expect(await screen.findByText('시간 미지정 Todo 2개')).toBeInTheDocument();
    setTodos([TODOS[0], { ...TODOS[1], time: { start: '15:00', durationMinutes: 60 } }, TODOS[2], TODOS[3], TODOS[4]]);
    await act(async () => {
      await store.dispatch(refreshTodos());
    });
    expect(await screen.findByText('시간 미지정 Todo 1개')).toBeInTheDocument();
  });
});

describe('모바일 일간 시간 미지정 Todo 줄 (US-18, MO-03 ③)', () => {
  it("한 줄: '시간 미지정 Todo n개' + '시간 지정하기'", async () => {
    await setup('mobile');
    const bar = await screen.findByRole('button', { name: '시간 미지정 Todo 2개, 시간 지정하기' });
    expect(within(bar).getByText('시간 미지정 Todo 2개')).toBeInTheDocument();
    expect(within(bar).getByText('시간 지정하기')).toBeInTheDocument();
  });

  it('1개면 누르자마자 그 Todo로 (US-18 Q3)', async () => {
    const { user, onPick } = await setup('mobile', [TODOS[1]]);
    await user.click(await screen.findByRole('button', { name: '시간 미지정 Todo 1개, 시간 지정하기' }));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('2개 이상이면 아래 시트에 제목 목록 → 고르면 그 Todo로, 시트는 닫힘 (US-18 Q3)', async () => {
    const { user, onPick } = await setup('mobile');
    await user.click(await screen.findByRole('button', { name: '시간 미지정 Todo 2개, 시간 지정하기' }));
    expect(onPick).not.toHaveBeenCalled();
    const sheet = screen.getByRole('dialog', { name: '시간을 정할 Todo' });
    await user.click(within(sheet).getByRole('button', { name: '책 1권 읽기 시간 지정' }));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }));
    expect(screen.queryByRole('dialog', { name: '시간을 정할 Todo' })).not.toBeInTheDocument();
  });

  it('시트는 닫기 버튼·Esc로 닫힌다', async () => {
    const { user } = await setup('mobile');
    await user.click(await screen.findByRole('button', { name: '시간 미지정 Todo 2개, 시간 지정하기' }));
    await user.click(within(screen.getByRole('dialog', { name: '시간을 정할 Todo' })).getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '시간 미지정 Todo 2개, 시간 지정하기' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
