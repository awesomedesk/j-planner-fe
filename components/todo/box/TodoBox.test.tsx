import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES, todo } from '@/test/fixtures';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { setCategoryFilter } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import { TodoActionsContext } from '../TodoActionsContext';
import TodoBox from './TodoBox';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});
afterEach(() => vi.useRealTimers());

const TODOS = [
  todo({ id: 1, title: '기획서 초안', time: { start: '11:00', durationMinutes: 90 }, categoryId: 3 }),
  todo({ id: 2, title: '장보기' }),
  todo({ id: 3, title: '보고서 작성', type: 'PERIOD', startDate: '2026-09-21', endDate: '2026-09-30', categoryId: 3 }),
  todo({ id: 4, title: '러닝 3회', type: 'WEEK', startDate: '2026-09-20', endDate: '2026-09-26', categoryId: 4 }),
  todo({ id: 5, title: '책 1권 읽기', type: 'MONTH', startDate: '2026-09-01', endDate: '2026-09-30', categoryId: 2 }),
  todo({ id: 6, title: '물 2L', completed: true, completedAt: '2026-09-25T08:00:00' }),
];

const setup = async (routes: Parameters<typeof mockApi>[0] = {}, filter: number[] | null = null) => {
  const api = mockApi({
    'GET /categories': () => json(200, CATEGORIES),
    'GET /todos': () => json(200, TODOS),
    'PATCH /todos/:id': (req) => json(200, { ...TODOS.find((t) => `/todos/${t.id}` === req.path), ...(req.body as object) }),
    ...routes,
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  if (filter) store.dispatch(setCategoryFilter(filter));
  const openTodo = vi.fn();
  const view = renderWithStore(
    <TodoActionsContext.Provider value={{ openTodo }}>
      <TodoBox date="2026-09-25" />
    </TodoActionsContext.Provider>,
    { store }
  );
  await screen.findByRole('list', { name: '9월 25일 (금) Todo' });
  return { api, openTodo, ...view, store };
};

const list = () => screen.getByRole('list', { name: '9월 25일 (금) Todo' });
const titles = () => within(list()).getAllByRole('listitem').map((li) => within(li).getByRole('button', { name: /수정$/ }).textContent);

describe('그날의 Todo 한 박스 (US-13, D-013)', () => {
  it('그날 박스를 받는다: GET /todos?date=', async () => {
    const { api } = await setup();
    expect(api.calls('GET /todos')[0].query.toString()).toBe('date=2026-09-25');
  });

  it('종류를 나누지 않고 한 박스, 서버가 준 순서(사용자 순서) 그대로. 완료한 것은 숨김 (D-015)', async () => {
    await setup();
    expect(titles()).toEqual(['기획서 초안', '장보기', '보고서 작성', '러닝 3회', '책 1권 읽기']);
  });

  it('종류는 꼬리표로만: 기간 ~마감일, 주간, 월간. 시간이 있으면 시작 시각', async () => {
    await setup();
    const row = (name: string) => within(list()).getByRole('button', { name: `${name} 수정` }).closest('li') as HTMLElement;
    expect(row('기획서 초안')).toHaveTextContent('11:00');
    expect(row('보고서 작성')).toHaveTextContent('기간');
    expect(row('보고서 작성')).toHaveTextContent('~9/30');
    expect(row('러닝 3회')).toHaveTextContent('주간');
    expect(row('책 1권 읽기')).toHaveTextContent('월간');
    expect(row('장보기')).not.toHaveTextContent(/기간|주간|월간/);
  });

  it("머리에 '완료/전체' 수", async () => {
    await setup();
    expect(screen.getByText('1/6')).toBeInTheDocument();
  });

  it("'완료 1개 보기'로 완료한 Todo를 펼친다", async () => {
    const { user } = await setup();
    const toggle = screen.getByRole('button', { name: '완료 1개 보기' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    const done = screen.getByRole('list', { name: '완료한 Todo' });
    expect(within(done).getByRole('checkbox', { name: '물 2L 완료' })).toBeChecked();
    expect(screen.getByRole('button', { name: '완료 1개 접기' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('체크하면 PATCH { completed: true } 하고 박스에서 숨김 (기간·주간도 한 번이면 완료, D-027)', async () => {
    const { api, user } = await setup();
    await user.click(screen.getByRole('checkbox', { name: '러닝 3회 완료' }));
    expect(titles()).not.toContain('러닝 3회');
    expect(screen.getByRole('button', { name: '완료 2개 보기' })).toBeInTheDocument();
    await waitFor(() => expect(api.calls('PATCH /todos/:id')).toHaveLength(1));
    expect(api.calls('PATCH /todos/:id')[0]).toMatchObject({ path: '/todos/4', body: { completed: true } });
  });

  it('완료를 풀면 박스로 돌아온다', async () => {
    const { api, user } = await setup();
    await user.click(screen.getByRole('button', { name: '완료 1개 보기' }));
    await user.click(screen.getByRole('checkbox', { name: '물 2L 완료' }));
    expect(titles()).toContain('물 2L');
    await waitFor(() => expect(api.calls('PATCH /todos/:id')[0]).toMatchObject({ path: '/todos/6', body: { completed: false } }));
  });

  it('저장에 실패하면 되돌리고 짧은 안내', async () => {
    const { store, user } = await setup({ 'PATCH /todos/:id': () => problem(500, 'INTERNAL_ERROR', '서버 오류가 났어요') });
    await user.click(screen.getByRole('checkbox', { name: '장보기 완료' }));
    await waitFor(() => expect(titles()).toContain('장보기'));
    expect(store.getState().notice.items.map((n) => n.message)).toContain('서버 오류가 났어요');
  });

  it('제목을 누르면 Todo 수정 창을 연다 (US-12 Q1)', async () => {
    const { user, openTodo } = await setup();
    await user.click(screen.getByRole('button', { name: '장보기 수정' }));
    expect(openTodo).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
  });

  it('카테고리 필터를 같이 보낸다 (CAT-03)', async () => {
    const { api } = await setup({}, [2, 3]);
    expect(api.calls('GET /todos')[0].query.toString()).toBe('date=2026-09-25&categoryId=2&categoryId=3');
  });

  it('비어 있으면 안내', async () => {
    mockApi({ 'GET /categories': () => json(200, CATEGORIES), 'GET /todos': () => json(200, []) });
    const store = makeStore();
    renderWithStore(<TodoBox date="2026-09-25" />, { store });
    expect(await screen.findByText('Todo가 없어요')).toBeInTheDocument();
  });
});
